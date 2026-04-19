import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getServiceSupabaseClient } from '@/lib/supabase/service';

type Role = 'manager' | 'staff';

type InviteBody = {
  email?: string;
  role?: Role;
};

async function resolveOwnerBusiness() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return { error: 'unauthorized' as const, status: 401 };

  const service = getServiceSupabaseClient();
  const { data: biz, error: bizErr } = await service
    .from('businesses')
    .select('id, owner_id, name, slug')
    .eq('owner_id', authUser.id)
    .maybeSingle();
  if (bizErr) return { error: bizErr.message, status: 500 };
  if (!biz) return { error: 'no_business_owned' as const, status: 404 };

  return { authUser, supabase, service, business: biz };
}

export async function GET() {
  const ctx = await resolveOwnerBusiness();
  if ('error' in ctx) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }
  const { service, business } = ctx;

  const { data, error } = await service
    .from('business_collaborators')
    .select('id, role, created_at, user:users(id, name, email, phone, avatar_url)')
    .eq('business_id', business.id)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ business, collaborators: data ?? [] });
}

export async function POST(request: Request) {
  const ctx = await resolveOwnerBusiness();
  if ('error' in ctx) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }
  const { service, business } = ctx;

  const body = (await request.json().catch(() => ({}))) as InviteBody;
  const rawEmail = (body.email ?? '').trim().toLowerCase();
  const role: Role = body.role === 'staff' ? 'staff' : 'manager';

  if (!rawEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
  }

  const { data: targetUser, error: userErr } = await service
    .from('users')
    .select('id, name, email')
    .eq('email', rawEmail)
    .maybeSingle();

  if (userErr) {
    return NextResponse.json({ error: userErr.message }, { status: 500 });
  }
  if (!targetUser) {
    return NextResponse.json(
      { error: 'user_not_found', detail: 'Ask them to sign up at bookourspot.com first.' },
      { status: 404 },
    );
  }

  if (targetUser.id === business.owner_id) {
    return NextResponse.json({ error: 'already_owner' }, { status: 409 });
  }

  const { data: inserted, error: insErr } = await service
    .from('business_collaborators')
    .upsert(
      { business_id: business.id, user_id: targetUser.id, role },
      { onConflict: 'business_id,user_id' },
    )
    .select('id, role, created_at, user:users(id, name, email, phone, avatar_url)')
    .single();

  if (insErr) {
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  return NextResponse.json({ collaborator: inserted }, { status: 201 });
}
