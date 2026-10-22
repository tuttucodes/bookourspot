import { createHmac, timingSafeEqual } from 'node:crypto';
import { bookingRpc, hasBookingDatabaseConfig } from '../_lib/bookings.js';

export const config = { api: { bodyParser: false } };

const readRawBody = async (request) => {
  const chunks = [];
  for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
};

const getRazorpayEntity = async (path, keyId, keySecret) => {
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const response = await fetch(`https://api.razorpay.com/v1/${path}`, {
    headers: { Authorization: `Basic ${auth}` }
  });
  if (!response.ok) throw new Error('Razorpay entity lookup failed.');
  return response.json();
};

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed.' });

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!webhookSecret || !keyId || !keySecret || !hasBookingDatabaseConfig()) {
    return response.status(503).json({ error: 'Payment webhook is not configured.' });
  }

  try {
    const rawBody = await readRawBody(request);
    const signature = request.headers['x-razorpay-signature'];
    if (typeof signature !== 'string' || !/^[a-f0-9]{64}$/i.test(signature)) {
      return response.status(400).json({ error: 'Invalid webhook signature.' });
    }
    const expected = createHmac('sha256', webhookSecret).update(rawBody).digest();
    const provided = Buffer.from(signature, 'hex');
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
      return response.status(400).json({ error: 'Invalid webhook signature.' });
    }

    const webhook = JSON.parse(rawBody.toString('utf8'));
    if (webhook.event !== 'payment.captured') return response.status(200).json({ received: true });

    const entity = webhook.payload?.payment?.entity;
    if (!entity?.id || !entity?.order_id || entity.status !== 'captured' || entity.currency !== 'INR') {
      return response.status(400).json({ error: 'Captured payment details are incomplete.' });
    }
    const [order, payment] = await Promise.all([
      getRazorpayEntity(`orders/${encodeURIComponent(entity.order_id)}`, keyId, keySecret),
      getRazorpayEntity(`payments/${encodeURIComponent(entity.id)}`, keyId, keySecret)
    ]);
    const notes = order.notes || {};
    const bookingId = notes.bookingId;
    const quantity = Number(notes.quantity);
    const amount = quantity * 150000;
    const isValid = typeof bookingId === 'string' && /^[0-9a-f-]{36}$/i.test(bookingId)
      && typeof notes.bookerUserId === 'string'
      && notes.eventId === 'halloween-affair'
      && notes.tierType === 'SOLO'
      && Number.isInteger(quantity) && quantity >= 1 && quantity <= 5
      && Number(notes.totalGuests) === quantity
      && order.amount === amount && order.currency === 'INR'
      && payment.id === entity.id && payment.order_id === entity.order_id
      && payment.amount === amount && payment.currency === 'INR' && payment.status === 'captured';
    if (!isValid) return response.status(400).json({ error: 'Payment does not match a valid BookOutSpot order.' });

    await bookingRpc('bos_fulfill_booking', {
      p_booking_id: bookingId,
      p_user_id: notes.bookerUserId,
      p_order_id: entity.order_id,
      p_payment_id: entity.id,
      p_amount: amount
    });
    return response.status(200).json({ received: true });
  } catch {
    return response.status(500).json({ error: 'Payment could not be finalized. Razorpay may retry this webhook.' });
  }
}
