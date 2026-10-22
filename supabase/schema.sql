-- Supabase Database Schema for BookOurSpot (bookourspot.com)
-- Run this in the Supabase SQL Editor: https://supabase.com/dashboard/project/zthpbzpevdvnbxmmlxay/sql

-- 1. Create passes table
create table if not exists public.passes (
  id text primary key,
  guest_name text not null,
  guest_phone text not null,
  booker_name text not null,
  phone text not null,
  instagram text,
  tier_name text not null,
  tier_type text not null,
  price integer not null,
  utr text not null,
  status text not null default 'LOGGED_PENDING_AUDIT',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  admitted_at timestamp with time zone
);

-- 2. Enable Row Level Security (RLS)
alter table public.passes enable row level security;

-- 3. Create security policies for public gate checkout & host door hub
drop policy if exists "Allow anonymous insert on passes" on public.passes;
create policy "Allow anonymous insert on passes" 
  on public.passes 
  for insert 
  with check (true);

drop policy if exists "Allow anonymous select on passes" on public.passes;
create policy "Allow anonymous select on passes" 
  on public.passes 
  for select 
  using (true);

drop policy if exists "Allow anonymous update on passes" on public.passes;
create policy "Allow anonymous update on passes" 
  on public.passes 
  for update 
  using (true);

-- 4. Create index for fast door search on gate terminal
create index if not exists idx_passes_utr on public.passes (utr);
create index if not exists idx_passes_phone on public.passes (phone);
create index if not exists idx_passes_guest_phone on public.passes (guest_phone);
create index if not exists idx_passes_guest_name on public.passes (guest_name);
