import {
  EmailAuthProvider,
  GoogleAuthProvider,
  RecaptchaVerifier,
  linkWithPhoneNumber,
  linkWithCredential,
  linkWithPopup,
  linkWithRedirect,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { firebaseAuth, isFirebaseConfigured } from './firebaseClient.js';

let phoneConfirmation = null;
let phoneRecaptcha = null;
let pendingGoogleCredential = null;

function requireFirebase() {
  if (!isFirebaseConfigured || !firebaseAuth) {
    throw new Error('Firebase sign-in is not configured. Add the VITE_FIREBASE_* settings and reload.');
  }
  return firebaseAuth;
}

function mapUser(user) {
  return user ? {
    id: user.uid,
    uid: user.uid,
    email: user.email || '',
    name: user.displayName || user.email?.split('@')[0] || '',
    phone: user.phoneNumber || '',
    phoneVerified: Boolean(user.phoneNumber),
    photoURL: user.photoURL || '',
    emailVerified: user.emailVerified,
  } : null;
}

export async function getCurrentUser() {
  return firebaseAuth ? mapUser(firebaseAuth.currentUser) : null;
}

export function getLocalUser() {
  return mapUser(firebaseAuth?.currentUser);
}

export function setLocalUser() {
  // Kept as a compatibility hook for existing UI listeners; Firebase owns persistence.
  window.dispatchEvent(new Event('auth_state_changed'));
}

export async function signInWithGoogle() {
  try {
    const auth = requireFirebase();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    // Google establishes the identity; the app requires phone verification
    // immediately afterward before profile access or booking is enabled.
    const isAdminHost = window.location.hostname === 'admin.bookourspot.com';
    const result = auth.currentUser?.phoneNumber
      ? (isAdminHost ? await linkWithPopup(auth.currentUser, provider) : await linkWithRedirect(auth.currentUser, provider))
      : (isAdminHost ? await signInWithPopup(auth, provider) : await signInWithRedirect(auth, provider));
    if (!isAdminHost) return { success: true, redirecting: true };
    setLocalUser();
    return { success: true, user: mapUser(result.user) };
  } catch (err) {
    if (err?.code === 'auth/account-exists-with-different-credential') {
      pendingGoogleCredential = GoogleAuthProvider.credentialFromError(err);
      return { success: false, error: 'An account already uses this email. Sign in with that account first, then we’ll link Google for you.', code: err.code, email: err.customData?.email || '' };
    }
    return { success: false, error: formatAuthError(err) };
  }
}

export async function consumeGoogleRedirect() {
  try {
    const result = await getRedirectResult(requireFirebase());
    return { success: true, user: result?.user ? mapUser(result.user) : null };
  } catch (err) {
    if (err?.code === 'auth/account-exists-with-different-credential') {
      pendingGoogleCredential = GoogleAuthProvider.credentialFromError(err);
      return { success: false, error: 'An account already uses this email. Sign in with that account first, then we’ll link Google for you.', code: err.code, email: err.customData?.email || '' };
    }
    return { success: false, error: formatAuthError(err) };
  }
}

export async function signInWithEmail(email, password, createAccount = false) {
  try {
    const auth = requireFirebase();
    let credential;
    if (createAccount) {
      if (!auth.currentUser?.phoneNumber) {
        throw new Error('Verify your mobile number before creating an email sign-in.');
      }
      const emailCredential = EmailAuthProvider.credential(email.trim(), password);
      credential = await linkWithCredential(auth.currentUser, emailCredential);
    } else {
      // This path only signs in an existing email/password user; it can never create one.
      credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    }
    if (pendingGoogleCredential) {
      try {
        credential = await linkWithCredential(credential.user, pendingGoogleCredential);
        pendingGoogleCredential = null;
      } catch (linkError) {
        if (linkError?.code !== 'auth/credential-already-in-use' && linkError?.code !== 'auth/provider-already-linked') {
          return { success: false, error: formatAuthError(linkError) };
        }
        pendingGoogleCredential = null;
      }
    }
    setLocalUser();
    return { success: true, user: mapUser(credential.user) };
  } catch (err) {
    return { success: false, error: formatAuthError(err) };
  }
}

export async function updateAccountName(name) {
  try {
    const auth = requireFirebase();
    const cleanName = String(name || '').trim().replace(/\s+/g, ' ');
    if (cleanName.length < 2 || cleanName.length > 80) {
      throw new Error('Enter a name between 2 and 80 characters.');
    }
    if (!auth.currentUser) throw new Error('Sign in again to update your profile.');
    await updateProfile(auth.currentUser, { displayName: cleanName });
    await auth.currentUser.reload();
    setLocalUser();
    return { success: true, user: mapUser(auth.currentUser) };
  } catch (err) {
    return { success: false, error: formatAuthError(err) };
  }
}

export async function sendOtpToPhone(phone) {
  try {
    const auth = requireFirebase();
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`;
    if (!phoneRecaptcha) {
      phoneRecaptcha = new RecaptchaVerifier(auth, 'firebase-recaptcha-container', { size: 'invisible' });
    }
    // Existing email/Google accounts must attach a verified phone to the same UID.
    // New phone-first sign-ins continue to create/sign in through SMS.
    phoneConfirmation = auth.currentUser
      ? await linkWithPhoneNumber(auth.currentUser, formattedPhone, phoneRecaptcha)
      : await signInWithPhoneNumber(auth, formattedPhone, phoneRecaptcha);
    return { success: true };
  } catch (err) {
    phoneRecaptcha?.clear();
    phoneRecaptcha = null;
    phoneConfirmation = null;
    return { success: false, error: formatAuthError(err) };
  }
}

export async function verifyPhoneOtp(_phone, token) {
  try {
    if (!phoneConfirmation) throw new Error('Request a new verification code to continue.');
    const credential = await phoneConfirmation.confirm(token);
    phoneConfirmation = null;
    phoneRecaptcha?.clear();
    phoneRecaptcha = null;
    if (pendingGoogleCredential) {
      try {
        await linkWithCredential(credential.user, pendingGoogleCredential);
        pendingGoogleCredential = null;
      } catch (linkError) {
        if (linkError?.code === 'auth/provider-already-linked' || linkError?.code === 'auth/credential-already-in-use') {
          pendingGoogleCredential = null;
        } else {
          return { success: false, error: formatAuthError(linkError) };
        }
      }
    }
    setLocalUser();
    return { success: true, user: mapUser(credential.user) };
  } catch (err) {
    return { success: false, error: formatAuthError(err) };
  }
}

export async function signOutUser() {
  try {
    await signOut(requireFirebase());
  } finally {
    phoneConfirmation = null;
    phoneRecaptcha?.clear();
    phoneRecaptcha = null;
    setLocalUser();
  }
}

function formatAuthError(error) {
  const messages = {
    'auth/invalid-credential': 'The email or password is incorrect.',
    'auth/email-already-in-use': 'An account already exists for this email. Sign in instead.',
    'auth/credential-already-in-use': 'This mobile number is already linked to another account. Sign in with that account or contact support to merge your accounts.',
    'auth/account-exists-with-different-credential': 'An account already uses this email. Sign in with that account first, then link Google from your profile.',
    'auth/provider-already-linked': 'This sign-in method is already linked to your account.',
    'auth/weak-password': 'Choose a password with at least 6 characters.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/popup-closed-by-user': 'Google sign-in was closed before it finished.',
    'auth/unauthorized-domain': 'This domain is not authorized in Firebase Authentication settings.',
    'auth/too-many-requests': 'Too many attempts. Wait a little and try again.',
    'auth/invalid-verification-code': 'That code did not match. Check it and try again.',
    'auth/invalid-phone-number': 'Enter a valid phone number including its country code.',
    'auth/captcha-check-failed': 'Phone verification could not confirm this browser. Refresh and try again.',
  };
  return messages[error?.code] || error?.message || 'Sign-in could not be completed. Please try again.';
}
