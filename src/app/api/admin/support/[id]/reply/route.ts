import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type Ctx = { params: Promise<{ id: string }> };
type Body = { body?: string };

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
  const role = me?.role ?? '';
  if (!['admin', 'superadmin'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as Body;
  const text = body.body?.trim();
  if (!text || text.length < 2) {
    return NextResponse.json({ error: 'Message body required.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('support_query_messages')
    .insert({
      query_id: id,
      author_id: authUser.id,
      author_role: 'admin',
      body: text.slice(0, 4000),
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Bump query status from 'open' -> 'in_progress' on first admin reply
  await supabase
    .from('support_queries')
    .update({
      status: 'in_progress',
      assignee_id: authUser.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('status', 'open');

  return NextResponse.json({ data });
}
