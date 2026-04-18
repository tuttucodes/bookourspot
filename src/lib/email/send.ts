import 'server-only';

import { render } from '@react-email/render';
import type { ReactElement } from 'react';

import { getResendClient, getResendFromAddress, getResendReplyTo } from './client';
import {
  EVENT_SUBJECTS,
  type NotificationChannel,
  type NotificationEntityType,
  type NotificationEvent,
  type NotificationLogStatus,
  type NotificationProvider,
} from './events';
import { getServiceSupabaseClient } from '@/lib/supabase/service';

// ============================================================================
// Types
// ============================================================================

export type SendEmailInput = {
  event: NotificationEvent;
  to: string;
  entityType: NotificationEntityType;
  entityId?: string | null;
  subject?: string;
  react?: ReactElement;
  html?: string;
  text?: string;
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
};

export type SendWhatsAppInput = {
  event: NotificationEvent;
  to: string; // E.164
  entityType: NotificationEntityType;
  entityId?: string | null;
  body?: string; // Freeform — only works inside 24h session (sandbox or replied user)
  contentSid?: string; // Approved Twilio Content Template SID (HX...)
  contentVariables?: Record<string, string>;
};

export type SendResult =
  | { ok: true; status: 'sent'; logId: string; providerMessageId: string | null }
  | { ok: false; status: 'skipped_duplicate'; logId: string | null; reason: string }
  | { ok: false; status: 'skipped_suppressed'; logId: string | null; reason: string }
  | { ok: false; status: 'skipped_not_configured'; logId: null; reason: string }
  | { ok: false; status: 'failed'; logId: string | null; error: string };

// ============================================================================
// Helpers
// ============================================================================

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function normalizePhoneE164(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('60')) return `+${digits}`;
  if (digits.startsWith('0')) return `+60${digits.slice(1)}`;
  if (input.startsWith('+')) return `+${digits}`;
  return `+${digits}`;
}

async function isEmailSuppressed(email: string): Promise<{ suppressed: boolean; reason?: string }> {
  const db = getServiceSupabaseClient();
  const { data, error } = await db
    .from('email_suppressions')
    .select('reason')
    .eq('email', email)
    .maybeSingle();
  if (error) {
    // Fail open: log but don't block send. Suppression table outage shouldn't stop mail.
    console.warn('[email] suppression lookup failed', error.message);
    return { suppressed: false };
  }
  return data ? { suppressed: true, reason: data.reason } : { suppressed: false };
}

type QueueLogInput = {
  event: NotificationEvent;
  channel: NotificationChannel;
  provider: NotificationProvider;
  recipient: string;
  entityType: NotificationEntityType;
  entityId?: string | null;
  subject?: string;
  payload?: Record<string, unknown>;
};

type QueueLogResult =
  | { ok: true; logId: string }
  | { ok: false; reason: 'duplicate' | 'db_error'; error?: string };

async function queueLog(input: QueueLogInput): Promise<QueueLogResult> {
  const db = getServiceSupabaseClient();
  const { data, error } = await db
    .from('notification_logs')
    .insert({
      event_type: input.event,
      channel: input.channel,
      provider: input.provider,
      recipient: input.recipient,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      subject: input.subject ?? null,
      payload: input.payload ?? null,
      status: 'queued',
    })
    .select('id')
    .single();

  if (error) {
    // 23505 = unique_violation — dedup tripped
    if (error.code === '23505') {
      return { ok: false, reason: 'duplicate' };
    }
    return { ok: false, reason: 'db_error', error: error.message };
  }
  return { ok: true, logId: data.id };
}

async function updateLog(
  logId: string,
  patch: {
    status: NotificationLogStatus;
    providerMessageId?: string | null;
    error?: string | null;
  }
): Promise<void> {
  const db = getServiceSupabaseClient();
  const { error } = await db
    .from('notification_logs')
    .update({
      status: patch.status,
      provider_message_id: patch.providerMessageId ?? null,
      error: patch.error ?? null,
      sent_at: patch.status === 'sent' ? new Date().toISOString() : null,
    })
    .eq('id', logId);
  if (error) console.warn('[email] log update failed', error.message);
}

/**
 * Deterministic idempotency key for Resend's 24h dedup window.
 * Pattern: <event>/<entityType>/<entityId>/<recipientHash>.
 * Recipients are hashed to keep key under 256 chars.
 */
async function buildIdempotencyKey(
  event: NotificationEvent,
  entityType: NotificationEntityType,
  entityId: string | null | undefined,
  recipient: string
): Promise<string> {
  const data = new TextEncoder().encode(recipient);
  const hashBuf = await crypto.subtle.digest('SHA-256', data);
  const hex = Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16);
  return `${event}/${entityType}/${entityId || 'none'}/${hex}`;
}

// ============================================================================
// sendEmail — public entrypoint
// ============================================================================

export async function sendEmail(input: SendEmailInput): Promise<SendResult> {
  const client = getResendClient();
  const from = getResendFromAddress();
  if (!client || !from) {
    return {
      ok: false,
      status: 'skipped_not_configured',
      logId: null,
      reason: 'Resend not configured (missing RESEND_API_KEY or RESEND_FROM_EMAIL).',
    };
  }

  const to = normalizeEmail(input.to);
  const subject = input.subject ?? EVENT_SUBJECTS[input.event];

  // Suppression check (bounce/complaint list)
  const suppressed = await isEmailSuppressed(to);
  if (suppressed.suppressed) {
    return {
      ok: false,
      status: 'skipped_suppressed',
      logId: null,
      reason: `Suppressed: ${suppressed.reason ?? 'unknown'}`,
    };
  }

  // Insert log — dedup tripped = duplicate
  const queued = await queueLog({
    event: input.event,
    channel: 'email',
    provider: 'resend',
    recipient: to,
    entityType: input.entityType,
    entityId: input.entityId,
    subject,
  });
  if (!queued.ok) {
    return {
      ok: false,
      status: queued.reason === 'duplicate' ? 'skipped_duplicate' : 'failed',
      logId: null,
      ...(queued.reason === 'duplicate'
        ? { reason: 'Already queued/sent for this event' }
        : { error: queued.error ?? 'queue log failed' }),
    } as SendResult;
  }

  // Resolve content — prefer explicit html over react render
  let html = input.html;
  let text = input.text;
  if (!html && input.react) {
    html = await render(input.react);
    text = text ?? (await render(input.react, { plainText: true }));
  }
  if (!html && !text) {
    await updateLog(queued.logId, { status: 'failed', error: 'No html/text/react content provided' });
    return { ok: false, status: 'failed', logId: queued.logId, error: 'No content' };
  }

  const idempotencyKey = await buildIdempotencyKey(
    input.event,
    input.entityType,
    input.entityId,
    to
  );

  // Resend SDK's discriminated union for content (html XOR text XOR react XOR template).
  // We normalized everything to html (+ optional plaintext text) above.
  const base = {
    from,
    to: [to],
    subject,
    replyTo: input.replyTo ?? getResendReplyTo() ?? undefined,
    tags: input.tags ?? [
      { name: 'event', value: input.event },
      ...(input.entityId ? [{ name: 'entity_id', value: input.entityId }] : []),
    ],
  };
  const payload = html
    ? { ...base, html, ...(text ? { text } : {}) }
    : { ...base, text: text! };

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await client.emails.send(payload as any, { idempotencyKey });

    if (error) {
      await updateLog(queued.logId, { status: 'failed', error: error.message });
      return { ok: false, status: 'failed', logId: queued.logId, error: error.message };
    }
    await updateLog(queued.logId, {
      status: 'sent',
      providerMessageId: data?.id ?? null,
    });
    return {
      ok: true,
      status: 'sent',
      logId: queued.logId,
      providerMessageId: data?.id ?? null,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await updateLog(queued.logId, { status: 'failed', error: msg });
    return { ok: false, status: 'failed', logId: queued.logId, error: msg };
  }
}

// ============================================================================
// sendWhatsApp — Twilio path. Uses Content Template if contentSid provided (prod),
// falls back to freeform Body (dev sandbox or active 24h session).
// ============================================================================

export async function sendWhatsApp(input: SendWhatsAppInput): Promise<SendResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!sid || !token || !from) {
    return {
      ok: false,
      status: 'skipped_not_configured',
      logId: null,
      reason: 'Twilio not configured (missing TWILIO_ACCOUNT_SID/AUTH_TOKEN/WHATSAPP_FROM).',
    };
  }
  if (!input.contentSid && !input.body) {
    return {
      ok: false,
      status: 'skipped_not_configured',
      logId: null,
      reason: 'Neither contentSid nor body provided.',
    };
  }

  const to = normalizePhoneE164(input.to);
  if (!to) {
    return {
      ok: false,
      status: 'failed',
      logId: null,
      error: `Invalid phone: ${input.to}`,
    };
  }

  const queued = await queueLog({
    event: input.event,
    channel: 'whatsapp',
    provider: 'twilio',
    recipient: to,
    entityType: input.entityType,
    entityId: input.entityId,
  });
  if (!queued.ok) {
    return {
      ok: false,
      status: queued.reason === 'duplicate' ? 'skipped_duplicate' : 'failed',
      logId: null,
      ...(queued.reason === 'duplicate'
        ? { reason: 'Already queued/sent for this event' }
        : { error: queued.error ?? 'queue log failed' }),
    } as SendResult;
  }

  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const auth = Buffer.from(`${sid}:${token}`).toString('base64');
  const body = new URLSearchParams({
    From: `whatsapp:${from}`,
    To: `whatsapp:${to}`,
  });
  if (input.contentSid) {
    body.set('ContentSid', input.contentSid);
    if (input.contentVariables) {
      body.set('ContentVariables', JSON.stringify(input.contentVariables));
    }
  } else if (input.body) {
    body.set('Body', input.body);
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (!response.ok) {
      const detail = await response.text();
      await updateLog(queued.logId, { status: 'failed', error: `${response.status} ${detail}` });
      return {
        ok: false,
        status: 'failed',
        logId: queued.logId,
        error: `Twilio ${response.status}: ${detail}`,
      };
    }
    const json = (await response.json()) as { sid?: string };
    await updateLog(queued.logId, {
      status: 'sent',
      providerMessageId: json.sid ?? null,
    });
    return {
      ok: true,
      status: 'sent',
      logId: queued.logId,
      providerMessageId: json.sid ?? null,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await updateLog(queued.logId, { status: 'failed', error: msg });
    return { ok: false, status: 'failed', logId: queued.logId, error: msg };
  }
}
