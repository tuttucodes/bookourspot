import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getServiceSupabaseClient } from '@/lib/supabase/service';

type Body = {
  subject?: string;
  message?: string;
  category?: string;
  // Guest only
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
};

const CATEGORIES = new Set([
  'general',
  'booking',
  'payment',
  'account',
  'merchant_onboarding',
  'bug',
  'other',
]);

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Body;
  const subject = body.subject?.trim();
  const message = body.message?.trim();
  const category = body.category && CATEGORIES.has(body.category) ? body.category : 'general';

  if (!subject || subject.length < 3) {
    return NextResponse.json({ error: 'Subject must be at least 3 characters.' }, { status: 400 });
  }
  if (!message || message.length < 10) {
    return NextResponse.json({ error: 'Message must be at least 10 characters.' }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  // Authenticated: use their id + role lookup.
  if (authUser) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .maybeSingle();
    const submitterRole =
      profile?.role === 'merchant' || profile?.role === 'pending_merchant'
        ? 'merchant'
        : 'customer';
    const { data, error } = await supabase
      .from('support_queries')
      .insert({
        submitter_id: authUser.id,
        submitter_role: submitterRole,
        subject: subject.slice(0, 200),
        message: message.slice(0, 4000),
        category,
        status: 'open',
      })
      .select('id')
      .single();
    if (error || !data) return NextResponse.json({ error: error?.message ?? 'insert_failed' }, { status: 400 });
    return NextResponse.json({ data: { id: data.id } });
  }

  // Guest path — require at least email or phone to reach back.
  const guestEmail = body.guest_email?.trim();
  const guestName = body.guest_name?.trim();
  const guestPhone = body.guest_phone?.trim();
  if (!guestEmail && !guestPhone) {
    return NextResponse.json(
      { error: 'Please provide an email or phone so we can reply.' },
      { status: 400 }
    );
  }
  const svc = getServiceSupabaseClient();
  const { data, error } = await svc
    .from('support_queries')
    .insert({
      submitter_id: null,
      submitter_role: 'guest',
      guest_name: guestName ?? null,
      guest_email: guestEmail ?? null,
      guest_phone: guestPhone ?? null,
      subject: subject.slice(0, 200),
      message: message.slice(0, 4000),
      category,
      status: 'open',
    })
    .select('id')
    .single();
  if (error || !data) return NextResponse.json({ error: error?.message ?? 'insert_failed' }, { status: 400 });
  return NextResponse.json({ data: { id: data.id } });
}
