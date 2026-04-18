import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { getServiceSupabaseClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Twilio StatusCallback webhook.
 *
 * Configure in Twilio Console on your WhatsApp sender under "Status Callback URL":
 *   POST https://www.bookourspot.com/api/webhooks/twilio
 *
 * Twilio posts application/x-www-form-urlencoded with fields:
 *   MessageSid, MessageStatus, To, From, ErrorCode, ErrorMessage, ...
 * Signed via X-Twilio-Signature (HMAC-SHA1, base64).
 */

// ============================================================================
// Twilio signature verification
// Reference: https://www.twilio.com/docs/usage/webhooks/webhooks-security
// ============================================================================

function verifyTwilioSignature(
  fullUrl: string,
  params: Record<string, string>,
  signatureHeader: string | null,
  authToken: string
): boolean {
  if (!signatureHeader) return false;

  // Concatenate URL + keys sorted alphabetically + concatenated values.
  const sortedKeys = Object.keys(params).sort();
  let data = fullUrl;
  for (const k of sortedKeys) data += k + params[k];

  const expected = createHmac('sha1', authToken).update(data).digest('base64');
  const a = Buffer.from(signatureHeader);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function reconstructUrl(request: Request): string {
  // Twilio signs against the exact URL it posts to. Trust forwarded host+proto
  // headers on Vercel.
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const url = new URL(request.url);
  return `${proto}://${host}${url.pathname}${url.search}`;
}

// ============================================================================
// Handler
// ============================================================================

const STATUS_TO_LOG_STATUS: Record<string, 'sent' | 'failed' | 'bounced'> = {
  sent: 'sent',
  delivered: 'sent',
  undelivered: 'failed',
  failed: 'failed',
  read: 'sent',
};

export async function POST(request: Request) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    return NextResponse.json({ error: 'twilio_not_configured' }, { status: 500 });
  }

  const rawBody = await request.text();
  const params: Record<string, string> = {};
  for (const [k, v] of new URLSearchParams(rawBody)) params[k] = v;

  const url = reconstructUrl(request);
  const signature = request.headers.get('x-twilio-signature');
  if (!verifyTwilioSignature(url, params, signature, authToken)) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });
  }

  const sid = params.MessageSid || params.SmsSid;
  const status = (params.MessageStatus || params.SmsStatus || '').toLowerCase();
  const errorCode = params.ErrorCode;
  const errorMessage = params.ErrorMessage;

  if (!sid) {
    return NextResponse.json({ error: 'missing_sid' }, { status: 400 });
  }

  const mapped = STATUS_TO_LOG_STATUS[status];
  if (mapped) {
    const db = getServiceSupabaseClient();
    const patch: Record<string, unknown> = { status: mapped };
    if (status === 'delivered' || status === 'read') {
      patch.delivered_at = new Date().toISOString();
    }
    if (mapped === 'failed') {
      patch.error = errorCode ? `${errorCode}: ${errorMessage ?? ''}` : errorMessage ?? 'unknown';
    }
    await db.from('notification_logs').update(patch).eq('provider_message_id', sid);
  }

  return NextResponse.json({ ok: true });
}
