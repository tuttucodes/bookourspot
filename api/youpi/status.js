import { getSignedInUser } from '../_lib/firebase-auth.js';
import { getUserBookingStatus, hasBookingDatabaseConfig } from '../_lib/bookings.js';

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'GET') return response.status(405).json({ error: 'Method not allowed.' });
  if (!hasBookingDatabaseConfig()) return response.status(503).json({ error: 'Booking status is unavailable.' });
  const user = await getSignedInUser(request);
  if (!user) return response.status(401).json({ error: 'Sign in to check this booking.' });
  const bookingId = typeof request.query?.bookingId === 'string' ? request.query.bookingId : '';
  if (!/^[0-9a-f-]{36}$/i.test(bookingId)) return response.status(400).json({ error: 'Invalid booking reference.' });
  try {
    const booking = await getUserBookingStatus(user.id, bookingId);
    if (!booking) return response.status(404).json({ error: 'Booking not found.' });
    return response.status(200).json(booking);
  } catch {
    return response.status(503).json({ error: 'Booking status is temporarily unavailable.' });
  }
}
