import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getServiceSupabaseClient } from '@/lib/supabase/service';
import { sendBookingConfirmedNotifications } from '@/lib/notifications';

type BookingBody = {
  business_id?: string;
  service_id?: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  notes?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
};

type AppointmentUserRow = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
} | null;

type AppointmentBusinessRow = {
  name?: string | null;
  address?: string | null;
  phone?: string | null;
  owner_id?: string | null;
  owner_whatsapp?: string | null;
} | null;

type AppointmentServiceRow = {
  name?: string | null;
  price?: number | null;
  duration_minutes?: number | null;
} | null;

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as BookingBody;
  if (!body.business_id || !body.service_id || !body.date || !body.start_time || !body.end_time) {
    return NextResponse.json({ error: 'Missing required booking fields.' }, { status: 400 });
  }

  const {
    data: appointment,
    error: appointmentError,
  } = await supabase
    .from('appointments')
    .insert({
      user_id: authUser.id,
      business_id: body.business_id,
      service_id: body.service_id,
      date: body.date,
      start_time: body.start_time,
      end_time: body.end_time,
      notes: body.notes,
      status: 'booked',
    })
    .select('*, service:services(*), business:businesses(*), user:users(*)')
    .single();

  if (appointmentError || !appointment) {
    return NextResponse.json(
      { error: appointmentError?.message || 'Failed to create appointment.' },
      { status: 400 }
    );
  }

  const appointmentUser = appointment.user as AppointmentUserRow;
  const appointmentBusiness = appointment.business as AppointmentBusinessRow;
  const appointmentService = appointment.service as AppointmentServiceRow;

  // Enrich owner contact via service role (businesses.owner_id -> users.email/name).
  // Customer-scope RLS cannot read arbitrary user rows.
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

  const customerName = body.customer_name || appointmentUser?.name || 'Customer';
  const customerPhone = body.customer_phone || appointmentUser?.phone || null;
  const customerEmail = body.customer_email || appointmentUser?.email || null;

  const notifications = await sendBookingConfirmedNotifications({
    appointmentId: appointment.id,
    customerName,
    customerPhone,
    customerEmail,
    businessName: appointmentBusiness?.name || 'BookOurSpot Business',
    businessAddress: appointmentBusiness?.address ?? null,
    businessPhone: appointmentBusiness?.phone ?? null,
    ownerEmail,
    ownerName,
    ownerWhatsApp: appointmentBusiness?.owner_whatsapp ?? null,
    serviceName: appointmentService?.name || 'Service',
    servicePrice: Number(appointmentService?.price ?? 0),
    durationMinutes: appointmentService?.duration_minutes ?? undefined,
    date: appointment.date,
    startTime: appointment.start_time,
  });

  return NextResponse.json({
    data: appointment,
    notifications: {
      customer_email: notifications.customerEmail?.status ?? null,
      customer_whatsapp: notifications.customerWhatsApp?.status ?? null,
      owner_email: notifications.ownerEmail?.status ?? null,
      owner_whatsapp: notifications.ownerWhatsApp?.status ?? null,
    },
  });
}
