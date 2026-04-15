-- Add owner WhatsApp channel for business-level booking alerts
alter table public.businesses
  add column if not exists owner_whatsapp text;

comment on column public.businesses.owner_whatsapp is
  'Owner WhatsApp number in E.164 or local format, used for automated booking notifications.';

create index if not exists businesses_owner_whatsapp_idx
  on public.businesses (owner_whatsapp)
  where owner_whatsapp is not null;
