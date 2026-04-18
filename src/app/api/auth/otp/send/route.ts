import { NextResponse } from 'next/server';
import { createOtp } from '@/lib/otp';
import { sendWhatsApp } from '@/lib/email/send';

type Body = {
  phone?: string;
};

function getClientIp(request: Request): string | null {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return request.headers.get('x-real-ip');
}

/**
 * POST /api/auth/otp/send
 * Body: { phone }
 *
 * Creates a 6-digit OTP code, stores hashed, sends via Twilio WhatsApp.
 * Rate limited to 3 sends per phone per hour. Returns expiry in seconds.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Body;
  if (!body.phone) {
    return NextResponse.json({ error: 'Missing phone.' }, { status: 400 });
  }

  const ip = getClientIp(request) ?? undefined;
  const userAgent = request.headers.get('user-agent') ?? undefined;

  const created = await createOtp(body.phone, {
    purpose: 'login',
    ip,
    userAgent,
    sentVia: 'whatsapp',
  });

  if (!created.ok) {
    const status =
      created.error === 'invalid_phone'
        ? 400
        : created.error === 'rate_limited'
          ? 429
          : 500;
    return NextResponse.json(
      { error: created.error, details: created.details },
      { status }
    );
  }

  // Dispatch via WhatsApp. Use approved Content Template if available (prod).
  const otpSid = process.env.TWILIO_CONTENT_SID_OTP;
  const dispatch = await sendWhatsApp({
    event: 'otp_login',
    to: body.phone,
    entityType: 'otp',
    entityId: created.otpId,
    ...(otpSid
      ? {
          contentSid: otpSid,
          contentVariables: { '1': created.code },
        }
      : {
          body: `Your BookOurSpot login code is ${created.code}. It expires in 10 minutes. Do not share this code with anyone.`,
        }),
  });

  // In dev with Twilio not configured, surface code inline so you can test the
  // flow without WhatsApp. NEVER enable this in production.
  const debugCode =
    process.env.NODE_ENV !== 'production' && dispatch.status === 'skipped_not_configured'
      ? created.code
      : undefined;

  if (!dispatch.ok && dispatch.status === 'failed') {
    return NextResponse.json(
      {
        error: 'dispatch_failed',
        details: 'error' in dispatch ? dispatch.error : undefined,
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    status: 'sent',
    expires_in_seconds: created.expiresInSeconds,
    channel: dispatch.ok ? 'whatsapp' : dispatch.status,
    ...(debugCode ? { debug_code: debugCode } : {}),
  });
}
