import 'server-only';

/**
 * Canonical notification event types.
 * Keep in sync with notification_logs.event_type check constraint.
 */
export type NotificationEvent =
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'owner_new_booking'
  | 'welcome'
  | 'reminder_60m'
  | 'reminder_30m'
  | 'reminder_15m'
  | 'otp_login';

export type NotificationChannel = 'email' | 'whatsapp' | 'sms';
export type NotificationProvider = 'resend' | 'twilio';
export type NotificationEntityType = 'appointment' | 'user' | 'otp' | 'other';

export type NotificationLogStatus =
  | 'queued'
  | 'sent'
  | 'failed'
  | 'bounced'
  | 'complained'
  | 'suppressed';

/** Human-readable subject prefix for events */
export const EVENT_SUBJECTS: Record<NotificationEvent, string> = {
  booking_confirmed: 'Your booking is confirmed',
  booking_cancelled: 'Your booking has been cancelled',
  owner_new_booking: 'New booking received',
  welcome: 'Welcome to BookOurSpot',
  reminder_60m: 'Reminder: appointment in 1 hour',
  reminder_30m: 'Reminder: appointment in 30 minutes',
  reminder_15m: 'Starting soon: appointment in 15 minutes',
  otp_login: 'Your BookOurSpot login code',
};
