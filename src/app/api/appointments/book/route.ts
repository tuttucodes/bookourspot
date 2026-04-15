import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sendBookingNotifications } from '@/lib/notifications';

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

  const servicePrice = Number((appointment.service as { price?: number } | null)?.price);
  if (!Number.isNaN(servicePrice)) {
    const { error: txError } = await supabase.from('transactions').insert({
      appointment_id: appointment.id,
      amount: servicePrice,
      payment_method: 'cash',
      status: 'pending',
    });

    if (txError) {
      await supabase.from('appointments').delete().eq('id', appointment.id);
      return NextResponse.json({ error: txError.message }, { status: 400 });
    }
  }

  const appointmentUser = appointment.user as { name?: string; email?: string; phone?: string | null } | null;
  const appointmentBusiness = appointment.business as { name?: string; owner_whatsapp?: string | null } | null;
  const appointmentService = appointment.service as { name?: string; price?: number } | null;
  const customerName = body.customer_name || appointmentUser?.name || 'Customer';
  const customerPhone = body.customer_phone || appointmentUser?.phone || null;
  const customerEmail = body.customer_email || appointmentUser?.email || null;

  const notificationResult = await sendBookingNotifications({
    customerName,
    customerPhone,
    customerEmail,
    businessName: appointmentBusiness?.name || 'BookOurSpot Business',
    ownerWhatsApp: appointmentBusiness?.owner_whatsapp || null,
    serviceName: appointmentService?.name || 'Service',
    servicePrice: Number(appointmentService?.price || 0),
    date: appointment.date,
    startTime: appointment.start_time,
    appointmentId: appointment.id,
  });

  return NextResponse.json({
    data: appointment,
    notifications: notificationResult,
  });
}
