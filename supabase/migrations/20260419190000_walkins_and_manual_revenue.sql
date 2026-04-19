-- Support walk-in appointments (no customer account) and ad-hoc manual revenue
-- entries that do not tie to an appointment (e.g. product sale, tip jar, cash-in).

-- ---------------------------------------------------------------------------
-- appointments: allow null user + record walk-in identity
-- ---------------------------------------------------------------------------
alter table public.appointments
  alter column user_id drop not null;

alter table public.appointments
  add column if not exists walkin_name text,
  add column if not exists walkin_phone text,
  add column if not exists source text;

update public.appointments
set source = 'online'
where source is null;

alter table public.appointments
  alter column source set not null,
  alter column source set default 'online';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'appointments_source_check'
  ) then
    alter table public.appointments
      add constraint appointments_source_check
      check (source in ('online', 'walkin', 'manual'));
  end if;
end $$;

-- If user_id is null, walk-in metadata must exist.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'appointments_walkin_requires_name'
  ) then
    alter table public.appointments
      add constraint appointments_walkin_requires_name
      check (user_id is not null or walkin_name is not null);
  end if;
end $$;

create index if not exists appointments_source_idx on public.appointments (source);

-- ---------------------------------------------------------------------------
-- transactions: allow null appointment (manual revenue) keyed by business
-- ---------------------------------------------------------------------------
alter table public.transactions
  alter column appointment_id drop not null;

alter table public.transactions
  add column if not exists business_id uuid references public.businesses (id) on delete cascade,
  add column if not exists description text,
  add column if not exists category text,
  add column if not exists entry_type text;

-- Backfill business_id for legacy rows that only carry appointment_id.
update public.transactions t
set business_id = a.business_id
from public.appointments a
where t.appointment_id = a.id
  and t.business_id is null;

update public.transactions set entry_type = 'appointment' where entry_type is null;

alter table public.transactions
  alter column entry_type set not null,
  alter column entry_type set default 'appointment';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'transactions_entry_type_check'
  ) then
    alter table public.transactions
      add constraint transactions_entry_type_check
      check (entry_type in ('appointment', 'manual'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'transactions_scope_check'
  ) then
    alter table public.transactions
      add constraint transactions_scope_check
      check (
        (entry_type = 'appointment' and appointment_id is not null)
        or (entry_type = 'manual' and business_id is not null)
      );
  end if;
end $$;

create index if not exists transactions_business_id_idx on public.transactions (business_id);
create index if not exists transactions_entry_type_idx on public.transactions (entry_type);

-- ---------------------------------------------------------------------------
-- RLS additions
-- ---------------------------------------------------------------------------

-- Walk-in appointments: merchant owner or collaborator can create rows where
-- user_id is null.
create policy "appointments_insert_walkin"
  on public.appointments for insert
  with check (
    user_id is null
    and source = 'walkin'
    and public.has_business_access(business_id)
  );

-- Manual revenue rows live in transactions without an appointment; select +
-- mutate rights follow standard owner/collaborator access via business_id.
create policy "transactions_select_manual_owner"
  on public.transactions for select
  using (
    appointment_id is null
    and business_id is not null
    and exists (
      select 1 from public.businesses b
      where b.id = transactions.business_id and b.owner_id = auth.uid()
    )
  );

create policy "transactions_select_manual_collaborator"
  on public.transactions for select
  using (
    appointment_id is null
    and business_id is not null
    and public.has_business_access(transactions.business_id)
  );

create policy "transactions_insert_manual"
  on public.transactions for insert
  with check (
    entry_type = 'manual'
    and appointment_id is null
    and business_id is not null
    and public.has_business_access(business_id)
  );

create policy "transactions_update_manual"
  on public.transactions for update
  using (
    entry_type = 'manual'
    and business_id is not null
    and public.has_business_access(transactions.business_id)
  )
  with check (
    entry_type = 'manual'
    and business_id is not null
    and public.has_business_access(transactions.business_id)
  );

create policy "transactions_delete_manual"
  on public.transactions for delete
  using (
    entry_type = 'manual'
    and business_id is not null
    and public.has_business_access(transactions.business_id)
  );
