import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type LineItemInput = {
  service_id?: string | null;
  name: string;
  price: number;
  quantity?: number;
};

type CheckoutBody = {
  line_items: LineItemInput[];
  tax_amount?: number;
  discount_amount?: number;
  tip_amount?: number;
  payment_method: 'cash' | 'card' | 'qr_ewallet' | 'bank_transfer' | 'other';
  notes?: string;
};

type Ctx = {
  params: Promise<{ id: string }>;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function POST(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: 'Missing id.' }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as CheckoutBody | null;
  if (!body || !Array.isArray(body.line_items) || body.line_items.length === 0) {
    return NextResponse.json({ error: 'line_items required.' }, { status: 400 });
  }
  if (!body.payment_method) {
    return NextResponse.json({ error: 'payment_method required.' }, { status: 400 });
  }

  // Normalize line items and compute subtotal server-side (never trust client math).
  const normalized = body.line_items.map((raw) => {
    const quantity = Number.isFinite(raw.quantity) ? Math.max(1, Math.floor(raw.quantity!)) : 1;
    const price = Number(raw.price ?? 0);
    if (!raw.name || !Number.isFinite(price) || price < 0) {
      throw new Error(`Invalid line item: ${JSON.stringify(raw)}`);
    }
    return {
      service_id: raw.service_id ?? null,
      name: raw.name.slice(0, 200),
      price: round2(price),
      quantity,
      line_total: round2(price * quantity),
    };
  });

  const subtotal = round2(normalized.reduce((acc, li) => acc + li.line_total, 0));
  const tax = round2(Math.max(0, Number(body.tax_amount ?? 0)));
  const discount = round2(Math.max(0, Number(body.discount_amount ?? 0)));
  const tip = round2(Math.max(0, Number(body.tip_amount ?? 0)));
  const total = round2(subtotal - discount + tax + tip);
  if (total < 0) {
    return NextResponse.json({ error: 'Total cannot be negative.' }, { status: 400 });
  }

  const { data, error } = await supabase.rpc('checkout_appointment', {
    p_appointment_id: id,
    p_line_items: normalized,
    p_subtotal: subtotal,
    p_tax: tax,
    p_discount: discount,
    p_tip: tip,
    p_total: total,
    p_payment_method: body.payment_method,
    p_notes: body.notes ? body.notes.slice(0, 1000) : null,
  });

  if (error) {
    const msg = error.message || 'Checkout failed.';
    const status = msg.includes('forbidden') ? 403 : msg.includes('not_found') ? 404 : 400;
    return NextResponse.json({ error: msg }, { status });
  }

  return NextResponse.json({ data });
}
