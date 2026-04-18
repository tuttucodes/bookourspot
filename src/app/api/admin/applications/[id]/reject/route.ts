import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type Ctx = { params: Promise<{ id: string }> };
type Body = { reason?: string };

export async function POST(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: 'Missing id.' }, { status: 400 });

  const body = (await request.json().catch(() => ({}))) as Body;
  const reason = body.reason?.trim();
  if (!reason || reason.length < 10) {
    return NextResponse.json(
      { error: 'Rejection reason required (min 10 chars).' },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase.rpc('reject_merchant_application', {
    p_application_id: id,
    p_reason: reason.slice(0, 1000),
  });

  if (error) {
    const msg = error.message || 'Reject failed';
    const status = msg.includes('forbidden') ? 403 : msg.includes('not_found') ? 404 : 400;
    return NextResponse.json({ error: msg }, { status });
  }

  return NextResponse.json({ data });
}
