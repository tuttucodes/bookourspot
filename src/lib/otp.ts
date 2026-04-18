import 'server-only';

import { createHash, randomInt, timingSafeEqual } from 'crypto';
import { getServiceSupabaseClient } from '@/lib/supabase/service';

const OTP_TTL_SECONDS = 10 * 60; // 10 minutes
const MAX_SENDS_PER_HOUR = 3;
const MAX_ATTEMPTS = 5;

export type OtpPurpose = 'login' | 'phone_verify';

export type OtpSendResult =
  | { ok: true; expiresInSeconds: number; code: string; otpId: string }
  | { ok: false; error: 'rate_limited' | 'invalid_phone' | 'db_error'; details?: string };

export type OtpVerifyResult =
  | { ok: true; consumedCodeId: string }
  | {
      ok: false;
      error:
        | 'invalid_phone'
        | 'code_not_found'
        | 'code_expired'
        | 'code_mismatch'
        | 'too_many_attempts'
        | 'db_error';
      details?: string;
    };

/**
 * Normalize phone to E.164 assuming Malaysia country code.
 * Returns null for unparseable input.
 */
export function normalizePhoneE164(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('60')) return `+${digits}`;
  if (digits.startsWith('0')) return `+60${digits.slice(1)}`;
  if (input.startsWith('+')) return `+${digits}`;
  return `+${digits}`;
}

function getPepper(): string {
  const p = process.env.OTP_PEPPER;
  if (!p || p.length < 16) {
    throw new Error(
      'OTP_PEPPER missing or too short. Generate with: openssl rand -hex 32'
    );
  }
  return p;
}

function hashCode(code: string): string {
  return createHash('sha256').update(`${code}:${getPepper()}`).digest('hex');
}

function generateCode(): string {
  // 6-digit zero-padded. Uses crypto.randomInt for uniform distribution.
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

/**
 * Create + store an OTP. Returns the plaintext code so the caller can dispatch it.
 * Enforces rate limit: max 3 sends per phone per hour.
 */
export async function createOtp(
  phoneRaw: string,
  options: { purpose?: OtpPurpose; ip?: string; userAgent?: string; sentVia?: 'whatsapp' | 'sms' } = {}
): Promise<OtpSendResult> {
  const phone = normalizePhoneE164(phoneRaw);
  if (!phone) return { ok: false, error: 'invalid_phone' };

  const db = getServiceSupabaseClient();

  // Rate limit check
  const { data: recent, error: rateErr } = await db.rpc('otp_recent_send_count', {
    p_phone: phone,
  });
  if (rateErr) {
    return { ok: false, error: 'db_error', details: rateErr.message };
  }
  const sentInWindow = typeof recent === 'number' ? recent : 0;
  if (sentInWindow >= MAX_SENDS_PER_HOUR) {
    return { ok: false, error: 'rate_limited' };
  }

  const code = generateCode();
  const codeHash = hashCode(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000).toISOString();

  const { data: inserted, error: insertErr } = await db
    .from('otp_codes')
    .insert({
      phone,
      code_hash: codeHash,
      purpose: options.purpose ?? 'login',
      expires_at: expiresAt,
      sent_via: options.sentVia ?? 'whatsapp',
      ip: options.ip ?? null,
      user_agent: options.userAgent ?? null,
      max_attempts: MAX_ATTEMPTS,
    })
    .select('id')
    .single();
  if (insertErr || !inserted) {
    return { ok: false, error: 'db_error', details: insertErr?.message };
  }

  return { ok: true, expiresInSeconds: OTP_TTL_SECONDS, code, otpId: inserted.id };
}

/**
 * Verify a code for a phone. Consumes the code on success.
 * Compares hashes with timingSafeEqual to prevent timing oracles.
 */
export async function verifyOtp(
  phoneRaw: string,
  codeRaw: string
): Promise<OtpVerifyResult> {
  const phone = normalizePhoneE164(phoneRaw);
  if (!phone) return { ok: false, error: 'invalid_phone' };
  const code = codeRaw.trim();
  if (!/^\d{4,8}$/.test(code)) return { ok: false, error: 'code_mismatch' };

  const db = getServiceSupabaseClient();

  // Fetch latest active code
  const { data: row, error } = await db
    .from('otp_codes')
    .select('id, code_hash, attempts, max_attempts, expires_at, consumed_at')
    .eq('phone', phone)
    .is('consumed_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { ok: false, error: 'db_error', details: error.message };
  if (!row) return { ok: false, error: 'code_not_found' };

  if (new Date(row.expires_at) < new Date()) {
    return { ok: false, error: 'code_expired' };
  }
  if (row.attempts >= row.max_attempts) {
    return { ok: false, error: 'too_many_attempts' };
  }

  const candidateHash = hashCode(code);
  const storedBuf = Buffer.from(row.code_hash, 'hex');
  const candidateBuf = Buffer.from(candidateHash, 'hex');
  const match =
    storedBuf.length === candidateBuf.length && timingSafeEqual(storedBuf, candidateBuf);

  if (!match) {
    await db
      .from('otp_codes')
      .update({ attempts: row.attempts + 1 })
      .eq('id', row.id);
    return { ok: false, error: 'code_mismatch' };
  }

  // Success — consume
  const { error: consumeErr } = await db
    .from('otp_codes')
    .update({ consumed_at: new Date().toISOString(), attempts: row.attempts + 1 })
    .eq('id', row.id);
  if (consumeErr) {
    return { ok: false, error: 'db_error', details: consumeErr.message };
  }

  return { ok: true, consumedCodeId: row.id };
}
