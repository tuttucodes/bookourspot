import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { getServiceSupabaseClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ============================================================================
// Svix signature verification
// ============================================================================

const TIMESTAMP_TOLERANCE_SECONDS = 5 * 60; // reject events older than 5 minutes

function verifySignature(
  rawBody: string,
  headers: Headers,
  secret: string
): { ok: boolean; reason?: string } {
  const svixId = headers.get('svix-id');
  const svixTimestamp = headers.get('svix-timestamp');
  const svixSignature = headers.get('svix-signature');
  if (!svixId || !svixTimestamp || !svixSignature) {
    return { ok: false, reason: 'missing_svix_headers' };
  }

  // Timestamp replay check
  const ts = Number(svixTimestamp);
  if (!Number.isFinite(ts)) return { ok: false, reason: 'bad_timestamp' };
  const ageSeconds = Math.abs(Date.now() / 1000 - ts);
  if (ageSeconds > TIMESTAMP_TOLERANCE_SECONDS) {
    return { ok: false, reason: 'timestamp_too_old' };
  }

  // Secret is `whsec_<base64>`
  const secretBytes = secret.startsWith('whsec_')
    ? Buffer.from(secret.slice('whsec_'.length), 'base64')
    : Buffer.from(secret, 'utf8');

  const signedPayload = `${svixId}.${svixTimestamp}.${rawBody}`;
  const expectedSig = createHmac('sha256', secretBytes)
    .update(signedPayload)
    .digest('base64');

  // Header value is space-separated list of "v1,<sig>" pairs; any match is OK.
  const candidates = svixSignature.split(' ').map((s) => s.trim());
  for (const c of candidates) {
    const [, sig] = c.split(',');
    if (!sig) continue;
    const a = Buffer.from(sig);
    const b = Buffer.from(expectedSig);
    if (a.length === b.length && timingSafeEqual(a, b)) {
      return { ok: true };
    }
  }
  return { ok: false, reason: 'signature_mismatch' };
}

// ============================================================================
// Event handling
// ============================================================================

type ResendEvent = {
  type: string; // e.g. "email.sent", "email.delivered", "email.bounced", "email.complained"
  created_at?: string;
  data?: {
    email_id?: string;
    to?: string[];
    from?: string;
    subject?: string;
    bounce?: { type?: string; message?: string };
    complaint?: { type?: string };
  };
};

const HARD_BOUNCE_TYPES = new Set(['hard_bounce', 'permanent', 'bad_mailbox', 'no_mailbox']);

async function handleEvent(event: ResendEvent) {
  const db = getServiceSupabaseClient();
  const to = event.data?.to?.[0]?.toLowerCase();
  const emailId = event.data?.email_id;

  // Update notification_logs status
  if (emailId) {
    const statusMap: Record<string, string> = {
      'email.sent': 'sent',
      'email.delivered': 'sent',
      'email.bounced': 'bounced',
      'email.complained': 'complained',
      'email.failed': 'failed',
    };
    const newStatus = statusMap[event.type];
    if (newStatus) {
      const patch: Record<string, unknown> = { status: newStatus };
      if (event.type === 'email.delivered') {
        patch.delivered_at = new Date().toISOString();
      }
      await db.from('notification_logs').update(patch).eq('provider_message_id', emailId);
    }
  }

  // Suppress on hard bounce / complaint
  if (!to) return;
  if (event.type === 'email.bounced') {
    const bounceType = (event.data?.bounce?.type ?? '').toLowerCase();
    const hard = HARD_BOUNCE_TYPES.has(bounceType);
    const reason = hard ? 'bounce_hard' : 'bounce_soft';
    if (hard) {
      await db.from('email_suppressions').upsert(
        {
          email: to,
          reason,
          last_event_at: new Date().toISOString(),
          details: event.data?.bounce ?? null,
        },
        { onConflict: 'email', ignoreDuplicates: false }
      );
    }
  } else if (event.type === 'email.complained') {
    await db.from('email_suppressions').upsert(
      {
        email: to,
        reason: 'complaint',
        last_event_at: new Date().toISOString(),
        details: event.data?.complaint ?? null,
      },
      { onConflict: 'email', ignoreDuplicates: false }
    );
  }
}

// ============================================================================
// Route
// ============================================================================

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[resend-webhook] RESEND_WEBHOOK_SECRET not set — rejecting.');
    return NextResponse.json({ error: 'webhook_not_configured' }, { status: 500 });
  }

  const rawBody = await request.text();
  const verify = verifySignature(rawBody, request.headers, secret);
  if (!verify.ok) {
    return NextResponse.json({ error: 'invalid_signature', reason: verify.reason }, { status: 401 });
  }

  let event: ResendEvent;
  try {
    event = JSON.parse(rawBody) as ResendEvent;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  try {
    await handleEvent(event);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[resend-webhook] handler error', msg);
    // Return 200 anyway so Svix doesn't retry; error is in our logs.
  }

  return NextResponse.json({ ok: true });
}
