import { randomUUID } from 'node:crypto';
import { getSignedInUser } from '../_lib/firebase-auth.js';
import { bookingRpc, hasBookingDatabaseConfig } from '../_lib/bookings.js';

const PRICE_PAISE = { SOLO: 150000, DUO: 280000 };
const GUESTS_PER_UNIT = { SOLO: 1, DUO: 2 };
const cleanHttpsUrl = (value) => {
  try {
    const url = new URL(value || '');
    return url.protocol === 'https:' ? url.toString() : '';
  } catch { return ''; }
};

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed.' });
  if (!process.env.FIREBASE_PROJECT_ID && !process.env.GOOGLE_CLOUD_PROJECT) {
    return response.status(503).json({ error: 'Firebase authentication is not configured.' });
  }
  if (!hasBookingDatabaseConfig()) {
    return response.status(503).json({ error: 'Secure checkout is being set up. Please try again shortly.' });
  }
  const checkoutScriptUrl = cleanHttpsUrl(process.env.YOUPI_CHECKOUT_SCRIPT_URL);
  const merchantKey = process.env.YOUPI_MERCHANT_KEY;
  const webhookSecret = process.env.YOUPI_WEBHOOK_SECRET;
  if (!checkoutScriptUrl || !merchantKey || !webhookSecret) {
    return response.status(503).json({ error: 'BookOutSpot UPI checkout is being connected. Please try again shortly.' });
  }

  const user = await getSignedInUser(request);
  if (!user) return response.status(401).json({ error: 'Sign in to book this event.' });

  const { eventId, tierType, quantity, totalGuests, totalAmount, attendees } = request.body || {};
  const count = Number(quantity);
  const guests = Number(totalGuests);
  if (eventId !== 'halloween-affair' || !PRICE_PAISE[tierType] || !Number.isInteger(count) || count < 1 || count > 5) {
    return response.status(400).json({ error: 'This event or ticket option is not available.' });
  }
  const amount = PRICE_PAISE[tierType] * count;
  const expectedGuests = count * GUESTS_PER_UNIT[tierType];
  if (!Number.isSafeInteger(Number(totalAmount)) || Number(totalAmount) * 100 !== amount || guests !== expectedGuests || !Array.isArray(attendees) || attendees.length !== expectedGuests) {
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

  const bookingId = randomUUID();
  try {
    await bookingRpc('bos_create_pending_booking', {
      p_booking_id: bookingId,
      p_user_id: user.id,
      p_event_id: eventId,
      p_tier_type: tierType,
      p_quantity: count,
      p_total_amount: amount,
      p_attendees: normalizedAttendees
    });
    // YouPI receives this opaque order ID. Amount and guest data remain fixed
    // server-side; its signed webhook is the only path that issues tickets.
    await bookingRpc('bos_attach_order', { p_booking_id: bookingId, p_user_id: user.id, p_order_id: bookingId });
    return response.status(200).json({
      bookingId,
      orderId: bookingId,
      amount: amount / 100,
      currency: 'INR',
      merchantKey,
      checkoutScriptUrl,
      name: 'BookOutSpot'
    });
  } catch {
    try { await bookingRpc('bos_cancel_pending_booking', { p_booking_id: bookingId, p_user_id: user.id }); } catch {}
    return response.status(503).json({ error: 'Secure checkout could not create this booking. Please try again shortly.' });
  }
}
