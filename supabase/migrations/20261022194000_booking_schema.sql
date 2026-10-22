-- BookOutSpot paid bookings and server-issued tickets.
-- Apply in the Supabase SQL Editor before enabling checkout.
-- Browser roles intentionally have no access. Vercel API routes authenticate
-- Firebase ID tokens, then use the server-only Supabase service role.

create table if not exists public.bookings (
  id uuid primary key,
  user_id text not null,
  event_id text not null check (event_id = 'halloween-affair'),
  tier_type text not null check (tier_type in ('SOLO', 'DUO')),
  quantity smallint not null check (quantity between 1 and 5),
  total_amount integer not null check (total_amount between 150000 and 1400000),
  status text not null default 'PENDING' check (status in ('PENDING', 'PAID', 'CANCELLED')),
  gateway_order_id text unique,
  gateway_payment_id text unique,
  gateway_utr text unique,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  constraint bookings_amount_matches_quantity check (
    (tier_type = 'SOLO' and total_amount = quantity * 150000)
    or (tier_type = 'DUO' and total_amount = quantity * 280000)
  ),
  constraint bookings_payment_state check (
    (status = 'PENDING' and gateway_payment_id is null and paid_at is null)
    or (status = 'PAID' and gateway_order_id is not null and gateway_payment_id is not null and paid_at is not null)
    or (status = 'CANCELLED' and gateway_payment_id is null and paid_at is null)
  )
);

-- Preserve existing bookings when upgrading the original Razorpay-named columns.
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'bookings' and column_name = 'razorpay_order_id')
     and not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'bookings' and column_name = 'gateway_order_id') then
    alter table public.bookings rename column razorpay_order_id to gateway_order_id;
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'bookings' and column_name = 'razorpay_payment_id')
     and not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'bookings' and column_name = 'gateway_payment_id') then
    alter table public.bookings rename column razorpay_payment_id to gateway_payment_id;
  end if;
end;
$$;

-- Keep the bank reference that was verified by the signed gateway webhook.
alter table public.bookings add column if not exists gateway_utr text unique;
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.bookings'::regclass and conname = 'bookings_gateway_utr_format'
  ) then
    alter table public.bookings add constraint bookings_gateway_utr_format
      check (gateway_utr is null or gateway_utr ~ '^[0-9]{12}$');
  end if;
end;
$$;

-- Upgrade databases where the earlier solo-only schema was already applied.
alter table public.bookings drop constraint if exists bookings_tier_type_check;
alter table public.bookings drop constraint if exists bookings_total_amount_check;
alter table public.bookings drop constraint if exists bookings_amount_matches_quantity;
alter table public.bookings drop constraint if exists bookings_amount_matches_quantity_check;
alter table public.bookings add constraint bookings_tier_type_check check (tier_type in ('SOLO', 'DUO'));
alter table public.bookings add constraint bookings_total_amount_check check (total_amount between 150000 and 1400000);
alter table public.bookings add constraint bookings_amount_matches_quantity_check check (
  (tier_type = 'SOLO' and total_amount = quantity * 150000)
  or (tier_type = 'DUO' and total_amount = quantity * 280000)
);

create table if not exists public.booking_tickets (
  id text primary key,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  guest_name text not null check (length(trim(guest_name)) between 1 and 80),
  guest_phone text not null check (guest_phone ~ '^[+][1-9][0-9]{7,14}$'),
  ticket_number smallint not null check (ticket_number between 1 and 10),
  status text not null default 'PENDING' check (status in ('PENDING', 'VALID')),
  issued_at timestamptz,
  unique (booking_id, ticket_number),
  constraint booking_ticket_issue_state check (
    (status = 'PENDING' and issued_at is null) or (status = 'VALID' and issued_at is not null)
  )
);

alter table public.booking_tickets drop constraint if exists booking_tickets_ticket_number_check;
alter table public.booking_tickets add constraint booking_tickets_ticket_number_check check (ticket_number between 1 and 10);

-- Firebase UIDs are opaque strings, not Supabase Auth UUIDs. This also migrates
-- rows created under the earlier Supabase Auth schema without discarding them.
do $$
declare
  fk record;
begin
  for fk in
    select conname
    from pg_constraint
    where conrelid = 'public.bookings'::regclass
      and contype = 'f'
      and confrelid = 'auth.users'::regclass
  loop
    execute format('alter table public.bookings drop constraint %I', fk.conname);
  end loop;
end;
$$;

alter table public.bookings
  alter column user_id type text using user_id::text;

-- Remove the prior UUID overloads so PostgREST does not see ambiguous RPCs.
drop function if exists public.bos_create_pending_booking(uuid, uuid, text, text, integer, integer, jsonb);
drop function if exists public.bos_attach_order(uuid, uuid, text);
drop function if exists public.bos_cancel_pending_booking(uuid, uuid);
drop function if exists public.bos_fulfill_booking(uuid, uuid, text, text, integer);
drop function if exists public.bos_fulfill_booking(uuid, text, text, text, integer);

create index if not exists bookings_user_created_idx on public.bookings (user_id, created_at desc);
create index if not exists booking_tickets_booking_idx on public.booking_tickets (booking_id, ticket_number);

alter table public.bookings enable row level security;
alter table public.booking_tickets enable row level security;
revoke all privileges on table public.bookings, public.booking_tickets from anon, authenticated;
grant select, insert, update, delete on table public.bookings, public.booking_tickets to service_role;

-- Keep existing demo pass data inaccessible to browser roles.
do $$
begin
  if to_regclass('public.passes') is not null then
    execute 'alter table public.passes enable row level security';
    execute 'drop policy if exists "Allow anonymous insert on passes" on public.passes';
    execute 'drop policy if exists "Allow anonymous select on passes" on public.passes';
    execute 'drop policy if exists "Allow anonymous update on passes" on public.passes';
    execute 'revoke all privileges on table public.passes from anon, authenticated';
  end if;
end;
$$;

-- These invoker functions can only be called by the server's service role.
create or replace function public.bos_create_pending_booking(
  p_booking_id uuid,
  p_user_id text,
  p_event_id text,
  p_tier_type text,
  p_quantity integer,
  p_total_amount integer,
  p_attendees jsonb
) returns uuid
language plpgsql
set search_path = ''
as $$
declare
  attendee jsonb;
  ticket_index integer := 0;
  guest_name_value text;
  guest_phone_value text;
begin
  if p_user_id is null or p_event_id is distinct from 'halloween-affair' or p_tier_type not in ('SOLO', 'DUO')
     or p_quantity is null or p_quantity not between 1 and 5
     or p_total_amount is null or p_total_amount <> p_quantity * (case when p_tier_type = 'DUO' then 280000 else 150000 end)
     or p_attendees is null or coalesce(jsonb_typeof(p_attendees), '') <> 'array'
     or (case when jsonb_typeof(p_attendees) = 'array'
              then jsonb_array_length(p_attendees) <> p_quantity * (case when p_tier_type = 'DUO' then 2 else 1 end)
              else true end) then
    raise exception 'Invalid booking details';
  end if;

  insert into public.bookings (id, user_id, event_id, tier_type, quantity, total_amount)
  values (p_booking_id, p_user_id, p_event_id, p_tier_type, p_quantity, p_total_amount);

  for attendee in select value from jsonb_array_elements(p_attendees)
  loop
    ticket_index := ticket_index + 1;
    guest_name_value := trim(attendee->>'name');
    guest_phone_value := trim(attendee->>'phone');
    if guest_name_value is null or length(guest_name_value) not between 1 and 80
       or guest_phone_value !~ '^\+[1-9][0-9]{7,14}$' then
      raise exception 'Invalid attendee details';
    end if;

    insert into public.booking_tickets (id, booking_id, guest_name, guest_phone, ticket_number)
    values (
      'BOS-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)) || '-P' || lpad(ticket_index::text, 2, '0'),
      p_booking_id,
      guest_name_value,
      guest_phone_value,
      ticket_index
    );
  end loop;

  return p_booking_id;
end;
$$;

create or replace function public.bos_attach_order(
  p_booking_id uuid,
  p_user_id text,
  p_order_id text
) returns boolean
language plpgsql
set search_path = ''
as $$
begin
  if p_order_id is null or length(p_order_id) not between 1 and 64 then
    raise exception 'Invalid payment order';
  end if;
  update public.bookings
  set gateway_order_id = p_order_id
  where id = p_booking_id and user_id = p_user_id and status = 'PENDING' and gateway_order_id is null;
  if not found then
    raise exception 'Pending booking could not be attached to the payment order';
  end if;
  return true;
end;
$$;

create or replace function public.bos_cancel_pending_booking(
  p_booking_id uuid,
  p_user_id text
) returns boolean
language plpgsql
set search_path = ''
as $$
begin
  update public.bookings
  set status = 'CANCELLED'
  where id = p_booking_id and user_id = p_user_id and status = 'PENDING';
  return found;
end;
$$;

create or replace function public.bos_fulfill_booking(
  p_booking_id uuid,
  p_user_id text,
  p_order_id text,
  p_payment_id text,
  p_amount integer,
  p_utr text
) returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  booking_row public.bookings%rowtype;
  ticket_rows jsonb;
begin
  select * into booking_row
  from public.bookings
  where id = p_booking_id and user_id = p_user_id
  for update;

  if not found then
    raise exception 'Booking not found';
  end if;
  if booking_row.status = 'CANCELLED' then
    raise exception 'Cancelled booking cannot be fulfilled';
  end if;
  if booking_row.gateway_order_id is distinct from p_order_id
     or booking_row.total_amount <> p_amount
     or p_payment_id is null or length(p_payment_id) not between 1 and 64
     or p_utr is null or p_utr !~ '^[0-9]{12}$' then
    raise exception 'Payment does not match this booking';
  end if;

  if booking_row.status = 'PAID' then
    if booking_row.gateway_payment_id is distinct from p_payment_id or booking_row.gateway_utr is distinct from p_utr then
      raise exception 'Booking was fulfilled by a different payment';
    end if;
  else
    update public.bookings
    set status = 'PAID', gateway_payment_id = p_payment_id, gateway_utr = p_utr, paid_at = now()
    where id = p_booking_id;
    update public.booking_tickets
    set status = 'VALID', issued_at = now()
    where booking_id = p_booking_id and status = 'PENDING';
  end if;

  select jsonb_agg(jsonb_build_object(
    'id', id, 'guestName', guest_name, 'guestPhone', guest_phone,
    'ticketNumber', ticket_number,
    'tierName', case when booking_row.tier_type = 'DUO' then 'Couple / Duo · 2 people' else 'Entry · 1 person' end,
    'tierType', booking_row.tier_type,
    'price', booking_row.total_amount / booking_row.quantity / case when booking_row.tier_type = 'DUO' then 2 else 1 end / 100.0,
    'status', status, 'issuedAt', issued_at
  ) order by ticket_number)
  into ticket_rows
  from public.booking_tickets
  where booking_id = p_booking_id;

  return jsonb_build_object(
    'bookingId', booking_row.id,
    'eventId', booking_row.event_id,
    'tierType', booking_row.tier_type,
    'quantity', booking_row.quantity,
    'totalAmount', booking_row.total_amount / 100.0,
    'status', 'PAID',
    'paidAt', coalesce(booking_row.paid_at, now()),
    'tickets', coalesce(ticket_rows, '[]'::jsonb)
  );
end;
$$;

revoke all on function public.bos_create_pending_booking(uuid, text, text, text, integer, integer, jsonb) from public, anon, authenticated;
revoke all on function public.bos_attach_order(uuid, text, text) from public, anon, authenticated;
revoke all on function public.bos_cancel_pending_booking(uuid, text) from public, anon, authenticated;
revoke all on function public.bos_fulfill_booking(uuid, text, text, text, integer, text) from public, anon, authenticated;
grant execute on function public.bos_create_pending_booking(uuid, text, text, text, integer, integer, jsonb) to service_role;
grant execute on function public.bos_attach_order(uuid, text, text) to service_role;
grant execute on function public.bos_cancel_pending_booking(uuid, text) to service_role;
grant execute on function public.bos_fulfill_booking(uuid, text, text, text, integer, text) to service_role;
