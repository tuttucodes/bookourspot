-- ============================================
-- BookOurSpot - Supabase Database Schema
-- Phase 1: Booking & Scheduling Platform
-- ============================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================
-- 1. USERS TABLE (extends Supabase Auth)
-- ============================================
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  email text not null,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'merchant')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- 2. BUSINESSES TABLE
-- ============================================
create table public.businesses (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  description text,
  category text not null default 'salon' check (category in ('salon', 'barbershop', 'car_wash', 'spa', 'other')),
  location text,
  address text,
  phone text,
  image_url text,
  -- Working hours stored as JSON: { "monday": { "open": "09:00", "close": "18:00", "closed": false }, ... }
  working_hours jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- 3. SERVICES TABLE
-- ============================================
create table public.services (
  id uuid default uuid_generate_v4() primary key,
  business_id uuid references public.businesses(id) on delete cascade not null,
  name text not null,
  description text,
  price decimal(10,2) not null,
  duration_minutes integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- 4. APPOINTMENTS TABLE
-- ============================================
create table public.appointments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  business_id uuid references public.businesses(id) on delete cascade not null,
  service_id uuid references public.services(id) on delete set null,
  date date not null,
  start_time time not null,
  end_time time not null,
  status text not null default 'booked' check (status in ('booked', 'cancelled', 'completed')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- 5. TRANSACTIONS TABLE (basic cash tracking)
-- ============================================
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  appointment_id uuid references public.appointments(id) on delete cascade not null unique,
  amount decimal(10,2) not null,
  payment_method text not null default 'cash' check (payment_method in ('cash')),
  status text not null default 'pending' check (status in ('pending', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- INDEXES for performance
-- ============================================
create index idx_businesses_owner on public.businesses(owner_id);
create index idx_businesses_category on public.businesses(category);
create index idx_services_business on public.services(business_id);
create index idx_appointments_user on public.appointments(user_id);
create index idx_appointments_business on public.appointments(business_id);
create index idx_appointments_date on public.appointments(date);
create index idx_appointments_status on public.appointments(status);
-- Composite index for slot availability checks
create index idx_appointments_business_date_status on public.appointments(business_id, date, status);
create index idx_transactions_appointment on public.transactions(appointment_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

alter table public.users enable row level security;
alter table public.businesses enable row level security;
alter table public.services enable row level security;
alter table public.appointments enable row level security;
alter table public.transactions enable row level security;

-- Users: can read all profiles, update own
create policy "Users can view all profiles" on public.users for select using (true);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.users for insert with check (auth.uid() = id);

-- Businesses: public read, owner can manage
create policy "Anyone can view active businesses" on public.businesses for select using (is_active = true);
create policy "Owners can insert businesses" on public.businesses for insert with check (auth.uid() = owner_id);
create policy "Owners can update own businesses" on public.businesses for update using (auth.uid() = owner_id);
create policy "Owners can delete own businesses" on public.businesses for delete using (auth.uid() = owner_id);

-- Services: public read, business owner can manage
create policy "Anyone can view active services" on public.services for select using (is_active = true);
create policy "Business owners can insert services" on public.services for insert
  with check (exists (select 1 from public.businesses where id = business_id and owner_id = auth.uid()));
create policy "Business owners can update services" on public.services for update
  using (exists (select 1 from public.businesses where id = business_id and owner_id = auth.uid()));
create policy "Business owners can delete services" on public.services for delete
  using (exists (select 1 from public.businesses where id = business_id and owner_id = auth.uid()));

-- Appointments: users see own, merchants see their business appointments
create policy "Users can view own appointments" on public.appointments for select
  using (auth.uid() = user_id or exists (
    select 1 from public.businesses where id = business_id and owner_id = auth.uid()
  ));
create policy "Users can create appointments" on public.appointments for insert
  with check (auth.uid() = user_id);
create policy "Users can update own appointments" on public.appointments for update
  using (auth.uid() = user_id or exists (
    select 1 from public.businesses where id = business_id and owner_id = auth.uid()
  ));

-- Transactions: linked to appointment access
create policy "View transactions for own appointments" on public.transactions for select
  using (exists (
    select 1 from public.appointments a
    where a.id = appointment_id and (a.user_id = auth.uid() or exists (
      select 1 from public.businesses b where b.id = a.business_id and b.owner_id = auth.uid()
    ))
  ));
create policy "Create transactions for own business appointments" on public.transactions for insert
  with check (exists (
    select 1 from public.appointments a
    join public.businesses b on b.id = a.business_id
    where a.id = appointment_id and b.owner_id = auth.uid()
  ));
create policy "Update transactions for own business" on public.transactions for update
  using (exists (
    select 1 from public.appointments a
    join public.businesses b on b.id = a.business_id
    where a.id = appointment_id and b.owner_id = auth.uid()
  ));

-- ============================================
-- FUNCTION: Auto-create user profile on signup
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'customer')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- FUNCTION: Prevent double booking
-- Called before inserting an appointment to check for overlapping slots
-- ============================================
create or replace function public.check_appointment_overlap()
returns trigger as $$
begin
  if exists (
    select 1 from public.appointments
    where business_id = new.business_id
      and date = new.date
      and status = 'booked'
      and id != coalesce(new.id, uuid_generate_v4())
      and start_time < new.end_time
      and end_time > new.start_time
  ) then
    raise exception 'Time slot is already booked';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger check_booking_overlap
  before insert or update on public.appointments
  for each row execute function public.check_appointment_overlap();

-- ============================================
-- FUNCTION: Auto-create transaction on booking
-- ============================================
create or replace function public.create_transaction_on_booking()
returns trigger as $$
declare
  service_price decimal(10,2);
begin
  if new.status = 'booked' and new.service_id is not null then
    select price into service_price from public.services where id = new.service_id;
    insert into public.transactions (appointment_id, amount, status)
    values (new.id, coalesce(service_price, 0), 'pending')
    on conflict (appointment_id) do nothing;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_appointment_created
  after insert on public.appointments
  for each row execute function public.create_transaction_on_booking();

-- ============================================
-- Enable Realtime for appointments
-- ============================================
alter publication supabase_realtime add table public.appointments;
