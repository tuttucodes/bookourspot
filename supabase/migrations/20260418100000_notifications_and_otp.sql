-- ============================================
-- Notifications, OTP, suppressions, phone verification
-- Migration: 2026-04-18
-- ============================================

-- ============================================
-- users.phone_verified flag (set to true only after OTP verify)
-- ============================================
alter table public.users
  add column if not exists phone_verified boolean not null default false,
  add column if not exists phone_verified_at timestamptz;

-- Unique phone per user (partial index skips nulls)
create unique index if not exists idx_users_phone_unique
  on public.users (phone)
  where phone is not null and phone_verified = true;

-- ============================================
-- notification_logs
-- One row per attempted send. Dedup key prevents duplicate deliveries on retry.
-- ============================================
create table if not exists public.notification_logs (
  id uuid default uuid_generate_v4() primary key,
  event_type text not null check (event_type in (
    'booking_confirmed',
    'booking_cancelled',
    'owner_new_booking',
    'welcome',
    'reminder_60m',
    'reminder_30m',
    'reminder_15m',
    'otp_login'
  )),
  channel text not null check (channel in ('email', 'whatsapp', 'sms')),
  recipient text not null,
  -- appointment id, user id, or null for ad-hoc
  entity_type text not null check (entity_type in ('appointment', 'user', 'otp', 'other')),
  entity_id uuid,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed', 'bounced', 'complained', 'suppressed')),
  provider text not null check (provider in ('resend', 'twilio')),
  provider_message_id text,
  error text,
  subject text,
  payload jsonb,
  attempt int not null default 1,
  sent_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Dedup key: at most one in-flight or successful send per (event, entity, channel, recipient).
-- Partial unique index allows retry after a failed attempt (status != 'queued' and != 'sent').
create unique index if not exists idx_notification_logs_dedup
  on public.notification_logs (event_type, entity_type, entity_id, channel, recipient)
  where status in ('queued', 'sent');

create index if not exists idx_notification_logs_entity on public.notification_logs (entity_type, entity_id);
create index if not exists idx_notification_logs_status on public.notification_logs (status);
create index if not exists idx_notification_logs_created_at on public.notification_logs (created_at desc);
create index if not exists idx_notification_logs_provider_msg on public.notification_logs (provider_message_id) where provider_message_id is not null;

alter table public.notification_logs enable row level security;

-- Only service role writes; users see their own via appointments join.
create policy "Users view own notification logs" on public.notification_logs for select
  using (
    (entity_type = 'user' and entity_id = auth.uid())
    or (entity_type = 'appointment' and exists (
      select 1 from public.appointments a
      where a.id = notification_logs.entity_id
        and (a.user_id = auth.uid() or exists (
          select 1 from public.businesses b
          where b.id = a.business_id and b.owner_id = auth.uid()
        ))
    ))
  );

-- ============================================
-- email_suppressions
-- Populated by Resend webhook on bounce/complaint. Checked before every send.
-- ============================================
create table if not exists public.email_suppressions (
  email text primary key,
  reason text not null check (reason in ('bounce_hard', 'bounce_soft', 'complaint', 'manual')),
  first_suppressed_at timestamptz not null default now(),
  last_event_at timestamptz not null default now(),
  event_count int not null default 1,
  details jsonb
);

alter table public.email_suppressions enable row level security;
-- Service role only. No user-facing policy.

-- ============================================
-- otp_codes
-- Hashed (sha256 of code + pepper). Never store plaintext.
-- ============================================
create table if not exists public.otp_codes (
  id uuid default uuid_generate_v4() primary key,
  phone text not null,
  code_hash text not null,
  purpose text not null default 'login' check (purpose in ('login', 'phone_verify')),
  attempts int not null default 0,
  max_attempts int not null default 5,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  sent_via text check (sent_via in ('whatsapp', 'sms')),
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_otp_codes_phone_active
  on public.otp_codes (phone, expires_at desc)
  where consumed_at is null;
create index if not exists idx_otp_codes_expires on public.otp_codes (expires_at);

alter table public.otp_codes enable row level security;
-- Service role only. Users never read OTPs directly.

-- ============================================
-- Rate limit: max 3 OTP sends per phone per hour
-- Called from app layer before insert.
-- ============================================
create or replace function public.otp_recent_send_count(p_phone text, p_window interval default interval '1 hour')
returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.otp_codes
  where phone = p_phone
    and created_at >= now() - p_window;
$$;

-- ============================================
-- Cleanup: drop expired OTPs older than 24h (nightly cleanup)
-- ============================================
create or replace function public.otp_cleanup()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  delete from public.otp_codes
  where expires_at < now() - interval '24 hours';
  get diagnostics n = row_count;
  return n;
end;
$$;

-- ============================================
-- updated_at triggers
-- ============================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists notification_logs_updated_at on public.notification_logs;
create trigger notification_logs_updated_at
  before update on public.notification_logs
  for each row execute function public.set_updated_at();
