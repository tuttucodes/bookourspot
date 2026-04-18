import { NextResponse } from 'next/server';
import { normalizePhoneE164, verifyOtp } from '@/lib/otp';
import { getServiceSupabaseClient } from '@/lib/supabase/service';
import { getPublicSiteUrl } from '@/lib/env';
import { sendWelcomeEmail } from '@/lib/notifications';

type Body = {
  phone?: string;
  code?: string;
  // Required only when no existing user exists for this phone.
  email?: string;
  name?: string;
  redirect_to?: string;
};

/**
 * POST /api/auth/otp/verify
 * Body: { phone, code, email?, name?, redirect_to? }
 *
 * Flow:
 *  1. Verify the OTP code against otp_codes table (timing-safe comparison).
 *  2. Look up users by phone. If none: create Supabase Auth user with the provided
 *     email (required) + phone. Otherwise, use the existing user's email.
 *  3. Mark phone_verified=true on the users row.
 *  4. Generate a Supabase magic link for the email.
 *  5. Return { magic_link } — the client navigates to it to establish the session.
 *
 * Why magic link rather than direct session cookie?
 *  Supabase does not expose a "sign in by user id" admin API. generateLink +
 *  client-side navigation is the supported pattern for custom OTP flows.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Body;
  if (!body.phone || !body.code) {
    return NextResponse.json({ error: 'Missing phone or code.' }, { status: 400 });
  }

  const verification = await verifyOtp(body.phone, body.code);
  if (!verification.ok) {
    const status =
      verification.error === 'too_many_attempts'
        ? 429
        : verification.error === 'code_expired' || verification.error === 'code_not_found'
          ? 410
          : 400;
    return NextResponse.json(
      { error: verification.error, details: verification.details },
      { status }
    );
  }

  const phone = normalizePhoneE164(body.phone)!;
  const db = getServiceSupabaseClient();

  // Find existing profile by phone
  const { data: existing, error: lookupErr } = await db
    .from('users')
    .select('id, email, name')
    .eq('phone', phone)
    .maybeSingle();
  if (lookupErr) {
    return NextResponse.json({ error: 'lookup_failed', details: lookupErr.message }, { status: 500 });
  }

  let userId: string;
  let userEmail: string;
  let isNewUser = false;

  if (existing) {
    userId = existing.id;
    userEmail = existing.email;
  } else {
    if (!body.email) {
      return NextResponse.json(
        {
          error: 'email_required',
          message: 'No account for this phone. Provide email + name to create one.',
        },
        { status: 422 }
      );
    }
    const name = body.name?.trim() || body.email.split('@')[0];

    // Create auth user via admin. Auto-confirms email (no verification step) since
    // the caller has already proven phone control via OTP.
    const { data: created, error: createErr } =
      await db.auth.admin.createUser({
        email: body.email,
        phone,
        email_confirm: true,
        phone_confirm: true,
        user_metadata: { name, phone_verified_via_otp: true, role: 'customer' },
      });
    if (createErr || !created.user) {
      return NextResponse.json(
        { error: 'create_user_failed', details: createErr?.message },
        { status: 500 }
      );
    }
    userId = created.user.id;
    userEmail = body.email;
    isNewUser = true;

    // The handle_new_user trigger will create public.users row from auth.users.
    // Patch phone + name since the trigger may not fill them.
    await db
      .from('users')
      .update({
        phone,
        phone_verified: true,
        phone_verified_at: new Date().toISOString(),
        name,
      })
      .eq('id', userId);
  }

  // Update phone verification flag (no-op if already set)
  await db
    .from('users')
    .update({
      phone_verified: true,
      phone_verified_at: new Date().toISOString(),
    })
    .eq('id', userId);

  // Compute redirect target
  const siteUrl = (getPublicSiteUrl() || 'https://www.bookourspot.com').replace(/\/$/, '');
  const redirectTarget = body.redirect_to || `${siteUrl}/explore`;
  const callbackUrl = `${siteUrl}/auth/callback?redirect=${encodeURIComponent(redirectTarget)}`;

  // Generate a single-use magic link to sign them in.
  const { data: link, error: linkErr } = await db.auth.admin.generateLink({
    type: 'magiclink',
    email: userEmail,
    options: { redirectTo: callbackUrl },
  });
  if (linkErr || !link?.properties?.action_link) {
    return NextResponse.json(
      { error: 'magic_link_failed', details: linkErr?.message },
      { status: 500 }
    );
  }

  // Fire-and-forget welcome email for new users (idempotent via notification_logs)
  if (isNewUser) {
    sendWelcomeEmail({
      userId,
      email: userEmail,
      name: existing?.name || body.name || userEmail.split('@')[0],
      isMerchant: false,
    }).catch((err) => console.warn('[otp-verify] welcome email error', err));
  }

  return NextResponse.json({
    status: 'verified',
    is_new_user: isNewUser,
    magic_link: link.properties.action_link,
  });
}
