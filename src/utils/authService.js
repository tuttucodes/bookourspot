import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { firebaseAuth, isFirebaseConfigured } from './firebaseClient.js';

let phoneConfirmation = null;
let phoneRecaptcha = null;

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
    const result = await signInWithPopup(auth, provider);
    setLocalUser();
    return { success: true, user: mapUser(result.user) };
  } catch (err) {
    return { success: false, error: formatAuthError(err) };
  }
}

export async function signInWithEmail(email, password, createAccount = false) {
  try {
    const auth = requireFirebase();
    const credential = createAccount
      ? await createUserWithEmailAndPassword(auth, email.trim(), password)
      : await signInWithEmailAndPassword(auth, email.trim(), password);
    setLocalUser();
    return { success: true, user: mapUser(credential.user) };
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
    phoneConfirmation = await signInWithPhoneNumber(auth, formattedPhone, phoneRecaptcha);
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
