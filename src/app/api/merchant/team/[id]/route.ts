import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getServiceSupabaseClient } from '@/lib/supabase/service';

type Role = 'manager' | 'staff';

type PatchBody = {
  role?: Role;
};

async function assertOwnerForCollaborator(collaboratorId: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return { error: 'unauthorized' as const, status: 401 };

  const service = getServiceSupabaseClient();
  const { data: row, error } = await service
    .from('business_collaborators')
    .select('id, business_id, business:businesses!inner(owner_id)')
    .eq('id', collaboratorId)
    .maybeSingle();

  if (error) return { error: error.message, status: 500 };
  if (!row) return { error: 'not_found' as const, status: 404 };

  const ownerId = Array.isArray(row.business)
    ? row.business[0]?.owner_id
    : (row.business as { owner_id: string } | null)?.owner_id;

  if (ownerId !== authUser.id) {
    return { error: 'forbidden' as const, status: 403 };
  }

  return { service, row };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await assertOwnerForCollaborator(id);
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const body = (await request.json().catch(() => ({}))) as PatchBody;
  if (body.role !== 'manager' && body.role !== 'staff') {
    return NextResponse.json({ error: 'invalid_role' }, { status: 400 });
  }

  const { data, error } = await ctx.service
    .from('business_collaborators')
    .update({ role: body.role, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, role, created_at, user:users(id, name, email, phone, avatar_url)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ collaborator: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await assertOwnerForCollaborator(id);
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const { error } = await ctx.service.from('business_collaborators').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
