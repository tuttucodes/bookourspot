import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

function getFirebaseAdminApp() {
  const existing = getApps().find((app) => app.name === 'bookourspot-api');
  if (existing) return existing;

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
  if (!projectId) throw new Error('Firebase Admin project is not configured.');

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const credential = serviceAccount
    ? cert(JSON.parse(serviceAccount))
    : applicationDefault();

  return initializeApp({ credential, projectId }, 'bookourspot-api');
}

export async function getSignedInUser(request) {
  const authorization = request.headers.authorization || '';
  const match = authorization.match(/^Bearer\s+([^\s]+)$/i);
  const token = match?.[1];
  if (!token) return null;

  try {
    const decoded = await getAuth(getFirebaseAdminApp()).verifyIdToken(token, true);
    if (typeof decoded.uid !== 'string' || !decoded.uid) return null;
    // A Firebase phone_number claim is present only after the user verified the
    // number through Firebase Phone Auth. Enforce this on the server as well as
    // the UI so callers cannot bypass the required-phone onboarding gate.
    if (typeof decoded.phone_number !== 'string' || !/^\+[1-9]\d{7,14}$/.test(decoded.phone_number)) return null;

    // Keep the `id` alias used by the booking routes and SQL RPC payloads.
    return {
      id: decoded.uid,
      uid: decoded.uid,
      email: decoded.email || null,
      emailVerified: decoded.email_verified === true,
      phoneNumber: decoded.phone_number || null
    };
  } catch {
    return null;
  }
}

// Use only from a server route that has already authenticated and authorized
// its caller (the payment admin queue) to look up another user's contact data.
export async function getFirebaseUserContact(uid) {
  try {
    const user = await getAuth(getFirebaseAdminApp()).getUser(uid);
    return {
      email: user.email || null,
      phoneNumber: user.phoneNumber || null
    };
  } catch {
    return { email: null, phoneNumber: null };
  }
}
