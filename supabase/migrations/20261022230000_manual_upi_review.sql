-- Customers may report a UPI transfer, but that report is not proof of payment.
-- Tickets are fulfilled only after an allowlisted admin confirms the matching
-- bank credit and calls the service-role-only review RPC.

alter table public.bookings
  add column if not exists reported_utr text,
  add column if not exists payment_review_status text not null default 'NOT_SUBMITTED';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.bookings'::regclass and conname = 'bookings_payment_review_status_check'
  ) then
    alter table public.bookings add constraint bookings_payment_review_status_check
      check (payment_review_status in ('NOT_SUBMITTED', 'SUBMITTED', 'REJECTED', 'APPROVED'));
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.bookings'::regclass and conname = 'bookings_reported_utr_format'
  ) then
    alter table public.bookings add constraint bookings_reported_utr_format
      check (reported_utr is null or reported_utr ~ '^[0-9]{12}$');
  end if;
end;
$$;

create table if not exists public.booking_payment_reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  submitted_by text not null,
  utr text not null check (utr ~ '^[0-9]{12}$'),
  amount integer not null check (amount > 0),
  status text not null default 'SUBMITTED' check (status in ('SUBMITTED', 'APPROVED', 'REJECTED')),
  submitted_at timestamptz not null default now(),
  reviewed_by text,
  reviewed_at timestamptz,
  review_note text,
  constraint booking_payment_reviews_review_state check (
    (status = 'SUBMITTED' and reviewed_by is null and reviewed_at is null)
    or (status in ('APPROVED', 'REJECTED') and reviewed_by is not null and reviewed_at is not null)
  )
);

-- A bank reference can only ever be claimed by one payment report, including
-- reports that were rejected; this prevents replaying an already reviewed UTR.
create unique index if not exists booking_payment_reviews_utr_unique
  on public.booking_payment_reviews (utr);
create index if not exists booking_payment_reviews_queue_idx
  on public.booking_payment_reviews (submitted_at, id)
  where status = 'SUBMITTED';
create index if not exists booking_payment_reviews_booking_idx
  on public.booking_payment_reviews (booking_id, submitted_at desc);

alter table public.booking_payment_reviews enable row level security;
revoke all privileges on table public.booking_payment_reviews from public, anon, authenticated;
grant select, insert, update on table public.booking_payment_reviews to service_role;

create or replace function public.bos_submit_payment_report(
  p_booking_id uuid,
  p_user_id text,
  p_utr text
) returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  booking_row public.bookings%rowtype;
  review_id uuid;
begin
  if p_utr is null or p_utr !~ '^[0-9]{12}$' then
    raise exception 'Invalid UTR';
  end if;
  if p_user_id is null or length(p_user_id) not between 1 and 128 then
    raise exception 'Invalid booking owner';
  end if;

  select * into booking_row
  from public.bookings
  where id = p_booking_id and user_id = p_user_id
  for update;
  if not found then raise exception 'Booking not found'; end if;
  if booking_row.status <> 'PENDING'
     or booking_row.gateway_order_id is null
     or booking_row.gateway_payment_id is not null then
    raise exception 'Booking is not awaiting payment';
  end if;

  -- Network retries for the same report are idempotent. A different reference
  -- cannot replace a report while it is waiting for human review.
  if booking_row.payment_review_status = 'SUBMITTED' then
    if booking_row.reported_utr = p_utr then
      select id into review_id from public.booking_payment_reviews
      where booking_id = p_booking_id and utr = p_utr and status = 'SUBMITTED';
      if review_id is not null then
        return jsonb_build_object('bookingId', p_booking_id, 'reviewId', review_id, 'status', 'SUBMITTED');
      end if;
    end if;
    raise exception 'A payment report is already awaiting review';
  end if;
  if booking_row.payment_review_status not in ('NOT_SUBMITTED', 'REJECTED') then
    raise exception 'Booking cannot accept a payment report';
  end if;

  insert into public.booking_payment_reviews (booking_id, submitted_by, utr, amount)
  values (p_booking_id, p_user_id, p_utr, booking_row.total_amount)
  returning id into review_id;

  update public.bookings
  set reported_utr = p_utr,
      payment_review_status = 'SUBMITTED'
  where id = p_booking_id;

  return jsonb_build_object('bookingId', p_booking_id, 'reviewId', review_id, 'status', 'SUBMITTED');
end;
$$;

create or replace function public.bos_review_manual_payment(
  p_booking_id uuid,
  p_admin_uid text,
  p_utr text,
  p_action text,
  p_bank_checked boolean,
  p_note text default null
) returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  booking_row public.bookings%rowtype;
  review_row public.booking_payment_reviews%rowtype;
  fulfillment jsonb;
  manual_payment_id text;
begin
  if p_action is null or p_action not in ('APPROVE', 'REJECT') then raise exception 'Invalid review action'; end if;
  if p_admin_uid is null or length(p_admin_uid) not between 1 and 128 then raise exception 'Invalid reviewer'; end if;
  if p_bank_checked is distinct from true then raise exception 'Bank statement review is required'; end if;
  if p_utr is null or p_utr !~ '^[0-9]{12}$' then raise exception 'Invalid UTR'; end if;
  if p_note is not null and length(p_note) > 500 then raise exception 'Review note is too long'; end if;

  select * into booking_row
  from public.bookings
  where id = p_booking_id
  for update;
  if not found then raise exception 'Booking not found'; end if;

  select * into review_row
  from public.booking_payment_reviews
  where booking_id = p_booking_id and utr = p_utr
  for update;
  if not found then raise exception 'Payment report not found'; end if;
  if booking_row.reported_utr is distinct from p_utr then raise exception 'UTR does not match the current report'; end if;
  if review_row.amount <> booking_row.total_amount then raise exception 'Reported amount no longer matches booking'; end if;

  -- An approval retry must be harmless and must not create a second ticket set.
  if review_row.status = 'APPROVED' and p_action = 'APPROVE'
     and booking_row.status = 'PAID'
     and booking_row.gateway_payment_id = 'MANUAL-' || p_utr then
    return public.bos_fulfill_booking(
      booking_row.id, booking_row.user_id, booking_row.gateway_order_id,
      booking_row.gateway_payment_id, booking_row.total_amount, p_utr
    );
  end if;

  if booking_row.status <> 'PENDING'
     or booking_row.payment_review_status <> 'SUBMITTED'
     or review_row.status <> 'SUBMITTED' then
    raise exception 'Payment report is no longer awaiting review';
  end if;

  if p_action = 'REJECT' then
    if p_note is null or length(trim(p_note)) < 3 then raise exception 'A rejection reason is required'; end if;
    update public.booking_payment_reviews
    set status = 'REJECTED', reviewed_by = p_admin_uid,
        reviewed_at = now(), review_note = trim(p_note)
    where id = review_row.id;
    update public.bookings
    set payment_review_status = 'REJECTED'
    where id = p_booking_id;
    return jsonb_build_object('bookingId', p_booking_id, 'status', 'PENDING', 'paymentReviewStatus', 'REJECTED');
  end if;

  manual_payment_id := 'MANUAL-' || p_utr;
  fulfillment := public.bos_fulfill_booking(
    booking_row.id, booking_row.user_id, booking_row.gateway_order_id,
    manual_payment_id, booking_row.total_amount, p_utr
  );
  update public.booking_payment_reviews
  set status = 'APPROVED', reviewed_by = p_admin_uid,
      reviewed_at = now(), review_note = nullif(trim(coalesce(p_note, '')), '')
  where id = review_row.id;
  update public.bookings
  set payment_review_status = 'APPROVED'
  where id = p_booking_id;
  return fulfillment || jsonb_build_object('paymentReviewStatus', 'APPROVED');
end;
$$;

revoke all on function public.bos_submit_payment_report(uuid, text, text) from public, anon, authenticated;
revoke all on function public.bos_review_manual_payment(uuid, text, text, text, boolean, text) from public, anon, authenticated;
grant execute on function public.bos_submit_payment_report(uuid, text, text) to service_role;
grant execute on function public.bos_review_manual_payment(uuid, text, text, text, boolean, text) to service_role;
