-- Perf-focused indexes for hot paths flagged as slow by merchants.
-- All use `if not exists` so rerunning is safe.

-- Dashboard stats + bookings filters frequently narrow by (business_id, status)
-- and (business_id, date) together. We already have per-column indexes on
-- business_id and date; add tighter composites to avoid back-to-back filters.
create index if not exists appointments_business_status_idx
  on public.appointments (business_id, status);

create index if not exists appointments_business_date_status_idx
  on public.appointments (business_id, date, status);

-- Merchant revenue queries now hit transactions.business_id directly (via the
-- manual revenue migration). Add a (business_id, status) composite so the
-- dashboard can sum completed revenue with a single index scan.
create index if not exists transactions_business_status_idx
  on public.transactions (business_id, status);

create index if not exists transactions_business_paid_at_idx
  on public.transactions (business_id, paid_at desc);

-- Collaborator invite path looks users up by lower(email). Without a functional
-- index this is a seq scan on the users table.
create index if not exists users_email_lower_idx
  on public.users (lower(email));

-- Staff pages filter by (business_id, is_active) — add composite so the
-- partial index alone doesn't leave business_id scans behind.
create index if not exists business_staff_business_active_idx
  on public.business_staff (business_id, is_active);

-- Services list pulls by (business_id, is_active) order by created_at.
create index if not exists services_business_active_idx
  on public.services (business_id, is_active);

-- Collaborator policy lookups frequently ask "is user X a collab on biz Y";
-- (user_id, business_id) is a faster covering key than business_id alone.
create index if not exists business_collaborators_user_business_idx
  on public.business_collaborators (user_id, business_id);

-- ANALYZE so the planner sees the new stats immediately.
analyze public.appointments;
analyze public.transactions;
analyze public.users;
analyze public.business_staff;
analyze public.services;
analyze public.business_collaborators;
