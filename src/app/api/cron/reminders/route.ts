import { NextResponse } from 'next/server';
import { getServiceSupabaseClient } from '@/lib/supabase/service';
import { sendReminderNotifications } from '@/lib/notifications';
import type { ReminderWindow } from '@/lib/email/templates/appointment-reminder';

/**
 * GET /api/cron/reminders
 *
 * Vercel Cron hits this every 5 minutes. For each booked appointment whose start
 * falls within one of the reminder windows [60m, 30m, 15m] ± tolerance, send the
 * corresponding reminder. Idempotency handled by notification_logs unique index.
 *
 * Auth: Authorization: Bearer ${CRON_SECRET}.
 * Timezone: all businesses assumed Asia/Kuala_Lumpur (UTC+8) for MVP.
 */

const BUSINESS_TZ_OFFSET_HOURS = 8; // Asia/Kuala_Lumpur = UTC+8
const TOLERANCE_MINUTES = 3; // cron runs every 5 min; ±3 covers 6-min window
const WINDOWS: Array<{ label: ReminderWindow; minutes: number }> = [
  { label: '60m', minutes: 60 },
  { label: '30m', minutes: 30 },
  { label: '15m', minutes: 15 },
];

type AppointmentRow = {
  id: string;
  date: string;
  start_time: string;
  status: string;
  business: {
    name: string | null;
    address: string | null;
    phone: string | null;
    owner_whatsapp: string | null;
    owner_id: string | null;
  } | null;
  service: {
    name: string | null;
    price: number | null;
    duration_minutes: number | null;
  } | null;
  user: {
    name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
};

function authorize(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get('authorization');
  return header === `Bearer ${secret}`;
}

/**
 * Build a UTC Date from an appointment's local date + time, given the fixed
 * business TZ offset.
 */
function appointmentUtcTime(date: string, startTime: string): Date {
  const [y, mo, d] = date.split('-').map(Number);
  const [h, mi] = startTime.split(':').map(Number);
  // Local time as UTC components, then subtract offset to get true UTC.
  return new Date(Date.UTC(y, mo - 1, d, h - BUSINESS_TZ_OFFSET_HOURS, mi, 0));
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const db = getServiceSupabaseClient();

  // Scope query to appointments whose date could plausibly contain windows.
  // Bookings in the next ~2 hours land on today or tomorrow (UTC).
  const today = isoDate(now);
  const tomorrow = isoDate(new Date(now.getTime() + 24 * 60 * 60 * 1000));

  const { data, error } = await db
    .from('appointments')
    .select(
      'id, date, start_time, status, business:businesses(name, address, phone, owner_whatsapp, owner_id), service:services(name, price, duration_minutes), user:users(name, email, phone)'
    )
    .eq('status', 'booked')
    .in('date', [today, tomorrow]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const appointments = (data ?? []) as unknown as AppointmentRow[];
  const results: Array<{
    appointmentId: string;
    window: ReminderWindow;
    email: string | null;
    whatsapp: string | null;
  }> = [];

  for (const appt of appointments) {
    const apptTime = appointmentUtcTime(appt.date, appt.start_time);
    const diffMin = (apptTime.getTime() - now.getTime()) / 60000;

    for (const w of WINDOWS) {
      if (Math.abs(diffMin - w.minutes) > TOLERANCE_MINUTES) continue;
      const customerName = appt.user?.name ?? 'Customer';
      const customerEmail = appt.user?.email ?? null;
      const customerPhone = appt.user?.phone ?? null;
      if (!customerEmail && !customerPhone) continue;

      const summary = await sendReminderNotifications({
        appointmentId: appt.id,
        customerName,
        customerEmail,
        customerPhone,
        businessName: appt.business?.name ?? 'BookOurSpot Business',
        businessAddress: appt.business?.address ?? null,
        businessPhone: appt.business?.phone ?? null,
        serviceName: appt.service?.name ?? 'Service',
        servicePrice: Number(appt.service?.price ?? 0),
        durationMinutes: appt.service?.duration_minutes ?? undefined,
        date: appt.date,
        startTime: appt.start_time,
        window: w.label,
      });

      results.push({
        appointmentId: appt.id,
        window: w.label,
        email: summary.email?.status ?? null,
        whatsapp: summary.whatsapp?.status ?? null,
      });
    }
  }

  return NextResponse.json({
    ran_at: now.toISOString(),
    scanned: appointments.length,
    dispatched: results.length,
    results,
  });
}
