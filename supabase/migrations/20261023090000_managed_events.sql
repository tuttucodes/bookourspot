-- Admin-managed event content. All access goes through authenticated server
-- routes using the service role; browser roles cannot read attendee/admin data.
create table if not exists public.managed_events (
  event_id text primary key check (event_id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  status text not null default 'DRAFT' check (status in ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
  event_data jsonb not null check (jsonb_typeof(event_data) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint managed_events_event_id_matches_data check (event_data->>'id' = event_id)
);

create index if not exists managed_events_published_updated_idx
  on public.managed_events (updated_at desc)
  where status = 'PUBLISHED';

alter table public.managed_events enable row level security;
revoke all on table public.managed_events from anon, authenticated;
grant select, insert, update, delete on table public.managed_events to service_role;

create or replace function public.set_managed_events_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.set_managed_events_updated_at() from public, anon, authenticated;

drop trigger if exists managed_events_set_updated_at on public.managed_events;
create trigger managed_events_set_updated_at
before update on public.managed_events
for each row execute function public.set_managed_events_updated_at();
