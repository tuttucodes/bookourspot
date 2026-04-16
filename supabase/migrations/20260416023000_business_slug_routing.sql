-- Add canonical business slugs for clean public URLs.

alter table public.businesses
  add column if not exists slug text;

create or replace function public.slugify(input text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(coalesce(input, '')), '[^a-z0-9]+', '-', 'g'))
$$;

with base_slugs as (
  select
    id,
    coalesce(nullif(public.slugify(name), ''), 'business') as base_slug
  from public.businesses
),
ranked_slugs as (
  select
    id,
    case
      when row_number() over (partition by base_slug order by created_at, id) = 1 then base_slug
      else base_slug || '-' || row_number() over (partition by base_slug order by created_at, id)
    end as generated_slug
  from base_slugs
  join public.businesses using (id)
)
update public.businesses b
set slug = ranked_slugs.generated_slug
from ranked_slugs
where b.id = ranked_slugs.id
  and (b.slug is null or b.slug = '');

alter table public.businesses
  alter column slug set not null;

create unique index if not exists businesses_slug_key on public.businesses (slug);

create or replace function public.set_business_slug()
returns trigger
language plpgsql
as $$
declare
  base_slug text;
  candidate_slug text;
  counter integer := 1;
begin
  if new.slug is not null and btrim(new.slug) <> '' then
    base_slug := public.slugify(new.slug);
  else
    base_slug := public.slugify(new.name);
  end if;

  if base_slug is null or base_slug = '' then
    base_slug := 'business';
  end if;

  candidate_slug := base_slug;

  while exists (
    select 1
    from public.businesses
    where slug = candidate_slug
      and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) loop
    counter := counter + 1;
    candidate_slug := base_slug || '-' || counter;
  end loop;

  new.slug := candidate_slug;
  return new;
end;
$$;

drop trigger if exists businesses_set_slug on public.businesses;

create trigger businesses_set_slug
  before insert or update of name, slug on public.businesses
  for each row execute function public.set_business_slug();
