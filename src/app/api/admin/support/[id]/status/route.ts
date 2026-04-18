import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type Ctx = { params: Promise<{ id: string }> };
type Body = { status?: string };

const ALLOWED = new Set(['open', 'in_progress', 'resolved', 'closed']);

export async function POST(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: 'Missing id.' }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: me } = await supabase
    .from('users')
    .select('role')
    .eq('id', authUser.id)
    .maybeSingle();
  if (!me || !['admin', 'superadmin'].includes(me.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as Body;
  const status = body.status;
  if (!status || !ALLOWED.has(status)) {
    return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
  }

  const { error } = await supabase
    .from('support_queries')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
