import { createHmac, timingSafeEqual } from 'node:crypto';
import { bookingRpc, getBookingByGatewayOrder, hasBookingDatabaseConfig } from '../_lib/bookings.js';

export const config = { api: { bodyParser: false } };

async function readRawBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

function validSignature(secret, timestamp, rawBody, supplied) {
  const signature = String(supplied || '').replace(/^sha256=/i, '');
  if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = createHmac('sha256', secret).update(`${timestamp}.`).update(rawBody).digest();
  const provided = Buffer.from(signature, 'hex');
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed.' });
  const secret = process.env.YOUPI_WEBHOOK_SECRET;
  if (!secret || !hasBookingDatabaseConfig()) return response.status(503).json({ error: 'BookOutSpot payment confirmation is not configured.' });

  try {
    const rawBody = await readRawBody(request);
    const timestamp = request.headers['x-gateway-timestamp'];
    const deliveryId = request.headers['x-gateway-delivery-id'];
    const gatewayEvent = request.headers['x-gateway-event'];
    if (typeof timestamp !== 'string' || !/^\d{10,16}$/.test(timestamp)
      || typeof deliveryId !== 'string' || !/^[0-9a-f-]{36}$/i.test(deliveryId)
      || !validSignature(secret, timestamp, rawBody, request.headers['x-gateway-signature-v2'])) {
      return response.status(401).json({ error: 'Payment notification signature is invalid.' });
    }

    const event = JSON.parse(rawBody.toString('utf8'));
    if (event.event !== 'SUCCESS') return response.status(200).json({ received: true });
    const orderId = typeof event.orderId === 'string' ? event.orderId : '';
    const paymentId = typeof event.paymentId === 'string' ? event.paymentId : '';
    const amountPaise = Number(event.amountPaise);
    const utr = typeof event.utr === 'string' ? event.utr.trim() : '';
    if (event.deliveryId !== deliveryId || String(event.timestamp) !== timestamp || gatewayEvent !== event.event
      || !/^[0-9a-f-]{36}$/i.test(orderId) || !/^[0-9a-f-]{36}$/i.test(paymentId)
      || !Number.isSafeInteger(amountPaise) || amountPaise < 150000 || !/^\d{12}$/.test(utr)) {
      return response.status(400).json({ error: 'Payment notification data is incomplete.' });
    }

    const booking = await getBookingByGatewayOrder(orderId);
    const expectedAmount = booking?.tier_type === 'DUO' ? booking.quantity * 280000 : booking?.quantity * 150000;
    if (!booking || booking.status === 'CANCELLED' || booking.event_id !== 'halloween-affair'
      || !['SOLO', 'DUO'].includes(booking.tier_type) || amountPaise !== booking.total_amount
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
