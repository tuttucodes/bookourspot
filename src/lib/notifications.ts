import 'server-only';

import BookingCancelled from '@/lib/email/templates/booking-cancelled';
import BookingConfirmed from '@/lib/email/templates/booking-confirmed';
import OwnerNewBooking from '@/lib/email/templates/owner-new-booking';
import Welcome from '@/lib/email/templates/welcome';
import AppointmentReminder, {
  type ReminderWindow,
} from '@/lib/email/templates/appointment-reminder';
import { sendEmail, sendWhatsApp, type SendResult } from '@/lib/email/send';
import { formatTime } from './slots';
import { getPublicSiteUrl } from './env';

// ============================================================================
// Shared helpers
// ============================================================================

function formatDateHuman(dateISO: string): string {
  // dateISO like "2026-04-22"
  const [y, m, d] = dateISO.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function manageBookingUrl(appointmentId: string): string {
  const base = getPublicSiteUrl() || 'https://www.bookourspot.com';
  return `${base.replace(/\/$/, '')}/bookings?id=${appointmentId}`;
}

function merchantDashboardUrl(): string {
  const base = getPublicSiteUrl() || 'https://www.bookourspot.com';
  return `${base.replace(/\/$/, '')}/dashboard`;
}

function exploreUrl(): string {
  const base = getPublicSiteUrl() || 'https://www.bookourspot.com';
  return `${base.replace(/\/$/, '')}/explore`;
}

type BookingContext = {
  appointmentId: string;
  bookingToken: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  businessName: string;
  businessAddress?: string | null;
  businessPhone?: string | null;
  ownerEmail?: string | null;
  ownerName?: string | null;
  ownerWhatsApp?: string | null;
  serviceName: string;
  servicePrice: number;
  durationMinutes?: number;
  date: string; // ISO date
  startTime: string; // "HH:MM:SS"
};

// ============================================================================
// Booking confirmed — customer email + owner email + WhatsApp (customer/owner)
// ============================================================================

export type NotificationSummary = {
  customerEmail: SendResult | null;
  customerWhatsApp: SendResult | null;
  ownerEmail: SendResult | null;
  ownerWhatsApp: SendResult | null;
};

export async function sendBookingConfirmedNotifications(
  ctx: BookingContext
): Promise<NotificationSummary> {
  const dateHuman = formatDateHuman(ctx.date);
  const timeHuman = formatTime(ctx.startTime);
  const manageUrl = manageBookingUrl(ctx.appointmentId);

  const customerEmailP = ctx.customerEmail
    ? sendEmail({
        event: 'booking_confirmed',
        to: ctx.customerEmail,
        entityType: 'appointment',
        entityId: ctx.appointmentId,
        react: BookingConfirmed({
          customerName: ctx.customerName,
          businessName: ctx.businessName,
          businessAddress: ctx.businessAddress ?? undefined,
          businessPhone: ctx.businessPhone ?? undefined,
          serviceName: ctx.serviceName,
          servicePrice: ctx.servicePrice,
          dateHuman,
          timeHuman,
          durationMinutes: ctx.durationMinutes,
          bookingToken: ctx.bookingToken,
          manageUrl,
        }),
      })
    : Promise.resolve(null);

  const ownerEmailP = ctx.ownerEmail
    ? sendEmail({
        event: 'owner_new_booking',
        to: ctx.ownerEmail,
        entityType: 'appointment',
        entityId: ctx.appointmentId,
        react: OwnerNewBooking({
          ownerName: ctx.ownerName ?? undefined,
          businessName: ctx.businessName,
          customerName: ctx.customerName,
          customerPhone: ctx.customerPhone ?? undefined,
          customerEmail: ctx.customerEmail ?? undefined,
          serviceName: ctx.serviceName,
          servicePrice: ctx.servicePrice,
          dateHuman,
          timeHuman,
          durationMinutes: ctx.durationMinutes,
          bookingToken: ctx.bookingToken,
          dashboardUrl: merchantDashboardUrl(),
        }),
      })
    : Promise.resolve(null);

  // WhatsApp: freeform body works in dev sandbox or active 24h session.
  // In production, require approved ContentSid.
  const waConfirmSid = process.env.TWILIO_CONTENT_SID_BOOKING_CONFIRMED;
  const customerWhatsAppP = ctx.customerPhone
    ? sendWhatsApp({
        event: 'booking_confirmed',
        to: ctx.customerPhone,
        entityType: 'appointment',
        entityId: ctx.appointmentId,
        ...(waConfirmSid
          ? {
              contentSid: waConfirmSid,
              contentVariables: {
                '1': ctx.customerName,
                '2': ctx.businessName,
                '3': ctx.serviceName,
                '4': dateHuman,
                '5': timeHuman,
              },
            }
          : {
              body: `Hi ${ctx.customerName}, your booking is confirmed.\n\n${ctx.businessName}\n${ctx.serviceName}\n${dateHuman} at ${timeHuman}\nAmount: RM ${ctx.servicePrice.toFixed(2)} (pay at store)\nBooking token: ${ctx.bookingToken}`,
            }),
      })
    : Promise.resolve(null);

  const ownerWhatsAppP = ctx.ownerWhatsApp
    ? sendWhatsApp({
        event: 'owner_new_booking',
        to: ctx.ownerWhatsApp,
        entityType: 'appointment',
        entityId: ctx.appointmentId,
        body: `New booking at ${ctx.businessName}\n\nCustomer: ${ctx.customerName}${ctx.customerPhone ? `\nPhone: ${ctx.customerPhone}` : ''}\nService: ${ctx.serviceName}\n${dateHuman} at ${timeHuman}\nAmount: RM ${ctx.servicePrice.toFixed(2)}`,
      })
    : Promise.resolve(null);

  const [customerEmail, ownerEmail, customerWhatsApp, ownerWhatsApp] = await Promise.all([
    customerEmailP,
    ownerEmailP,
    customerWhatsAppP,
    ownerWhatsAppP,
  ]);

  return { customerEmail, ownerEmail, customerWhatsApp, ownerWhatsApp };
}

// ============================================================================
// Booking cancelled
// ============================================================================

export async function sendBookingCancelledNotifications(
  ctx: BookingContext & {
    cancelledBy: 'customer' | 'merchant';
    reason?: string | null;
  }
): Promise<NotificationSummary> {
  const dateHuman = formatDateHuman(ctx.date);
  const timeHuman = formatTime(ctx.startTime);
  const rebookUrl = exploreUrl();

  const customerEmailP = ctx.customerEmail
    ? sendEmail({
        event: 'booking_cancelled',
        to: ctx.customerEmail,
        entityType: 'appointment',
        entityId: ctx.appointmentId,
        react: BookingCancelled({
          customerName: ctx.customerName,
          businessName: ctx.businessName,
          serviceName: ctx.serviceName,
          dateHuman,
          timeHuman,
          bookingToken: ctx.bookingToken,
          cancelledBy: ctx.cancelledBy,
          reason: ctx.reason ?? undefined,
          rebookUrl,
        }),
      })
    : Promise.resolve(null);

  const customerWhatsAppP = ctx.customerPhone
    ? sendWhatsApp({
        event: 'booking_cancelled',
        to: ctx.customerPhone,
        entityType: 'appointment',
        entityId: ctx.appointmentId,
        body: `Your booking at ${ctx.businessName} on ${dateHuman} at ${timeHuman} has been cancelled${ctx.cancelledBy === 'merchant' ? ' by the business' : ''}.${ctx.reason ? `\nReason: ${ctx.reason}` : ''}\n\nBook a new slot: ${rebookUrl}`,
      })
    : Promise.resolve(null);

  const [customerEmail, customerWhatsApp] = await Promise.all([
    customerEmailP,
    customerWhatsAppP,
  ]);

  return {
    customerEmail,
    customerWhatsApp,
    ownerEmail: null,
    ownerWhatsApp: null,
  };
}

// ============================================================================
// Welcome — after signup
// ============================================================================

export async function sendWelcomeEmail(input: {
  userId: string;
  email: string;
  name: string;
  isMerchant?: boolean;
}): Promise<SendResult> {
  return sendEmail({
    event: 'welcome',
    to: input.email,
    entityType: 'user',
    entityId: input.userId,
    react: Welcome({
      customerName: input.name,
      exploreUrl: input.isMerchant ? merchantDashboardUrl() : exploreUrl(),
      isMerchant: input.isMerchant,
    }),
  });
}

// ============================================================================
// Reminders — called from cron
// ============================================================================

const WINDOW_TO_EVENT: Record<ReminderWindow, 'reminder_60m' | 'reminder_30m' | 'reminder_15m'> = {
  '60m': 'reminder_60m',
  '30m': 'reminder_30m',
  '15m': 'reminder_15m',
};

const WINDOW_LABELS: Record<ReminderWindow, string> = {
  '60m': '1 hour',
  '30m': '30 minutes',
  '15m': '15 minutes',
};

export async function sendReminderNotifications(
  ctx: BookingContext & { window: ReminderWindow }
): Promise<{ email: SendResult | null; whatsapp: SendResult | null }> {
  const dateHuman = formatDateHuman(ctx.date);
  const timeHuman = formatTime(ctx.startTime);
  const event = WINDOW_TO_EVENT[ctx.window];
  const manageUrl = manageBookingUrl(ctx.appointmentId);
  const label = WINDOW_LABELS[ctx.window];

  const emailP = ctx.customerEmail
    ? sendEmail({
        event,
        to: ctx.customerEmail,
        entityType: 'appointment',
        entityId: ctx.appointmentId,
        react: AppointmentReminder({
          customerName: ctx.customerName,
          businessName: ctx.businessName,
          businessAddress: ctx.businessAddress ?? undefined,
          businessPhone: ctx.businessPhone ?? undefined,
          serviceName: ctx.serviceName,
          dateHuman,
          timeHuman,
          bookingToken: ctx.bookingToken,
          window: ctx.window,
          manageUrl,
        }),
      })
    : Promise.resolve(null);

  const waReminderSid = process.env.TWILIO_CONTENT_SID_BOOKING_REMINDER;
  const whatsappP = ctx.customerPhone
    ? sendWhatsApp({
        event,
        to: ctx.customerPhone,
        entityType: 'appointment',
        entityId: ctx.appointmentId,
        ...(waReminderSid
          ? {
              contentSid: waReminderSid,
              contentVariables: {
                '1': ctx.customerName,
                '2': ctx.businessName,
                '3': ctx.serviceName,
                '4': timeHuman,
                '5': label,
              },
            }
          : {
              body: `Reminder: your appointment at ${ctx.businessName} for ${ctx.serviceName} is in ${label} (${timeHuman}).`,
            }),
      })
    : Promise.resolve(null);

  const [email, whatsapp] = await Promise.all([emailP, whatsappP]);
  return { email, whatsapp };
}

// ============================================================================
// Legacy compatibility wrapper for existing book route
// ============================================================================

/**
 * @deprecated prefer sendBookingConfirmedNotifications directly with full context.
 * Kept for drop-in compatibility with existing book route.
 */
export async function sendBookingNotifications(input: {
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  businessName: string;
  ownerWhatsApp?: string | null;
  serviceName: string;
  servicePrice: number;
  date: string;
  startTime: string;
  appointmentId: string;
}) {
  const summary = await sendBookingConfirmedNotifications({
    appointmentId: input.appointmentId,
    bookingToken: `BOS-${input.appointmentId.slice(0, 8).toUpperCase()}`,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone,
    businessName: input.businessName,
    ownerWhatsApp: input.ownerWhatsApp,
    serviceName: input.serviceName,
    servicePrice: input.servicePrice,
    date: input.date,
    startTime: input.startTime,
  });
  return {
    customerWhatsApp: summary.customerWhatsApp?.ok ?? false,
    customerEmail: summary.customerEmail?.ok ?? false,
    ownerWhatsApp: summary.ownerWhatsApp?.ok ?? false,
    errors: [summary.customerEmail, summary.customerWhatsApp, summary.ownerEmail, summary.ownerWhatsApp]
      .filter((r): r is SendResult => r !== null && !r.ok && r.status === 'failed')
      .map((r) => ('error' in r ? r.error : 'unknown')),
  };
}
