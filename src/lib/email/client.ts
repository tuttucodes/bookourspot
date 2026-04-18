import 'server-only';

import { Resend } from 'resend';
import { getResendEnv } from '@/lib/env.server';

let cached: Resend | null = null;

export function getResendClient(): Resend | null {
  if (cached) return cached;
  const env = getResendEnv();
  if (!env) return null;
  cached = new Resend(env.resendApiKey);
  return cached;
}

export function getResendFromAddress(): string | null {
  return getResendEnv()?.emailFrom ?? null;
}

export function getResendReplyTo(): string | null {
  return process.env.RESEND_REPLY_TO || null;
}
