import 'server-only';

type RequiredEnv = {
  twilioSid: string;
  twilioToken: string;
  twilioWhatsAppFrom: string;
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

export function getRequiredNotificationEnv(): RequiredEnv {
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioWhatsAppFrom = process.env.TWILIO_WHATSAPP_FROM;
  const resendApiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.RESEND_FROM_EMAIL;

  if (!twilioSid || !twilioToken || !twilioWhatsAppFrom || !resendApiKey || !emailFrom) {
    throw new Error(
      'Missing notification environment variables. Check TWILIO_* and RESEND_* values.'
    );
  }

  return {
    twilioSid,
    twilioToken,
    twilioWhatsAppFrom,
    resendApiKey,
    emailFrom,
  };
}
