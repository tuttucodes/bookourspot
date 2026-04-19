import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type WalkinBody = {
  service_id?: string;
  walkin_name?: string;
  walkin_phone?: string;
  duration_minutes?: number;
};

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function toTimeString(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as WalkinBody;
  const name = (body.walkin_name ?? '').trim();
  if (!name) return NextResponse.json({ error: 'walkin_name required' }, { status: 400 });

  // Resolve the caller's business via RLS (owner or collaborator).
  const { data: biz, error: bizErr } = await supabase
    .from('businesses')
    .select('id')
    .limit(1)
    .maybeSingle();
  if (bizErr) return NextResponse.json({ error: bizErr.message }, { status: 500 });
  if (!biz) return NextResponse.json({ error: 'no_business' }, { status: 404 });

  let serviceDuration = Math.max(5, Math.min(360, Number(body.duration_minutes) || 0));
  let serviceId: string | null = body.service_id ?? null;

  if (serviceId) {
    const { data: svc, error: svcErr } = await supabase
      .from('services')
      .select('id, duration_minutes, business_id, is_active')
      .eq('id', serviceId)
      .eq('business_id', biz.id)
      .maybeSingle();
    if (svcErr) return NextResponse.json({ error: svcErr.message }, { status: 500 });
    if (!svc || !svc.is_active) {
      return NextResponse.json({ error: 'invalid_service' }, { status: 400 });
    }
    if (!serviceDuration) serviceDuration = svc.duration_minutes;
  }
  if (!serviceDuration) serviceDuration = 30;

  const now = new Date();
  const end = new Date(now.getTime() + serviceDuration * 60_000);
  const todayIso = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    .toISOString()
    .split('T')[0];

  const { data: inserted, error: insErr } = await supabase
    .from('appointments')
    .insert({
      business_id: biz.id,
      service_id: serviceId,
      user_id: null,
      walkin_name: name.slice(0, 200),
      walkin_phone: body.walkin_phone ? body.walkin_phone.slice(0, 32) : null,
      source: 'walkin',
      date: todayIso,
      start_time: toTimeString(now),
      end_time: toTimeString(end),
      status: 'booked',
      notes: null,
    })
    .select('id')
    .single();

  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
  return NextResponse.json({ appointment: inserted }, { status: 201 });
}
