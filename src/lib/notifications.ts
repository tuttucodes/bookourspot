import 'server-only';

import { formatTime } from './slots';
import { getRequiredNotificationEnv } from './env.server';

type BookingNotificationInput = {
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
};

type NotificationResult = {
  customerWhatsApp: boolean;
  customerEmail: boolean;
  ownerWhatsApp: boolean;
  errors: string[];
};

function normalizePhoneE164(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  if (!digits) return null;

  if (digits.startsWith('60')) return `+${digits}`;
  if (digits.startsWith('0')) return `+60${digits.slice(1)}`;
  return `+${digits}`;
}

function customerMessage(input: BookingNotificationInput): string {
  return `Hi ${input.customerName}, your booking is confirmed.

Business: ${input.businessName}
Service: ${input.serviceName}
Date: ${input.date}
Time: ${formatTime(input.startTime)}
Amount: RM ${input.servicePrice.toFixed(2)}
Booking ID: ${input.appointmentId}

Thanks for booking with BookOurSpot.`;
}

function ownerMessage(input: BookingNotificationInput): string {
  return `New booking received.

Customer: ${input.customerName}
Phone: ${input.customerPhone || 'Not provided'}
Business: ${input.businessName}
Service: ${input.serviceName}
Date: ${input.date}
Time: ${formatTime(input.startTime)}
Amount: RM ${input.servicePrice.toFixed(2)}
Booking ID: ${input.appointmentId}`;
}

async function sendTwilioWhatsApp(to: string, message: string): Promise<void> {
  const env = getRequiredNotificationEnv();
  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${env.twilioSid}/Messages.json`;
  const auth = Buffer.from(`${env.twilioSid}:${env.twilioToken}`).toString('base64');

  const body = new URLSearchParams({
    From: `whatsapp:${env.twilioWhatsAppFrom}`,
    To: `whatsapp:${to}`,
    Body: message,
  });

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Twilio WhatsApp failed: ${response.status} ${details}`);
  }
}

async function sendResendEmail(to: string, subject: string, html: string): Promise<void> {
  const env = getRequiredNotificationEnv();

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.emailFrom,
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Resend email failed: ${response.status} ${details}`);
  }
}

export async function sendBookingNotifications(
  input: BookingNotificationInput
): Promise<NotificationResult> {
  const result: NotificationResult = {
    customerWhatsApp: false,
    customerEmail: false,
    ownerWhatsApp: false,
    errors: [],
  };

  const customerWhatsApp = input.customerPhone
    ? normalizePhoneE164(input.customerPhone)
    : null;
  const ownerWhatsApp = input.ownerWhatsApp
    ? normalizePhoneE164(input.ownerWhatsApp)
    : null;

  if (customerWhatsApp) {
    try {
      await sendTwilioWhatsApp(customerWhatsApp, customerMessage(input));
      result.customerWhatsApp = true;
    } catch (error) {
      result.errors.push((error as Error).message);
    }
  }

  if (input.customerEmail) {
    try {
      await sendResendEmail(
        input.customerEmail,
        `Booking confirmed with ${input.businessName}`,
        `<p>Hi ${input.customerName},</p>
         <p>Your booking is confirmed.</p>
         <ul>
           <li><strong>Business:</strong> ${input.businessName}</li>
           <li><strong>Service:</strong> ${input.serviceName}</li>
           <li><strong>Date:</strong> ${input.date}</li>
           <li><strong>Time:</strong> ${formatTime(input.startTime)}</li>
           <li><strong>Amount:</strong> RM ${input.servicePrice.toFixed(2)}</li>
           <li><strong>Booking ID:</strong> ${input.appointmentId}</li>
         </ul>
         <p>Thanks for booking with BookOurSpot.</p>`
      );
      result.customerEmail = true;
    } catch (error) {
      result.errors.push((error as Error).message);
    }
  }

  if (ownerWhatsApp) {
    try {
      await sendTwilioWhatsApp(ownerWhatsApp, ownerMessage(input));
      result.ownerWhatsApp = true;
    } catch (error) {
      result.errors.push((error as Error).message);
    }
  }

  return result;
}
