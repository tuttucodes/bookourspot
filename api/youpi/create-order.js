import { randomUUID } from 'node:crypto';
import { getSignedInUser } from '../_lib/firebase-auth.js';
import { bookingRpc, hasBookingDatabaseConfig } from '../_lib/bookings.js';
import { normalizeBookingOrder } from '../_lib/booking-order.js';

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
  // YouPI's script's `data-youpi-key` is the public merchant UUID/ID, not a secret.
  // Keep the legacy variable as a migration fallback for already-configured installs.
  const merchantId = process.env.YOUPI_MERCHANT_ID || process.env.YOUPI_MERCHANT_KEY;
  const webhookSecret = process.env.YOUPI_WEBHOOK_SECRET;
  if (!checkoutScriptUrl || !merchantId || !webhookSecret) {
    return response.status(503).json({ error: 'BookOutSpot UPI checkout is being connected. Please try again shortly.' });
  }
  // Checkout stays closed until bank-credit observation and reconciliation are
  // explicitly enabled. Presence of gateway credentials alone is not proof a
  // transfer can be confirmed and safely fulfilled.
  if (process.env.YOUPI_CHECKOUT_ENABLED !== 'true') {
    return response.status(503).json({ error: 'Ticket sales are temporarily paused while payment verification is finalized. No payment has been taken.' });
  }

  const user = await getSignedInUser(request);
  if (!user) return response.status(401).json({ error: 'Sign in to book this event.' });

  const { eventId } = request.body || {};
  if (eventId !== 'halloween-affair') {
    return response.status(400).json({ error: 'This event or ticket option is not available.' });
  }
  const order = normalizeBookingOrder(request.body || {});
  if (!order) {
    return response.status(400).json({ error: 'The ticket total changed. Refresh the page and try again.' });
  }

  const bookingId = randomUUID();
  try {
    await bookingRpc('bos_create_pending_booking', {
      p_booking_id: bookingId,
      p_user_id: user.id,
      p_event_id: eventId,
      p_tier_type: order.tierType,
      p_quantity: order.quantity,
      p_total_amount: order.totalAmount,
      p_items: order.items
    });
    // YouPI receives this opaque order ID. Amount and guest data remain fixed
    // server-side; its signed webhook is the only path that issues tickets.
    await bookingRpc('bos_attach_order', { p_booking_id: bookingId, p_user_id: user.id, p_order_id: bookingId });
    return response.status(200).json({
      bookingId,
      orderId: bookingId,
      amount: order.totalAmount / 100,
      currency: 'INR',
      merchantId,
      checkoutScriptUrl,
      name: 'BookOutSpot'
    });
  } catch {
    try { await bookingRpc('bos_cancel_pending_booking', { p_booking_id: bookingId, p_user_id: user.id }); } catch {}
    return response.status(503).json({ error: 'Secure checkout could not create this booking. Please try again shortly.' });
  }
}
