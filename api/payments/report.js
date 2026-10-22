import { getSignedInUser } from '../_lib/firebase-auth.js';
import { bookingRpc, hasBookingDatabaseConfig } from '../_lib/bookings.js';

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed.' });
  if (!process.env.FIREBASE_PROJECT_ID && !process.env.GOOGLE_CLOUD_PROJECT) {
    return response.status(503).json({ error: 'Firebase authentication is not configured.' });
  }
  if (!hasBookingDatabaseConfig()) return response.status(503).json({ error: 'Payment reporting is temporarily unavailable.' });

  const user = await getSignedInUser(request);
  if (!user) return response.status(401).json({ error: 'Sign in with a verified phone number to report payment.' });
  const bookingId = typeof request.body?.bookingId === 'string' ? request.body.bookingId.trim() : '';
  const utr = typeof request.body?.utr === 'string' ? request.body.utr.replace(/\s/g, '') : '';
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(bookingId)) {
    return response.status(400).json({ error: 'Invalid booking reference.' });
  }
  if (!/^\d{12}$/.test(utr)) return response.status(400).json({ error: 'Enter the 12-digit UTR shown by your UPI app or bank.' });

  try {
    await bookingRpc('bos_submit_payment_report', {
      p_booking_id: bookingId,
      p_user_id: user.id,
      p_utr: utr
    });
    return response.status(200).json({
      bookingId,
      status: 'PENDING',
      paymentReviewStatus: 'SUBMITTED',
      reportedUtr: utr,
      message: 'Payment details received. Your pass will be issued after BookOutSpot verifies the bank credit.'
    });
  } catch (error) {
    if (error.status === 400 || error.status === 409 || error.code === '23505') {
      return response.status(409).json({ error: 'This booking cannot accept that payment report. Check the UTR and booking status, then try again.' });
    }
    return response.status(503).json({ error: 'We could not record the payment report. Please try again.' });
  }
}
