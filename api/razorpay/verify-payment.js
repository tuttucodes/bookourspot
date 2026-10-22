import { createHmac, timingSafeEqual } from 'node:crypto';
import { getSignedInUser } from '../_lib/firebase-auth.js';
import { bookingRpc, hasBookingDatabaseConfig } from '../_lib/bookings.js';

const PRICE_PAISE = { SOLO: 150000 };
const razorpay = async (path, keyId, keySecret) => {
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const result = await fetch(`https://api.razorpay.com/v1/${path}`, { headers: { Authorization: `Basic ${auth}` } });
  if (!result.ok) throw new Error('Payment record could not be confirmed.');
  return result.json();
};

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed.' });
  if (!process.env.FIREBASE_PROJECT_ID && !process.env.GOOGLE_CLOUD_PROJECT) {
    return response.status(503).json({ error: 'Firebase authentication is not configured.' });
  }
  if (!hasBookingDatabaseConfig()) {
    return response.status(503).json({ error: 'Payment verification is unavailable.' });
  }
  const user = await getSignedInUser(request);
  if (!user) return response.status(401).json({ error: 'Sign in to verify this booking.' });
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = request.body || {};
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return response.status(503).json({ error: 'Payment verification is unavailable.' });
  if (typeof orderId !== 'string' || typeof paymentId !== 'string' || typeof signature !== 'string' || !/^[a-f0-9]{64}$/i.test(signature)) {
    return response.status(400).json({ error: 'Payment details are incomplete.' });
  }

  const expectedSignature = createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest();
  const suppliedSignature = Buffer.from(signature, 'hex');
  if (suppliedSignature.length !== expectedSignature.length || !timingSafeEqual(suppliedSignature, expectedSignature)) {
    return response.status(400).json({ error: 'Payment signature could not be verified.' });
  }

  try {
    const [order, payment] = await Promise.all([
      razorpay(`orders/${encodeURIComponent(orderId)}`, keyId, keySecret),
      razorpay(`payments/${encodeURIComponent(paymentId)}`, keyId, keySecret)
    ]);
    const notes = order.notes || {};
    const quantity = Number(notes.quantity);
    const bookingId = notes.bookingId;
    const expectedAmount = PRICE_PAISE[notes.tierType] * quantity;
    const validOrder = typeof bookingId === 'string' && /^[0-9a-f-]{36}$/i.test(bookingId)
      && notes.eventId === 'halloween-affair'
      && notes.bookerUserId === user.id
      && Number.isInteger(quantity) && quantity >= 1 && quantity <= 5
      && Number(notes.totalGuests) === quantity
      && expectedAmount === order.amount;
    const validPayment = payment.order_id === orderId && payment.status === 'captured' && payment.amount === order.amount && payment.currency === 'INR';
    if (!validOrder || !validPayment) return response.status(400).json({ error: 'This payment is not captured for a valid BookOutSpot order.' });
    const booking = await bookingRpc('bos_fulfill_booking', {
      p_booking_id: bookingId,
      p_user_id: user.id,
      p_order_id: orderId,
      p_payment_id: paymentId,
      p_amount: payment.amount
    });
    return response.status(200).json({ verified: true, ...booking });
  } catch (error) {
    if (error?.status && error.status < 500) {
      return response.status(409).json({ error: 'Payment was received, but the booking record could not be finalized. Contact support with your Razorpay payment ID.' });
    }
    return response.status(502).json({ error: 'We could not confirm the payment with Razorpay. Please contact support before retrying.' });
  }
}
