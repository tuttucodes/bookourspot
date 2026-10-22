-- BookOutSpot paid bookings and server-issued tickets.
-- Apply in the Supabase SQL Editor before enabling checkout.
-- Browser roles intentionally have no access. Vercel API routes authenticate
-- Firebase ID tokens, then use the server-only Supabase service role.

create table if not exists public.bookings (
  id uuid primary key,
  user_id text not null,
  event_id text not null check (event_id = 'halloween-affair'),
  tier_type text not null check (tier_type in ('SOLO', 'DUO', 'MIXED')),
  quantity smallint not null check (quantity between 1 and 5),
  total_amount integer not null check (total_amount between 150000 and 1400000),
  status text not null default 'PENDING' check (status in ('PENDING', 'PAID', 'CANCELLED')),
  gateway_order_id text unique,
  gateway_payment_id text unique,
  gateway_utr text unique,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
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
alter table public.bookings drop constraint if exists bookings_tier_type_check;
alter table public.bookings add constraint bookings_tier_type_check check (tier_type in ('SOLO', 'DUO', 'MIXED'));
alter table public.bookings add constraint bookings_total_amount_check check (total_amount between 150000 and 1400000);
-- The amount is reconciled against the immutable per-tier booking_items rows
-- by bos_create_pending_booking and again against the verified webhook.

create table if not exists public.booking_items (
  booking_id uuid not null references public.bookings(id) on delete cascade,
  tier_type text not null check (tier_type in ('SOLO', 'DUO')),
  quantity smallint not null check (quantity between 1 and 5),
  total_amount integer not null check (
    (tier_type = 'SOLO' and total_amount = quantity * 150000)
    or (tier_type = 'DUO' and total_amount = quantity * 280000)
  ),
  primary key (booking_id, tier_type)
);
-- Preserve legacy single-tier orders so history and retry-safe fulfillment can
-- still read their pricing after the normalized line-item migration.
insert into public.booking_items (booking_id, tier_type, quantity, total_amount)
select id, tier_type, quantity,
       quantity * case when tier_type = 'DUO' then 280000 else 150000 end
from public.bookings
where tier_type in ('SOLO', 'DUO')
on conflict (booking_id, tier_type) do nothing;

create table if not exists public.booking_tickets (
  id text primary key,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  guest_name text not null check (length(trim(guest_name)) between 1 and 80),
  guest_phone text not null check (guest_phone ~ '^[+][1-9][0-9]{7,14}$'),
  tier_type text not null check (tier_type in ('SOLO', 'DUO')),
  tier_name text not null check (length(trim(tier_name)) between 1 and 80),
  unit_price integer not null check (
    (tier_type = 'SOLO' and unit_price = 150000)
    or (tier_type = 'DUO' and unit_price = 140000)
  ),
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
alter table public.booking_tickets add column if not exists tier_type text;
alter table public.booking_tickets add column if not exists tier_name text;
alter table public.booking_tickets add column if not exists unit_price integer;
update public.booking_tickets t
set tier_type = b.tier_type,
    tier_name = case when b.tier_type = 'DUO' then 'Couple / Duo · 2 people' else 'Entry · 1 person' end,
    unit_price = b.total_amount / b.quantity / case when b.tier_type = 'DUO' then 2 else 1 end
from public.bookings b
where b.id = t.booking_id and (t.tier_type is null or t.tier_name is null or t.unit_price is null);
alter table public.booking_tickets alter column tier_type set not null;
alter table public.booking_tickets alter column tier_name set not null;
alter table public.booking_tickets alter column unit_price set not null;
alter table public.booking_tickets drop constraint if exists booking_tickets_tier_type_check;
alter table public.booking_tickets add constraint booking_tickets_tier_type_check check (tier_type in ('SOLO', 'DUO'));
alter table public.booking_tickets drop constraint if exists booking_tickets_tier_name_check;
alter table public.booking_tickets add constraint booking_tickets_tier_name_check check (length(trim(tier_name)) between 1 and 80);
alter table public.booking_tickets drop constraint if exists booking_tickets_unit_price_check;
alter table public.booking_tickets add constraint booking_tickets_unit_price_check check (
  (tier_type = 'SOLO' and unit_price = 150000)
  or (tier_type = 'DUO' and unit_price = 140000)
);

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
drop function if exists public.bos_create_pending_booking(uuid, text, text, text, integer, integer, jsonb);
drop function if exists public.bos_attach_order(uuid, uuid, text);
drop function if exists public.bos_cancel_pending_booking(uuid, uuid);
drop function if exists public.bos_fulfill_booking(uuid, uuid, text, text, integer);
drop function if exists public.bos_fulfill_booking(uuid, text, text, text, integer);

create index if not exists bookings_user_created_idx on public.bookings (user_id, created_at desc);
create index if not exists booking_tickets_booking_idx on public.booking_tickets (booking_id, ticket_number);
create index if not exists booking_items_booking_idx on public.booking_items (booking_id);

alter table public.bookings enable row level security;
alter table public.booking_tickets enable row level security;
alter table public.booking_items enable row level security;
revoke all privileges on table public.bookings, public.booking_items, public.booking_tickets from anon, authenticated;
grant select, insert, update, delete on table public.bookings, public.booking_items, public.booking_tickets to service_role;

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
  p_items jsonb
) returns uuid
language plpgsql
set search_path = ''
as $$
declare
  item jsonb;
  attendee jsonb;
  ticket_index integer := 0;
  item_count integer := 0;
  unit_count integer := 0;
  expected_amount integer := 0;
  tier_value text;
  quantity_value integer;
  line_amount integer;
  tier_name_value text;
  per_ticket_price integer;
  attendee_count integer;
  distinct_tiers integer;
  guest_name_value text;
  guest_phone_value text;
begin
  if p_user_id is null or p_event_id is distinct from 'halloween-affair'
     or p_items is null or coalesce(jsonb_typeof(p_items), '') <> 'array'
     or (case when jsonb_typeof(p_items) = 'array'
              then jsonb_array_length(p_items) not between 1 and 2
              else true end) then
    raise exception 'Invalid booking details';
  end if;

  for item in select value from jsonb_array_elements(p_items)
  loop
    tier_value := item->>'tierType';
    quantity_value := case when (item->>'quantity') ~ '^[0-9]+$' then (item->>'quantity')::integer else 0 end;
    if tier_value is null or tier_value not in ('SOLO', 'DUO') or quantity_value not between 1 and 5
       or item->'attendees' is null or jsonb_typeof(item->'attendees') <> 'array' then
      raise exception 'Invalid ticket line';
    end if;
    line_amount := quantity_value * case when tier_value = 'DUO' then 280000 else 150000 end;
    attendee_count := jsonb_array_length(item->'attendees');
    if attendee_count <> quantity_value * (case when tier_value = 'DUO' then 2 else 1 end) then
      raise exception 'Attendee count does not match ticket line';
    end if;
    unit_count := unit_count + quantity_value;
    expected_amount := expected_amount + line_amount;
    item_count := item_count + 1;
  end loop;

  select count(distinct value->>'tierType') into distinct_tiers from jsonb_array_elements(p_items);
  if unit_count not between 1 and 5 or item_count <> distinct_tiers or p_total_amount is null
     or p_quantity is null or expected_amount <> p_total_amount or p_quantity <> unit_count
     or p_tier_type is distinct from (case when distinct_tiers > 1 then 'MIXED' else (p_items->0->>'tierType') end) then
    raise exception 'Booking amount or tier summary does not match ticket lines';
  end if;

  insert into public.bookings (id, user_id, event_id, tier_type, quantity, total_amount)
  values (p_booking_id, p_user_id, p_event_id, p_tier_type, unit_count, expected_amount);

  for item in select value from jsonb_array_elements(p_items)
  loop
    tier_value := item->>'tierType';
    quantity_value := (item->>'quantity')::integer;
    tier_name_value := case when tier_value = 'DUO' then 'Couple / Duo · 2 people' else 'Entry · 1 person' end;
    per_ticket_price := case when tier_value = 'DUO' then 140000 else 150000 end;
    line_amount := quantity_value * case when tier_value = 'DUO' then 280000 else 150000 end;
    insert into public.booking_items (booking_id, tier_type, quantity, total_amount)
    values (p_booking_id, tier_value, quantity_value, line_amount);

    for attendee in select value from jsonb_array_elements(item->'attendees')
    loop
      ticket_index := ticket_index + 1;
      guest_name_value := trim(attendee->>'name');
      guest_phone_value := trim(attendee->>'phone');
      if guest_name_value is null or length(guest_name_value) not between 1 and 80
         or guest_phone_value !~ '^\+[1-9][0-9]{7,14}$' then
        raise exception 'Invalid attendee details';
      end if;

      insert into public.booking_tickets (id, booking_id, guest_name, guest_phone, tier_type, tier_name, unit_price, ticket_number)
      values (
        'BOS-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)) || '-P' || lpad(ticket_index::text, 2, '0'),
        p_booking_id,
        guest_name_value,
        guest_phone_value,
        tier_value,
        tier_name_value,
        per_ticket_price,
        ticket_index
      );
    end loop;
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
  item_rows jsonb;
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
    'tierName', tier_name,
    'tierType', tier_type,
    'price', unit_price / 100.0,
    'status', status, 'issuedAt', issued_at
  ) order by ticket_number)
  into ticket_rows
  from public.booking_tickets
  where booking_id = p_booking_id;

  select jsonb_agg(jsonb_build_object(
    'tierType', tier_type, 'quantity', quantity, 'totalAmount', total_amount / 100.0
  ) order by tier_type)
  into item_rows
  from public.booking_items
  where booking_id = p_booking_id;

  return jsonb_build_object(
    'bookingId', booking_row.id,
    'eventId', booking_row.event_id,
    'tierType', booking_row.tier_type,
    'quantity', booking_row.quantity,
    'totalAmount', booking_row.total_amount / 100.0,
    'items', coalesce(item_rows, '[]'::jsonb),
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
