import { randomUUID } from 'node:crypto';
import { getSignedInUser } from '../_lib/firebase-auth.js';
import { bookingRpc, hasBookingDatabaseConfig } from '../_lib/bookings.js';
import { normalizeBookingOrder } from '../_lib/booking-order.js';

const MERCHANT_NAME = 'BookOutSpot';
const MERCHANT_VPA = process.env.BOOKOUTSPOT_UPI_VPA || '9074417293@pthdfc';

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed.' });
  if (!process.env.FIREBASE_PROJECT_ID && !process.env.GOOGLE_CLOUD_PROJECT) {
    return response.status(503).json({ error: 'Firebase authentication is not configured.' });
  }
  if (!hasBookingDatabaseConfig()) return response.status(503).json({ error: 'Secure checkout is not available.' });
  const user = await getSignedInUser(request);
  if (!user) return response.status(401).json({ error: 'Verify your phone number before booking.' });

  const body = request.body || {};
  if (body.eventId !== 'halloween-affair') return response.status(400).json({ error: 'This event is not open for booking.' });
  const order = normalizeBookingOrder(body);
  if (!order) return response.status(400).json({ error: 'Check the ticket quantities and guest details, then try again.' });
  if (!/^[\w.-]{2,256}@[\w.-]{2,128}$/.test(MERCHANT_VPA)) return response.status(503).json({ error: 'UPI checkout is not configured.' });

  const bookingId = randomUUID();
  try {
    await bookingRpc('bos_create_pending_booking', {
      p_booking_id: bookingId, p_user_id: user.id, p_event_id: body.eventId,
      p_tier_type: order.tierType, p_quantity: order.quantity,
      p_total_amount: order.totalAmount, p_items: order.items
    });
    // Use our immutable booking UUID as the UPI transaction reference. This is
    // a customer-initiated transfer; it is never treated as payment evidence.
    // Keep manual-UPI bookings out of the retired YouPI webhook namespace, so
    // a stale gateway notification cannot bypass the owner's bank review.
    const orderId = `manual-upi-${bookingId}`;
    await bookingRpc('bos_attach_order', { p_booking_id: bookingId, p_user_id: user.id, p_order_id: orderId });
    const amount = (order.totalAmount / 100).toFixed(2);
    const upiParams = new URLSearchParams({
      pa: MERCHANT_VPA,
      pn: MERCHANT_NAME,
      tr: bookingId,
      tn: `BookOutSpot ${bookingId.slice(0, 8)}`,
      am: amount,
      cu: 'INR'
    });
    return response.status(200).json({
      bookingId, amount: Number(amount), currency: 'INR',
      upiUri: `upi://pay?${upiParams.toString()}`,
      merchantName: MERCHANT_NAME
    });
  } catch {
    try { await bookingRpc('bos_cancel_pending_booking', { p_booking_id: bookingId, p_user_id: user.id }); } catch {}
    return response.status(503).json({ error: 'We could not start this booking. Please try again.' });
  }
}
