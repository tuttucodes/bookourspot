# Notifications — Production Setup

End-to-end guide for wiring email (Resend) + WhatsApp (Twilio) + OTP login + cron
reminders. Follow in order.

---

## 0. Generate shared secrets

```bash
openssl rand -hex 32  # -> CRON_SECRET
openssl rand -hex 32  # -> OTP_PEPPER
openssl rand -hex 32  # -> SUPABASE_WEBHOOK_SECRET
```

Paste into `.env.local` (dev) and into Vercel project environment variables
(Production + Preview).

---

## 1. Supabase migration

Apply the new tables / columns (`notification_logs`, `otp_codes`,
`email_suppressions`, `users.phone_verified`):

```bash
# If you use the Supabase CLI
supabase db push

# Or paste the migration SQL via Supabase SQL Editor:
#   supabase/migrations/20260418100000_notifications_and_otp.sql
```

Verify tables exist: `select * from notification_logs limit 1;`

---

## 2. Resend — domain verification (Cloudflare)

You already created the API key (`RESEND_API_KEY`). Now add DNS records so
`bookings@bookourspot.com` can send without hitting spam.

### 2.1 — Add your domain

1. https://resend.com/domains → **Add Domain**
2. Enter: `bookourspot.com`
3. Region: `ap-southeast-1` (Singapore — closest to MY)
4. Resend shows ~5 DNS records: SPF (TXT), DKIM (3 CNAME), MX (for inbound).

### 2.2 — Add records in Cloudflare

For each record Resend shows:

1. Cloudflare → your domain → **DNS** → **Add record**
2. Set **Proxy status = DNS only** (grey cloud, NOT orange). Proxied records
   break mail auth.
3. TTL = Auto
4. Copy host/value exactly from Resend.

### 2.3 — Verify

Back in Resend → click **Verify DNS records**. Takes a few minutes. Once
"Verified" ✓, sending from `bookings@bookourspot.com` is live.

### 2.4 — DMARC (recommended)

Add a DMARC TXT record — not required but helps deliverability:

- Name: `_dmarc`
- Type: TXT
- Value: `v=DMARC1; p=none; rua=mailto:dmarc@bookourspot.com`

Start with `p=none` (monitor only). After 2–4 weeks of clean reports, raise
to `p=quarantine` then `p=reject`.

---

## 3. Resend — webhook

1. Resend dashboard → **Webhooks** → **Add endpoint**
2. Endpoint URL: `https://www.bookourspot.com/api/webhooks/resend`
3. Events to send: check **all** (`email.sent`, `email.delivered`,
   `email.bounced`, `email.complained`, `email.failed`).
4. Save. Resend reveals a **Signing Secret** (`whsec_...`).
5. Copy it into `RESEND_WEBHOOK_SECRET` (local + Vercel env).
6. Test: click **Send test event** in Resend. Tail Vercel logs to confirm 200.

Hard bounces & spam complaints auto-populate `email_suppressions` → future sends
to that address are skipped.

---

## 4. Supabase Auth → Resend SMTP

You already configured this. Double-check:

Supabase Dashboard → **Authentication** → **Settings** → **SMTP Settings**:

- Enable Custom SMTP: ON
- Sender email: `auth@bookourspot.com`
- Sender name: `BookOurSpot`
- Host: `smtp.resend.com`
- Port: `465` (SSL) or `587` (TLS)
- Username: `resend`
- Password: your `RESEND_API_KEY`

Then under **Email Templates**, customize the Magic Link / Password Reset /
Confirmation templates to match your branding.

---

## 5. Supabase — user-created webhook (welcome email)

Fires `sendWelcomeEmail` on every new profile row.

1. Supabase dashboard → **Database** → **Webhooks** → **Create a new hook**
2. Name: `user-created-welcome`
3. Table: `public.users`
4. Events: ✅ Insert (leave Update/Delete unchecked)
5. Type: **HTTP Request**
6. HTTP method: POST
7. URL: `https://www.bookourspot.com/api/webhooks/supabase/user-created`
8. HTTP Headers:
   - Key: `Authorization` | Value: `Bearer <your SUPABASE_WEBHOOK_SECRET>`
9. Timeout: 5000 ms
10. Save → click **Send test** to verify.

---

## 6. Twilio — WhatsApp production sender

You're on the sandbox now (`+14155238886`). For real customers:

### 6.1 — Register a WhatsApp Business sender

1. Twilio Console → **Messaging** → **Senders** → **WhatsApp senders**
2. **Add new sender** → choose/buy a Twilio number (SMS-capable).
3. Complete the **Meta Business Manager** linking flow:
   - Link your Meta Business Account
   - Add business verification documents (company reg / NRIC + proof of address)
   - Submit for Meta approval
4. Wait 1–7 days for approval. During wait, your sandbox keeps working.
5. Once approved, copy the production number → set
   `TWILIO_WHATSAPP_FROM=+<approved-number>` in Vercel prod env.

### 6.2 — Approve Content Templates

You cannot send freeform messages to a user outside the 24-hour session window.
Submit these templates for approval:

**Template 1 — `booking_confirmed`**
```
Hi {{1}}, your booking at {{2}} is confirmed.
Service: {{3}}
Date: {{4}}
Time: {{5}}
Show this message at the store.
```

**Template 2 — `booking_reminder`**
```
Reminder: {{1}}, your appointment at {{2}} for {{3}} is in {{5}} (at {{4}}).
```

**Template 3 — `otp_login`**
Category: **Authentication**
```
Your BookOurSpot login code is {{1}}. It expires in 10 minutes. Do not share
this code with anyone.
```
Mark as Authentication category — no marketing tags, one-time code only.

Wait for Meta approval (hours to days). Copy each approved Content SID (prefix
`HX...`) and set:

```
TWILIO_CONTENT_SID_BOOKING_CONFIRMED=HX...
TWILIO_CONTENT_SID_BOOKING_REMINDER=HX...
TWILIO_CONTENT_SID_OTP=HX...
```

`src/lib/notifications.ts` auto-switches to Content API when these are set.

### 6.3 — Twilio status callback

Twilio Console → WhatsApp sender → **Messaging configuration** →
**Status callback URL**:

```
https://www.bookourspot.com/api/webhooks/twilio
```

Method: POST. Twilio signs every callback with your Auth Token — the route
verifies before touching `notification_logs`.

---

## 7. Vercel — environment variables

In Vercel dashboard → Project Settings → **Environment Variables**, add for
both **Production** and **Preview**:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL
SUPABASE_SERVICE_ROLE_KEY
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_WHATSAPP_FROM
TWILIO_CONTENT_SID_OTP               # once approved
TWILIO_CONTENT_SID_BOOKING_CONFIRMED # once approved
TWILIO_CONTENT_SID_BOOKING_REMINDER  # once approved
RESEND_API_KEY
RESEND_FROM_EMAIL
RESEND_REPLY_TO
RESEND_WEBHOOK_SECRET
CRON_SECRET
OTP_PEPPER
SUPABASE_WEBHOOK_SECRET
```

---

## 8. Vercel — cron (reminders)

Already configured via `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/reminders", "schedule": "*/5 * * * *" }
  ]
}
```

After first deploy to production, Vercel auto-detects and displays the cron in
Project → **Cron Jobs**. It fires every 5 minutes in the `iad1` region (default).

Auth: Vercel Cron sets `Authorization: Bearer $CRON_SECRET` on the request. The
route rejects anything else with 401.

Verify in Project → **Cron Jobs** → click the job → see last run history.

---

## 9. End-to-end test checklist

After deploy:

- [ ] Book an appointment → check email lands for customer + owner + WhatsApp
      for both.
- [ ] Hit `POST /api/appointments/:id/cancel` → receive cancellation email.
- [ ] Book for 60 min / 30 min / 15 min in the future → wait → reminders arrive.
- [ ] `POST /api/auth/otp/send` with your phone → WhatsApp OTP arrives.
- [ ] `POST /api/auth/otp/verify` with code + email → get `magic_link` →
      navigate to it → Supabase session cookie set → `/explore` loads logged in.
- [ ] Sign up a new Google user → welcome email arrives.
- [ ] Resend dashboard → **Webhooks** → send test → 200 response.
- [ ] Check `select * from notification_logs order by created_at desc limit 20;`
      — see statuses progress `queued → sent → delivered`.
- [ ] Send a dud booking to `bounced@resend.dev` → `email_suppressions` row
      appears → subsequent sends skip.

---

## 10. Monitoring

Query patterns:

```sql
-- Delivery success rate last 24h by channel
select channel, status, count(*)
from notification_logs
where created_at > now() - interval '24 hours'
group by channel, status
order by channel, status;

-- Failed sends needing attention
select event_type, channel, recipient, error, created_at
from notification_logs
where status = 'failed' and created_at > now() - interval '24 hours'
order by created_at desc;

-- OTP abuse watch
select phone, count(*) as sends, max(created_at) as last_send
from otp_codes
where created_at > now() - interval '1 hour'
group by phone
having count(*) >= 3;
```

---

## 11. Known limitations / follow-ups

- **Timezone**: cron assumes `Asia/Kuala_Lumpur` (UTC+8) for all businesses.
  Add a `timezone` column on `businesses` when you expand beyond MY.
- **OTP phone-only signup**: first-time WhatsApp OTP login requires an email
  because Supabase magic links are email-only. Subsequent logins use stored
  email. For phone-only UX, add a custom JWT cookie handler later.
- **Cron drift**: reminders fire every 5 min with ±3 min tolerance. A booking
  scheduled at a boundary may receive reminder 2–3 min early or late. Tighten
  tolerance or switch to 1-min cron on Vercel Pro if precision matters.
- **Twilio Sandbox**: every recipient must send `join <code>` first. Real
  customers can't receive WhatsApp until the production sender is approved.
