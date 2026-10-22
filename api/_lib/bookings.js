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
  if (!/^bos_(create_pending_booking|attach_order|cancel_pending_booking|fulfill_booking)$/.test(functionName)) {
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
    throw error;
  }
  return payload;
}

export async function getUserBookings(userId) {
  const { url, serviceKey } = supabaseConfig();
  if (!url || !serviceKey) throw new Error('Server-side booking storage is not configured.');
  const query = new URLSearchParams({
    select: 'id,event_id,tier_type,quantity,total_amount,status,created_at,paid_at,booking_tickets(id,guest_name,guest_phone,ticket_number,status,issued_at)',
    user_id: `eq.${userId}`,
    status: 'eq.PAID',
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
    status: booking.status,
    createdAt: booking.created_at,
    paidAt: booking.paid_at,
    tickets: (booking.booking_tickets || []).map((ticket) => ({
      id: ticket.id,
      guestName: ticket.guest_name,
      guestPhone: ticket.guest_phone,
      ticketNumber: ticket.ticket_number,
      tierName: 'General Admission',
      tierType: booking.tier_type,
      price: booking.total_amount / booking.quantity / 100,
      status: ticket.status,
      issuedAt: ticket.issued_at
    }))
  }));
}
