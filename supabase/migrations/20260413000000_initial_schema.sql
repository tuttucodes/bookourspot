-- BookOurSpot: core schema, RLS, and auth profile sync
-- Apply in Supabase: SQL Editor (full script) or `supabase db push` if using Supabase CLI.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  role text not null check (role in ('customer', 'merchant')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  description text,
  category text not null check (category in ('salon', 'barbershop', 'car_wash', 'spa', 'other')),
  location text,
  address text,
  phone text,
  image_url text,
  working_hours jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index businesses_owner_id_idx on public.businesses (owner_id);
create index businesses_category_idx on public.businesses (category);
create index businesses_active_idx on public.businesses (is_active) where is_active = true;

create table public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  description text,
  price numeric(12, 2) not null check (price >= 0),
  duration_minutes integer not null check (duration_minutes > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index services_business_id_idx on public.services (business_id);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  service_id uuid references public.services (id) on delete set null,
  date date not null,
  start_time text not null,
  end_time text not null,
  status text not null check (status in ('booked', 'cancelled', 'completed')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index appointments_user_id_idx on public.appointments (user_id);
create index appointments_business_id_idx on public.appointments (business_id);
create index appointments_date_idx on public.appointments (date);
create index appointments_business_date_idx on public.appointments (business_id, date);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  amount numeric(12, 2) not null check (amount >= 0),
  payment_method text not null default 'cash' check (payment_method = 'cash'),
  status text not null check (status in ('pending', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transactions_appointment_id_key unique (appointment_id)
);

create index transactions_appointment_id_idx on public.transactions (appointment_id);

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

create trigger businesses_set_updated_at
  before update on public.businesses
  for each row execute function public.set_updated_at();

create trigger services_set_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

create trigger appointments_set_updated_at
  before update on public.appointments
  for each row execute function public.set_updated_at();

create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auth: mirror auth.users -> public.users
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r text;
begin
  r := coalesce(new.raw_user_meta_data->>'role', 'customer');
  if r not in ('customer', 'merchant') then
    r := 'customer';
  end if;

  insert into public.users (id, email, name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'name'), ''),
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      split_part(coalesce(new.email, 'user'), '@', 1)
    ),
    r
  )
  on conflict (id) do update set
    email = excluded.email,
    name = coalesce(nullif(trim(public.users.name), ''), excluded.name),
    updated_at = now();

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep email in sync when auth email changes
create or replace function public.handle_auth_user_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    update public.users set email = coalesce(new.email, ''), updated_at = now() where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_updated
  after update of email on auth.users
  for each row execute function public.handle_auth_user_updated();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.businesses enable row level security;
alter table public.services enable row level security;
alter table public.appointments enable row level security;
alter table public.transactions enable row level security;

-- users
create policy "users_select_own"
  on public.users for select
  using (auth.uid() = id);

create policy "users_select_for_merchant_appointments"
  on public.users for select
  using (
    exists (
      select 1
      from public.appointments a
      join public.businesses b on b.id = a.business_id
      where a.user_id = users.id
        and b.owner_id = auth.uid()
    )
  );

create policy "users_update_own"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- businesses
create policy "businesses_select_public_or_owner"
  on public.businesses for select
  using (is_active = true or owner_id = auth.uid());

create policy "businesses_insert_owner"
  on public.businesses for insert
  with check (owner_id = auth.uid());

create policy "businesses_update_owner"
  on public.businesses for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "businesses_delete_owner"
  on public.businesses for delete
  using (owner_id = auth.uid());

-- services
create policy "services_select"
  on public.services for select
  using (
    exists (
      select 1 from public.businesses b
      where b.id = services.business_id
        and (b.owner_id = auth.uid() or (b.is_active = true and services.is_active = true))
    )
  );

create policy "services_insert_owner"
  on public.services for insert
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = business_id and b.owner_id = auth.uid()
    )
  );

create policy "services_update_owner"
  on public.services for update
  using (
    exists (
      select 1 from public.businesses b
      where b.id = services.business_id and b.owner_id = auth.uid()
    )
  );

create policy "services_delete_owner"
  on public.services for delete
  using (
    exists (
      select 1 from public.businesses b
      where b.id = services.business_id and b.owner_id = auth.uid()
    )
  );

-- appointments
create policy "appointments_select"
  on public.appointments for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.businesses b
      where b.id = appointments.business_id and b.owner_id = auth.uid()
    )
  );

create policy "appointments_insert"
  on public.appointments for insert
  with check (
    user_id = auth.uid()
    and service_id is not null
    and exists (
      select 1 from public.services s
      where s.id = service_id
        and s.business_id = appointments.business_id
        and s.is_active = true
    )
    and (
      exists (
        select 1 from public.businesses b
        where b.id = business_id and b.is_active = true
      )
      or exists (
        select 1 from public.businesses b
        where b.id = business_id and b.owner_id = auth.uid()
      )
    )
  );

create policy "appointments_update"
  on public.appointments for update
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.businesses b
      where b.id = appointments.business_id and b.owner_id = auth.uid()
    )
  );

-- transactions
create policy "transactions_select"
  on public.transactions for select
  using (
    exists (
      select 1 from public.appointments a
      where a.id = appointment_id
        and (
          a.user_id = auth.uid()
          or exists (
            select 1 from public.businesses b
            where b.id = a.business_id and b.owner_id = auth.uid()
          )
        )
    )
  );

create policy "transactions_insert"
  on public.transactions for insert
  with check (
    exists (
      select 1 from public.appointments a
      where a.id = appointment_id
        and (
          a.user_id = auth.uid()
          or exists (
            select 1 from public.businesses b
            where b.id = a.business_id and b.owner_id = auth.uid()
          )
        )
    )
  );

create policy "transactions_update_merchant"
  on public.transactions for update
  using (
    exists (
      select 1 from public.appointments a
      join public.businesses b on b.id = a.business_id
      where a.id = appointment_id and b.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Backfill public.users for Auth accounts created before this migration
-- ---------------------------------------------------------------------------
insert into public.users (id, email, name, role)
select
  u.id,
  coalesce(u.email, ''),
  coalesce(
    nullif(trim(u.raw_user_meta_data->>'name'), ''),
    nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
    split_part(coalesce(u.email, 'user'), '@', 1)
  ),
  case
    when coalesce(u.raw_user_meta_data->>'role', 'customer') in ('merchant', 'customer')
      then (u.raw_user_meta_data->>'role')::text
    else 'customer'
  end
from auth.users u
where not exists (select 1 from public.users p where p.id = u.id)
on conflict (id) do nothing;
