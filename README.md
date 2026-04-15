## BookOurSpot

BookOurSpot is a Next.js + Supabase booking platform for salons, barbershops, spas, and car washes.

## Local development

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Copy `.env.example` to `.env.local` and fill all values.

### Required for core app
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Required for server-side booking notifications
- `SUPABASE_SERVICE_ROLE_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_FROM` (Twilio sender, e.g. `+14155238886`)
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

## SQL migration for owner WhatsApp

Run this migration in Supabase SQL editor (or via CLI):

`supabase/migrations/20260415130000_owner_whatsapp_notifications.sql`

This adds `businesses.owner_whatsapp` used for owner booking alerts.

## Booking notification flow

Booking creation is handled by `POST /api/appointments/book`:
1. Inserts appointment
2. Inserts transaction
3. Sends customer WhatsApp (Twilio)
4. Sends customer email (Resend)
5. Sends owner WhatsApp (Twilio using `businesses.owner_whatsapp`)
