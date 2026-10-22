const supabaseConfig = () => {
  const rawUrl = process.env.SUPABASE_URL;
  let url = '';
  try {
    const parsed = new URL(rawUrl || '');
    if (parsed.protocol === 'https:') url = parsed.origin;
  } catch {}
  return { url, serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY };
};

export function hasBookingDatabaseConfig() {
  const { url, serviceKey } = supabaseConfig();
  return Boolean(url && serviceKey);
}

export async function bookingRpc(functionName, args) {
  const { url, serviceKey } = supabaseConfig();
  if (!url || !serviceKey) throw new Error('Server-side booking storage is not configured.');
  if (!/^bos_(create_pending_booking|attach_order|cancel_pending_booking|fulfill_booking|submit_payment_report|review_manual_payment)$/.test(functionName)) {
    throw new Error('Unsupported booking operation.');
  }
  const result = await fetch(`${url}/rest/v1/rpc/${functionName}`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      'Content-Profile': 'public',
      'Accept-Profile': 'public'
    },
    body: JSON.stringify(args)
  });
  const payload = await result.json().catch(() => null);
  if (!result.ok) {
    const error = new Error(payload?.message || 'Booking storage is unavailable.');
    error.status = result.status;
    error.code = payload?.code;
    throw error;
  }
  return payload;
}

export async function getUserBookings(userId) {
  const { url, serviceKey } = supabaseConfig();
  if (!url || !serviceKey) throw new Error('Server-side booking storage is not configured.');
  const query = new URLSearchParams({
    select: 'id,event_id,tier_type,quantity,total_amount,status,payment_review_status,reported_utr,created_at,paid_at,booking_items(tier_type,quantity,total_amount),booking_tickets(id,guest_name,guest_phone,ticket_number,tier_type,tier_name,unit_price,status,issued_at)',
    user_id: `eq.${userId}`,
    status: 'in.(PENDING,PAID)',
    order: 'created_at.desc'
  });
  const result = await fetch(`${url}/rest/v1/bookings?${query}`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Accept-Profile': 'public'
    }
  });
  const payload = await result.json().catch(() => null);
  if (!result.ok) {
    const error = new Error(payload?.message || 'Booking history is unavailable.');
    error.status = result.status;
    throw error;
  }
  return (payload || []).map((booking) => ({
    bookingId: booking.id,
    eventId: booking.event_id,
    tierType: booking.tier_type,
    quantity: booking.quantity,
    totalAmount: booking.total_amount / 100,
    items: (booking.booking_items || []).map((item) => ({ tierType: item.tier_type, quantity: item.quantity, totalAmount: item.total_amount / 100 })),
    status: booking.status,
    paymentReviewStatus: booking.payment_review_status || 'NOT_SUBMITTED',
    reportedUtr: booking.reported_utr || null,
    utr: booking.reported_utr || null,
    createdAt: booking.created_at,
    paidAt: booking.paid_at,
    tickets: (booking.booking_tickets || []).map((ticket) => ({
      id: ticket.id,
      guestName: ticket.guest_name,
      guestPhone: ticket.guest_phone,
      ticketNumber: ticket.ticket_number,
      tierName: ticket.tier_name,
      tierType: ticket.tier_type,
      price: ticket.unit_price / 100,
      status: ticket.status,
      issuedAt: ticket.issued_at
    }))
  }));
}

export async function getBookingByGatewayOrder(orderId) {
  const { url, serviceKey } = supabaseConfig();
  if (!url || !serviceKey) throw new Error('Server-side booking storage is not configured.');
  const query = new URLSearchParams({
    select: 'id,user_id,event_id,tier_type,quantity,total_amount,status,gateway_order_id,gateway_payment_id,booking_items(tier_type,quantity,total_amount),booking_tickets(id,guest_name,guest_phone,ticket_number,tier_type,tier_name,unit_price,status,issued_at)',
    gateway_order_id: `eq.${orderId}`,
    limit: '1'
  });
  const result = await fetch(`${url}/rest/v1/bookings?${query}`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Accept-Profile': 'public' }
  });
  const rows = await result.json().catch(() => null);
  if (!result.ok) throw new Error('Booking record is unavailable.');
  return rows?.[0] || null;
}

export async function getUserBookingStatus(userId, bookingId) {
  const { url, serviceKey } = supabaseConfig();
  if (!url || !serviceKey) throw new Error('Server-side booking storage is not configured.');
  const query = new URLSearchParams({
    select: 'id,event_id,tier_type,quantity,total_amount,status,payment_review_status,reported_utr,created_at,paid_at,booking_items(tier_type,quantity,total_amount),booking_tickets(id,guest_name,guest_phone,ticket_number,tier_type,tier_name,unit_price,status,issued_at)',
    id: `eq.${bookingId}`,
    user_id: `eq.${userId}`,
    limit: '1'
  });
  const result = await fetch(`${url}/rest/v1/bookings?${query}`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Accept-Profile': 'public' }
  });
  const rows = await result.json().catch(() => null);
  if (!result.ok) throw new Error('Booking record is unavailable.');
  const booking = rows?.[0];
  if (!booking) return null;
  return {
    bookingId: booking.id,
    eventId: booking.event_id,
    tierType: booking.tier_type,
    quantity: booking.quantity,
    totalAmount: booking.total_amount / 100,
    items: (booking.booking_items || []).map((item) => ({ tierType: item.tier_type, quantity: item.quantity, totalAmount: item.total_amount / 100 })),
    status: booking.status,
    paymentReviewStatus: booking.payment_review_status || 'NOT_SUBMITTED',
    reportedUtr: booking.reported_utr || null,
    utr: booking.reported_utr || null,
    paidAt: booking.paid_at,
    tickets: (booking.booking_tickets || []).map((ticket) => ({
      id: ticket.id,
      guestName: ticket.guest_name,
      guestPhone: ticket.guest_phone,
      ticketNumber: ticket.ticket_number,
      tierName: ticket.tier_name,
      tierType: ticket.tier_type,
      price: ticket.unit_price / 100,
      status: ticket.status,
      issuedAt: ticket.issued_at
    }))
  };
}

export async function getManualPaymentQueue() {
  const { url, serviceKey } = supabaseConfig();
  if (!url || !serviceKey) throw new Error('Server-side booking storage is not configured.');
  const query = new URLSearchParams({
    select: 'id,booking_id,utr,amount,submitted_at,booking:bookings(id,user_id,event_id,tier_type,quantity,total_amount,status,booking_items(tier_type,quantity,total_amount),booking_tickets(guest_name,guest_phone,ticket_number,tier_type,tier_name))',
    status: 'eq.SUBMITTED',
    order: 'submitted_at.asc',
    limit: '100'
  });
  const result = await fetch(`${url}/rest/v1/booking_payment_reviews?${query}`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Accept-Profile': 'public' }
  });
  const rows = await result.json().catch(() => null);
  if (!result.ok) throw new Error('Payment review queue is unavailable.');
  return (rows || []).flatMap((review) => {
    const booking = review.booking;
    if (!booking || booking.status !== 'PENDING') return [];
    return [{
    userId: booking.user_id,
    bookingId: booking.id,
    eventId: booking.event_id,
    tierType: booking.tier_type,
    quantity: booking.quantity,
    totalAmount: booking.total_amount / 100,
    status: booking.status,
    paymentReviewStatus: 'SUBMITTED',
    reportedUtr: review.utr,
    utr: review.utr,
    amount: review.amount / 100,
    submittedAt: review.submitted_at,
    reviewId: review.id,
    items: (booking.booking_items || []).map((item) => ({ tierType: item.tier_type, quantity: item.quantity, totalAmount: item.total_amount / 100 })),
    attendees: (booking.booking_tickets || []).sort((a, b) => a.ticket_number - b.ticket_number).map((ticket) => ({
      name: ticket.guest_name,
      phone: ticket.guest_phone,
      ticketNumber: ticket.ticket_number,
      tierName: ticket.tier_name,
      tierType: ticket.tier_type
    }))
  }];
  });
}
