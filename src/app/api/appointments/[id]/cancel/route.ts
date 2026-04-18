import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getServiceSupabaseClient } from '@/lib/supabase/service';
import { sendBookingCancelledNotifications } from '@/lib/notifications';

type CancelBody = {
  reason?: string;
};

type Ctx = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/appointments/:id/cancel
 *
 * Auth: appointment owner (customer) OR business owner (merchant).
 * RLS update policy on appointments enforces this; we just set status='cancelled'.
 *
 * Side effects:
 * - Sends cancellation email + WhatsApp to customer (idempotent via notification_logs).
 * - Marks the paired transaction as voided (status stays 'pending'; business can decide
 *   to clean up — we surface status to the UI).
 */
export async function POST(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: 'Missing id.' }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as CancelBody;
  const reason = body.reason?.trim().slice(0, 500) || null;

  // Read current appointment first — need status + actor relation.
  const { data: current, error: readErr } = await supabase
    .from('appointments')
    .select('*, service:services(*), business:businesses(*), user:users(*)')
    .eq('id', id)
    .maybeSingle();

  if (readErr || !current) {
    return NextResponse.json({ error: 'Appointment not found.' }, { status: 404 });
  }
  if (current.status === 'cancelled') {
    return NextResponse.json({ data: current, already_cancelled: true });
  }
  if (current.status === 'completed') {
    return NextResponse.json(
      { error: 'Cannot cancel a completed appointment.' },
      { status: 400 }
    );
  }

  const business = current.business as { owner_id?: string | null } | null;
  const cancelledBy: 'customer' | 'merchant' =
    business?.owner_id && business.owner_id === authUser.id ? 'merchant' : 'customer';

  // Update. Relies on RLS to enforce that only owner/merchant can update.
  const { data: updated, error: updateErr } = await supabase
    .from('appointments')
    .update({ status: 'cancelled', notes: reason ? `${current.notes ?? ''}\n[cancel] ${reason}`.trim() : current.notes })
    .eq('id', id)
    .select('*, service:services(*), business:businesses(*), user:users(*)')
    .single();

  if (updateErr || !updated) {
    return NextResponse.json(
      { error: updateErr?.message || 'Failed to cancel.' },
      { status: 400 }
    );
  }

  const appointmentUser = updated.user as {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  const appointmentBusiness = updated.business as {
    name?: string | null;
    address?: string | null;
    phone?: string | null;
    owner_id?: string | null;
    owner_whatsapp?: string | null;
  } | null;
  const appointmentService = updated.service as {
    name?: string | null;
    price?: number | null;
    duration_minutes?: number | null;
  } | null;

  // Enrich owner contact for owner-side future notifications (not sent today).
  let ownerEmail: string | null = null;
  let ownerName: string | null = null;
  if (appointmentBusiness?.owner_id) {
    const svc = getServiceSupabaseClient();
    const { data: owner } = await svc
      .from('users')
      .select('email, name')
      .eq('id', appointmentBusiness.owner_id)
      .maybeSingle();
    ownerEmail = owner?.email ?? null;
    ownerName = owner?.name ?? null;
  }

  const notifications = await sendBookingCancelledNotifications({
    appointmentId: updated.id,
    bookingToken: (updated as { booking_token?: string }).booking_token || `BOS-${updated.id.slice(0, 8).toUpperCase()}`,
    customerName: appointmentUser?.name || 'Customer',
    customerEmail: appointmentUser?.email ?? null,
    customerPhone: appointmentUser?.phone ?? null,
    businessName: appointmentBusiness?.name || 'BookOurSpot Business',
    businessAddress: appointmentBusiness?.address ?? null,
    businessPhone: appointmentBusiness?.phone ?? null,
    ownerEmail,
    ownerName,
    ownerWhatsApp: appointmentBusiness?.owner_whatsapp ?? null,
    serviceName: appointmentService?.name || 'Service',
    servicePrice: Number(appointmentService?.price ?? 0),
    durationMinutes: appointmentService?.duration_minutes ?? undefined,
    date: updated.date,
    startTime: updated.start_time,
    cancelledBy,
    reason,
  });

  return NextResponse.json({
    data: updated,
    cancelled_by: cancelledBy,
    notifications: {
      customer_email: notifications.customerEmail?.status ?? null,
      customer_whatsapp: notifications.customerWhatsApp?.status ?? null,
    },
  });
}
