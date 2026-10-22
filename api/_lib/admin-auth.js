import { getSignedInUser } from './firebase-auth.js';

const adminEmails = () => (process.env.BOOKOUTSPOT_ADMIN_EMAILS || 'rahulbabuk05@gmail.com')
  .split(',').map((email) => email.trim().toLowerCase()).filter(Boolean);

export async function requireAdmin(request) {
  const user = await getSignedInUser(request);
  if (!user) return { error: 'Sign in with a verified mobile number to continue.', status: 401 };
  if (user.emailVerified !== true || !adminEmails().includes(String(user.email || '').trim().toLowerCase())) {
    return { error: 'This account is not authorized to manage BookOutSpot.', status: 403 };
  }
  return { user };
}
