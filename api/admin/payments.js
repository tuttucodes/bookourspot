import { getManualPaymentQueue, bookingRpc, hasBookingDatabaseConfig } from '../_lib/bookings.js';
import { getFirebaseUserContact, getSignedInUser } from '../_lib/firebase-auth.js';

// The initial owner is explicitly allowlisted while Vercel environment setup
// is being finalized; additional administrators should be added via the env var.
const adminEmails = () => (process.env.BOOKOUTSPOT_ADMIN_EMAILS || 'rahulbabuk05@gmail.com')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

function isAdmin(user) {
  return user?.emailVerified === true
    && typeof user.email === 'string'
    && adminEmails().includes(user.email.trim().toLowerCase());
}

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  if (!['GET', 'POST'].includes(request.method)) return response.status(405).json({ error: 'Method not allowed.' });
  if (!process.env.FIREBASE_PROJECT_ID && !process.env.GOOGLE_CLOUD_PROJECT) {
    return response.status(503).json({ error: 'Firebase authentication is not configured.' });
  }
  if (!adminEmails().length) return response.status(503).json({ error: 'Admin access is not configured.' });
  if (!hasBookingDatabaseConfig()) return response.status(503).json({ error: 'Payment review is temporarily unavailable.' });

  const user = await getSignedInUser(request);
  if (!user) return response.status(401).json({ error: 'Sign in with a verified phone number to continue.' });
  if (!isAdmin(user)) return response.status(403).json({ error: 'This account is not authorized to review payments.' });

  if (request.method === 'GET') {
    try {
      const reviews = await getManualPaymentQueue();
      const payments = await Promise.all(reviews.map(async (review) => {
        const contact = await getFirebaseUserContact(review.userId);
        return {
          bookingId: review.bookingId,
          eventId: review.eventId,
          eventTitle: 'A little Halloween affair',
          amount: review.amount,
          utr: review.utr,
          submittedAt: review.submittedAt,
          attendees: review.attendees,
          userEmail: contact.email,
          userPhone: contact.phoneNumber || review.attendees[0]?.phone || null,
          items: review.items
        };
      }));
      return response.status(200).json({ payments });
    } catch {
      return response.status(503).json({ error: 'Payment review queue is temporarily unavailable.' });
    }
  }

  const bookingId = typeof request.body?.bookingId === 'string' ? request.body.bookingId.trim() : '';
  const utr = typeof request.body?.utr === 'string' ? request.body.utr.replace(/\s/g, '') : '';
  const action = typeof request.body?.action === 'string' ? request.body.action.toUpperCase() : '';
  const bankChecked = request.body?.bankChecked === true;
  const note = typeof request.body?.note === 'string' ? request.body.note.trim().slice(0, 500) : '';

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(bookingId)) {
    return response.status(400).json({ error: 'Invalid booking reference.' });
  }
  if (!/^\d{12}$/.test(utr)) return response.status(400).json({ error: 'Invalid UTR.' });
  if (!['APPROVE', 'REJECT'].includes(action)) return response.status(400).json({ error: 'Choose approve or reject.' });
  if (!bankChecked) return response.status(400).json({ error: 'Confirm that you checked the bank statement before reviewing this report.' });
  if (action === 'REJECT' && note.length < 3) return response.status(400).json({ error: 'Add a short reason so the customer can correct the report.' });

  try {
    const result = await bookingRpc('bos_review_manual_payment', {
      p_booking_id: bookingId,
      p_admin_uid: user.id,
      p_utr: utr,
      p_action: action,
      p_bank_checked: bankChecked,
      p_note: note || null
    });
    return response.status(200).json({
      bookingId,
      action,
      status: action === 'APPROVE' ? 'PAID' : 'PENDING',
      paymentReviewStatus: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      booking: result
    });
  } catch (error) {
    if (error.status === 400 || error.status === 409 || error.code === '23505') {
      return response.status(409).json({ error: 'This payment report is no longer reviewable. Refresh the queue and check its status.' });
    }
    return response.status(503).json({ error: 'Payment review could not be saved. Please retry.' });
  }
}
