create table public.business_staff (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  role text not null,
  avatar_url text,
  status text not null default 'available' check (status in ('available', 'busy', 'off_duty')),
  rating numeric(3, 2) not null default 5.0 check (rating >= 0 and rating <= 5),
  monthly_bookings integer not null default 0 check (monthly_bookings >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index business_staff_business_id_idx on public.business_staff (business_id);
create index business_staff_active_idx on public.business_staff (is_active) where is_active = true;

create trigger business_staff_set_updated_at
  before update on public.business_staff
  for each row execute function public.set_updated_at();

alter table public.business_staff enable row level security;

create policy "business_staff_select"
  on public.business_staff for select
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_staff.business_id
        and (b.owner_id = auth.uid() or (b.is_active = true and business_staff.is_active = true))
    )
  );

create policy "business_staff_insert_owner"
  on public.business_staff for insert
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = business_id and b.owner_id = auth.uid()
    )
  );

create policy "business_staff_update_owner"
  on public.business_staff for update
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_staff.business_id and b.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = business_staff.business_id and b.owner_id = auth.uid()
    )
  );

create policy "business_staff_delete_owner"
  on public.business_staff for delete
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_staff.business_id and b.owner_id = auth.uid()
    )
  );
