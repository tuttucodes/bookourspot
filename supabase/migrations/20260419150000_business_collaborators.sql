-- Multi-user access to a business: owner + collaborators.
-- Owners keep every existing permission; collaborators are additive via new policies.

create table if not exists public.business_collaborators (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  role text not null default 'manager' check (role in ('manager', 'staff')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, user_id)
);

create index if not exists business_collaborators_business_idx
  on public.business_collaborators (business_id);

create index if not exists business_collaborators_user_idx
  on public.business_collaborators (user_id);

create trigger business_collaborators_set_updated_at
  before update on public.business_collaborators
  for each row execute function public.set_updated_at();

alter table public.business_collaborators enable row level security;

-- Helper: true when caller is the owner or a listed collaborator.
create or replace function public.has_business_access(biz_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1 from public.businesses b
      where b.id = biz_id and b.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.business_collaborators bc
      where bc.business_id = biz_id and bc.user_id = auth.uid()
    );
$$;

grant execute on function public.has_business_access(uuid) to authenticated;

-- RLS on the collaborators table itself.
create policy "business_collaborators_select"
  on public.business_collaborators for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.businesses b
      where b.id = business_collaborators.business_id and b.owner_id = auth.uid()
    )
  );

create policy "business_collaborators_insert_owner"
  on public.business_collaborators for insert
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = business_id and b.owner_id = auth.uid()
    )
  );

create policy "business_collaborators_update_owner"
  on public.business_collaborators for update
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_collaborators.business_id and b.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = business_collaborators.business_id and b.owner_id = auth.uid()
    )
  );

create policy "business_collaborators_delete_owner"
  on public.business_collaborators for delete
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_collaborators.business_id and b.owner_id = auth.uid()
    )
  );

-- Additive collaborator policies on existing merchant tables.
-- Permissive policies are OR'd, so owners are unaffected by these additions.

create policy "businesses_select_collaborator"
  on public.businesses for select
  using (
    exists (
      select 1 from public.business_collaborators bc
      where bc.business_id = businesses.id and bc.user_id = auth.uid()
    )
  );

create policy "businesses_update_collaborator_manager"
  on public.businesses for update
  using (
    exists (
      select 1 from public.business_collaborators bc
      where bc.business_id = businesses.id
        and bc.user_id = auth.uid()
        and bc.role = 'manager'
    )
  )
  with check (
    exists (
      select 1 from public.business_collaborators bc
      where bc.business_id = businesses.id
        and bc.user_id = auth.uid()
        and bc.role = 'manager'
    )
  );

create policy "services_select_collaborator"
  on public.services for select
  using (public.has_business_access(services.business_id));

create policy "services_insert_collaborator"
  on public.services for insert
  with check (public.has_business_access(business_id));

create policy "services_update_collaborator"
  on public.services for update
  using (public.has_business_access(services.business_id));

create policy "services_delete_collaborator"
  on public.services for delete
  using (public.has_business_access(services.business_id));

create policy "appointments_select_collaborator"
  on public.appointments for select
  using (public.has_business_access(appointments.business_id));

create policy "appointments_update_collaborator"
  on public.appointments for update
  using (public.has_business_access(appointments.business_id))
  with check (public.has_business_access(appointments.business_id));

create policy "transactions_select_collaborator"
  on public.transactions for select
  using (
    exists (
      select 1 from public.appointments a
      where a.id = transactions.appointment_id
        and public.has_business_access(a.business_id)
    )
  );

create policy "transactions_insert_collaborator"
  on public.transactions for insert
  with check (
    exists (
      select 1 from public.appointments a
      where a.id = appointment_id
        and public.has_business_access(a.business_id)
    )
  );

create policy "transactions_update_collaborator"
  on public.transactions for update
  using (
    exists (
      select 1 from public.appointments a
      where a.id = transactions.appointment_id
        and public.has_business_access(a.business_id)
    )
  );

create policy "business_staff_select_collaborator"
  on public.business_staff for select
  using (public.has_business_access(business_staff.business_id));

create policy "business_staff_insert_collaborator"
  on public.business_staff for insert
  with check (public.has_business_access(business_id));

create policy "business_staff_update_collaborator"
  on public.business_staff for update
  using (public.has_business_access(business_staff.business_id));

create policy "business_staff_delete_collaborator"
  on public.business_staff for delete
  using (public.has_business_access(business_staff.business_id));

-- Customer records surface to collaborators the same way they do to owners.
create policy "users_select_for_collaborator_appointments"
  on public.users for select
  using (
    exists (
      select 1
      from public.appointments a
      where a.user_id = users.id
        and public.has_business_access(a.business_id)
    )
  );

-- Seed: grant rahul + eshan to SK Barbershop as managers.
-- Idempotent: no-op if business or users are missing.
do $$
declare
  biz_id uuid;
  eshan_id uuid;
  rahul_id uuid;
begin
  select id into biz_id
  from public.businesses
  where slug = 'sk-barbershop'
     or slug = 'skbarbershop'
     or name ilike 'SK Barbershop'
  order by created_at
  limit 1;

  if biz_id is null then
    raise notice 'business_collaborators seed: SK Barbershop not found, skipping';
    return;
  end if;

  select id into rahul_id
  from public.users
  where email = 'rahulbabuk05@gmail.com'
  limit 1;

  select id into eshan_id
  from public.users
  where email ilike 'eshan%'
  order by created_at
  limit 1;

  if rahul_id is not null then
    insert into public.business_collaborators (business_id, user_id, role)
    values (biz_id, rahul_id, 'manager')
    on conflict (business_id, user_id) do update
      set role = excluded.role,
          updated_at = now();
  else
    raise notice 'business_collaborators seed: rahul user not found';
  end if;

  if eshan_id is not null then
    insert into public.business_collaborators (business_id, user_id, role)
    values (biz_id, eshan_id, 'manager')
    on conflict (business_id, user_id) do update
      set role = excluded.role,
          updated_at = now();
  else
    raise notice 'business_collaborators seed: eshan user not found (signup required first)';
  end if;
end $$;
