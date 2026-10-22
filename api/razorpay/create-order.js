import { randomUUID } from 'node:crypto';
import { getSignedInUser } from '../_lib/firebase-auth.js';
import { bookingRpc, hasBookingDatabaseConfig } from '../_lib/bookings.js';

const PRICE_PAISE = { SOLO: 150000 };

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed.' });
  if (!process.env.FIREBASE_PROJECT_ID && !process.env.GOOGLE_CLOUD_PROJECT) {
    return response.status(503).json({ error: 'Firebase authentication is not configured.' });
  }
  if (!hasBookingDatabaseConfig()) {
    return response.status(503).json({ error: 'Secure checkout is being set up. Please try again shortly.' });
  }
  const user = await getSignedInUser(request);
  if (!user) return response.status(401).json({ error: 'Sign in to book this event.' });

  const { eventId, tierType, quantity, totalGuests, totalAmount, attendees } = request.body || {};
  const count = Number(quantity);
  const guests = Number(totalGuests);
  if (eventId !== 'halloween-affair' || !PRICE_PAISE[tierType] || !Number.isInteger(count) || count < 1 || count > 5) {
    return response.status(400).json({ error: 'This event or ticket option is not available.' });
  }

  const guestCount = count;
  const amount = PRICE_PAISE[tierType] * count;
  const amountRupees = Number(totalAmount);
  if (!Number.isSafeInteger(amountRupees) || guests !== guestCount || amountRupees * 100 !== amount || !Array.isArray(attendees) || attendees.length !== count) {
    return response.status(400).json({ error: 'The ticket total changed. Refresh the page and try again.' });
  }

  const normalizedAttendees = [];
  for (const attendee of attendees) {
    const name = typeof attendee?.name === 'string' ? attendee.name.trim() : '';
    const rawPhone = typeof attendee?.phone === 'string' ? attendee.phone.trim() : '';
    const phone = rawPhone.startsWith('+') ? rawPhone : (/^\d{10}$/.test(rawPhone) ? `+91${rawPhone}` : '');
    if (name.length < 1 || name.length > 80 || !/^\+[1-9]\d{7,14}$/.test(phone)) {
      return response.status(400).json({ error: 'Enter a valid name and phone number for every attendee.' });
    }
    normalizedAttendees.push({ name, phone });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return response.status(503).json({ error: 'Secure checkout is being set up. Please try again shortly.' });

  let bookingId;
  try {
    bookingId = randomUUID();
    await bookingRpc('bos_create_pending_booking', {
      p_booking_id: bookingId,
      p_user_id: user.id,
      p_event_id: eventId,
      p_tier_type: tierType,
      p_quantity: count,
      p_total_amount: amount,
      p_attendees: normalizedAttendees
    });
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const gatewayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        currency: 'INR',
        receipt: `bos_${bookingId.replaceAll('-', '').slice(0, 32)}`,
        // Attendee PII stays in our database; Razorpay notes only carry ids.
        notes: { eventId, tierType, quantity: String(count), totalGuests: String(guestCount), bookerUserId: user.id, bookingId }
      })
    });
    const order = await gatewayResponse.json();
    if (!gatewayResponse.ok || typeof order?.id !== 'string') {
      await bookingRpc('bos_cancel_pending_booking', { p_booking_id: bookingId, p_user_id: user.id });
      return response.status(502).json({ error: 'Razorpay could not create this order.' });
    }
    await bookingRpc('bos_attach_order', { p_booking_id: bookingId, p_user_id: user.id, p_order_id: order.id });
    return response.status(200).json({ bookingId, orderId: order.id, amount: order.amount, currency: order.currency, keyId });
  } catch {
    if (bookingId) {
      try { await bookingRpc('bos_cancel_pending_booking', { p_booking_id: bookingId, p_user_id: user.id }); } catch {}
    }
    return response.status(503).json({ error: 'Secure booking storage or payment setup is unavailable. Please try again shortly.' });
  }
}
