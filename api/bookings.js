import { getSignedInUser } from './_lib/firebase-auth.js';
import { getUserBookings, hasBookingDatabaseConfig } from './_lib/bookings.js';

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'GET') return response.status(405).json({ error: 'Method not allowed.' });
  if (!process.env.FIREBASE_PROJECT_ID && !process.env.GOOGLE_CLOUD_PROJECT) {
    return response.status(503).json({ error: 'Firebase authentication is not configured.' });
  }
  if (!hasBookingDatabaseConfig()) {
    return response.status(503).json({ error: 'Booking history is being set up. Please try again shortly.' });
  }

  const user = await getSignedInUser(request);
  if (!user) return response.status(401).json({ error: 'Sign in to view your bookings.' });

  try {
    const bookings = await getUserBookings(user.id);
    return response.status(200).json({ bookings });
  } catch {
    return response.status(503).json({ error: 'Booking history is temporarily unavailable.' });
  }
}
