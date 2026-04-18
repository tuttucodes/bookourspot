import 'server-only';

type TwilioEnv = {
  twilioSid: string;
  twilioToken: string;
  twilioWhatsAppFrom: string;
  twilioContentSidConfirmation?: string;
};

type ResendEnv = {
  resendApiKey: string;
  emailFrom: string;
};

export function getServerSupabaseServiceConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for server-side tasks.'
    );
  }

  return { url, serviceRoleKey };
}

export function getTwilioEnv(): TwilioEnv | null {
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioWhatsAppFrom = process.env.TWILIO_WHATSAPP_FROM;

  if (!twilioSid || !twilioToken || !twilioWhatsAppFrom) return null;

  return {
    twilioSid,
    twilioToken,
    twilioWhatsAppFrom,
    twilioContentSidConfirmation: process.env.TWILIO_CONTENT_SID_CONFIRMATION || undefined,
  };
}

export function getResendEnv(): ResendEnv | null {
  const resendApiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.RESEND_FROM_EMAIL;

  if (!resendApiKey || !emailFrom) return null;

  return { resendApiKey, emailFrom };
}
