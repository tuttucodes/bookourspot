import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { sendWelcomeEmail } from '@/lib/notifications';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Supabase Database Webhook target: fires on INSERT into public.users.
 *
 * Configure in Supabase dashboard:
 *   Database -> Webhooks -> Create
 *   Name: user-created-welcome
 *   Table: public.users | Events: Insert
 *   Type: HTTP Request | Method: POST
 *   URL: https://www.bookourspot.com/api/webhooks/supabase/user-created
 *   HTTP Headers: Authorization: Bearer <SUPABASE_WEBHOOK_SECRET>
 *
 * Idempotent: sendWelcomeEmail dedups via notification_logs unique (welcome+user+user_id).
 */

type WebhookPayload = {
  type?: string;
  table?: string;
  schema?: string;
  record?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
};

function authorize(request: Request): boolean {
  const secret = process.env.SUPABASE_WEBHOOK_SECRET;
  if (!secret) return false;
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return false;
  const provided = header.slice('Bearer '.length);
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let payload: WebhookPayload;
  try {
    payload = (await request.json()) as WebhookPayload;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  if (payload.type !== 'INSERT' || payload.table !== 'users') {
    return NextResponse.json({ ok: true, skipped: 'not_user_insert' });
  }

  const record = payload.record ?? {};
  if (!record.id || !record.email) {
    return NextResponse.json({ ok: true, skipped: 'missing_fields' });
  }

  const result = await sendWelcomeEmail({
    userId: record.id,
    email: record.email,
    name: record.name || record.email.split('@')[0],
    isMerchant: record.role === 'merchant',
  });

  return NextResponse.json({
    ok: true,
    email_status: result.status,
  });
}
