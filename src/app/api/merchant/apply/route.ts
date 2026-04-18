import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getServiceSupabaseClient } from '@/lib/supabase/service';

type Body = {
  owner_name?: string;
  owner_id_type?: 'nric' | 'passport';
  owner_id_number?: string;
  owner_phone?: string;
  country?: string;
  business_legal_name?: string;
  business_trading_name?: string;
  business_type?: 'sole_prop' | 'sdn_bhd' | 'llp' | 'other';
  primary_reg_number?: string;
  category?: 'salon' | 'barbershop' | 'car_wash' | 'spa' | 'other';
  address?: string;
  city?: string;
  state?: string;
  postcode?: string;
  sst_number?: string;
  council_licence_authority?: string;
  council_licence_number?: string;
  council_licence_expiry?: string;
};

function required(value: string | undefined | null, field: string): string {
  if (!value || !value.trim()) throw new Error(`missing_field:${field}`);
  return value.trim();
}

function hashIdNumber(idNumber: string): string {
  const pepper = process.env.OTP_PEPPER ?? '';
  return createHash('sha256').update(`${idNumber.toUpperCase()}:${pepper}`).digest('hex');
}

/**
 * POST /api/merchant/apply
 *
 * Authenticated user submits a merchant application. Flow:
 *  1. Validate + normalize fields.
 *  2. Insert into merchant_applications (status = submitted).
 *  3. Flip the user role to 'pending_merchant' so the auth cookie reflects
 *     their application status (can access /pending instead of /dashboard).
 *
 * Requires: an existing authenticated session. Callers who aren't signed in
 * should first sign up via /signup?role=merchant (Google OAuth or email).
 */
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Body;

  let owner_name: string;
  let owner_id_type: 'nric' | 'passport';
  let owner_id_number: string;
  let owner_phone: string;
  let business_legal_name: string;
  let business_type: string;
  let primary_reg_number: string;
  let category: string;
  let address: string;

  try {
    owner_name = required(body.owner_name, 'owner_name').slice(0, 200);
    if (body.owner_id_type !== 'nric' && body.owner_id_type !== 'passport') {
      throw new Error('missing_field:owner_id_type');
    }
    owner_id_type = body.owner_id_type;
    owner_id_number = required(body.owner_id_number, 'owner_id_number').toUpperCase();
    owner_phone = required(body.owner_phone, 'owner_phone');
    business_legal_name = required(body.business_legal_name, 'business_legal_name').slice(0, 200);
    if (!body.business_type || !['sole_prop', 'sdn_bhd', 'llp', 'other'].includes(body.business_type)) {
      throw new Error('missing_field:business_type');
    }
    business_type = body.business_type;
    primary_reg_number = required(body.primary_reg_number, 'primary_reg_number').toUpperCase();
    if (!body.category || !['salon', 'barbershop', 'car_wash', 'spa', 'other'].includes(body.category)) {
      throw new Error('missing_field:category');
    }
    category = body.category;
    address = required(body.address, 'address').slice(0, 500);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Invalid body';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const country = (body.country ?? 'MY').slice(0, 2).toUpperCase();
  const owner_id_last4 = owner_id_number.slice(-4);
  const owner_id_hash = hashIdNumber(owner_id_number);

  // Block duplicate pending applications by the same user.
  const { data: existingPending } = await supabase
    .from('merchant_applications')
    .select('id')
    .eq('user_id', authUser.id)
    .in('status', ['submitted', 'under_review'])
    .maybeSingle();
  if (existingPending) {
    return NextResponse.json(
      { error: 'pending_application_exists', application_id: existingPending.id },
      { status: 409 }
    );
  }

  // Block duplicate reg numbers across the platform.
  const svc = getServiceSupabaseClient();
  const { data: dup } = await svc
    .from('merchant_applications')
    .select('id')
    .eq('country', country)
    .eq('primary_reg_number', primary_reg_number)
    .in('status', ['submitted', 'under_review', 'approved'])
    .maybeSingle();
  if (dup) {
    return NextResponse.json(
      { error: 'duplicate_reg_number', details: 'This registration number is already on file.' },
      { status: 409 }
    );
  }

  const { data: inserted, error: insertErr } = await supabase
    .from('merchant_applications')
    .insert({
      user_id: authUser.id,
      owner_name,
      owner_id_type,
      owner_id_last4,
      owner_id_hash,
      owner_phone,
      country,
      business_legal_name,
      business_trading_name: body.business_trading_name?.slice(0, 200) ?? null,
      business_type,
      primary_reg_number,
      category,
      address,
      city: body.city?.slice(0, 100) ?? null,
      state: body.state?.slice(0, 100) ?? null,
      postcode: body.postcode?.slice(0, 20) ?? null,
      sst_number: body.sst_number?.slice(0, 100) ?? null,
      council_licence_authority: body.council_licence_authority?.slice(0, 100) ?? null,
      council_licence_number: body.council_licence_number?.slice(0, 100) ?? null,
      council_licence_expiry: body.council_licence_expiry || null,
      registration_details: {},
      status: 'submitted',
    })
    .select('id')
    .single();

  if (insertErr || !inserted) {
    return NextResponse.json(
      { error: insertErr?.message || 'insert_failed' },
      { status: 400 }
    );
  }

  // Flip role to pending_merchant (service role writes auth metadata too).
  await svc
    .from('users')
    .update({ role: 'pending_merchant', updated_at: new Date().toISOString() })
    .eq('id', authUser.id);

  return NextResponse.json({ data: { application_id: inserted.id } });
}
