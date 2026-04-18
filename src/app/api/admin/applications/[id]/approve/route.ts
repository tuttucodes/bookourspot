import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: 'Missing id.' }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase.rpc('approve_merchant_application', {
    p_application_id: id,
  });

  if (error) {
    const msg = error.message || 'Approve failed';
    const status = msg.includes('forbidden') ? 403 : msg.includes('not_found') ? 404 : 400;
    return NextResponse.json({ error: msg }, { status });
  }

  return NextResponse.json({ data });
}
