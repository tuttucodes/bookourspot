import { bookingRpc, getBookingByGatewayOrder, hasBookingDatabaseConfig } from '../_lib/bookings.js';
import {
  isYoupiDeliveryId,
  verifyYoupiWebhookSignature,
  validateYoupiSuccessEvent
} from '../_lib/youpi-webhook.js';
import { expectedBookingAmount } from '../_lib/booking-order.js';

export const config = { api: { bodyParser: false } };

async function readRawBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed.' });
  const secret = process.env.YOUPI_WEBHOOK_SECRET;
  if (!secret || !hasBookingDatabaseConfig()) return response.status(503).json({ error: 'BookOutSpot payment confirmation is not configured.' });

  try {
    const rawBody = await readRawBody(request);
    const signature = request.headers['x-gateway-signature'];
    const deliveryId = request.headers['x-gateway-delivery-id'];
    const timestamp = request.headers['x-gateway-timestamp'];
    const gatewayEvent = request.headers['x-gateway-event'];
    if (typeof timestamp !== 'string' || !/^\d{10,16}$/.test(timestamp)
      || !isYoupiDeliveryId(deliveryId)
      || !verifyYoupiWebhookSignature(secret, rawBody, signature)) {
      return response.status(401).json({ error: 'Payment notification signature is invalid.' });
    }

    const event = JSON.parse(rawBody.toString('utf8'));
    if (!event || typeof event !== 'object' || Array.isArray(event)
      || typeof event.event !== 'string' || gatewayEvent !== event.event) {
      return response.status(400).json({ error: 'Payment notification data is incomplete.' });
    }
    if (event.event !== 'SUCCESS') return response.status(200).json({ received: true });
    const payment = validateYoupiSuccessEvent(event);
    if (!payment) {
      return response.status(400).json({ error: 'Payment notification data is incomplete.' });
    }

    const { orderId, paymentId, amountPaise, utr } = payment;
    const booking = await getBookingByGatewayOrder(orderId);
    const expectedAmount = expectedBookingAmount(booking);
    if (!booking || booking.status === 'CANCELLED' || booking.event_id !== 'halloween-affair'
      || !['SOLO', 'DUO', 'MIXED'].includes(booking.tier_type) || expectedAmount === null || amountPaise !== booking.total_amount
      || amountPaise !== expectedAmount) {
      return response.status(409).json({ error: 'Payment does not match a pending BookOutSpot booking.' });
    }

    await bookingRpc('bos_fulfill_booking', {
      p_booking_id: booking.id,
      p_user_id: booking.user_id,
      p_order_id: orderId,
      p_payment_id: paymentId,
      p_amount: amountPaise,
      p_utr: utr
    });
    return response.status(200).json({ received: true });
  } catch {
    // Returning non-2xx lets YouPI retry while the merchant reconciles.
    return response.status(500).json({ error: 'Payment notification could not be finalized.' });
  }
}
