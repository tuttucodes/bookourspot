import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type RevenueBody = {
  amount?: number;
  description?: string;
  category?: string;
  payment_method?: 'cash' | 'card' | 'qr_ewallet' | 'bank_transfer' | 'other';
  paid_at?: string;
  notes?: string;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as RevenueBody;
  const amount = round2(Number(body.amount ?? 0));
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'amount_required' }, { status: 400 });
  }

  const allowedMethods = ['cash', 'card', 'qr_ewallet', 'bank_transfer', 'other'];
  const method = allowedMethods.includes(body.payment_method ?? '')
    ? (body.payment_method as string)
    : 'cash';

  const description = (body.description ?? '').trim().slice(0, 200);
  const category = (body.category ?? '').trim().slice(0, 60) || null;
  const paidAt = body.paid_at ? new Date(body.paid_at) : new Date();
  if (Number.isNaN(paidAt.getTime())) {
    return NextResponse.json({ error: 'invalid_paid_at' }, { status: 400 });
  }

  const { data: biz, error: bizErr } = await supabase
    .from('businesses')
    .select('id')
    .limit(1)
    .maybeSingle();
  if (bizErr) return NextResponse.json({ error: bizErr.message }, { status: 500 });
  if (!biz) return NextResponse.json({ error: 'no_business' }, { status: 404 });

  const payload = {
    appointment_id: null,
    business_id: biz.id,
    entry_type: 'manual',
    amount,
    payment_method: method,
    status: 'completed',
    description: description || null,
    category,
    paid_at: paidAt.toISOString(),
    notes: body.notes ? body.notes.slice(0, 1000) : null,
  };

  const { data: tx, error: insErr } = await supabase
    .from('transactions')
    .insert(payload)
    .select('id, amount, payment_method, status, paid_at, description, category')
    .single();

  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
  return NextResponse.json({ transaction: tx }, { status: 201 });
}
