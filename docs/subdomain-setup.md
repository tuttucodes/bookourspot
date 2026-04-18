# Subdomain Setup — merchant.bookourspot.com

Split customer UX from merchant UX via subdomain. Single codebase, single Vercel
project, one Supabase — zero duplication. Follow in order.

```
www.bookourspot.com        →  customer (explore, book, profile)
merchant.bookourspot.com   →  merchant (dashboard, POS, receipts, staff, analytics)
```

---

## 1. Cloudflare DNS

1. Cloudflare → `bookourspot.com` → **DNS** → **Add record**
2. Type: `CNAME`
3. Name: `business`
4. Target: `cname.vercel-dns.com`
5. Proxy status: **DNS only** (grey cloud). Proxied = Vercel fails cert check.
6. TTL: Auto
7. Save.

Verify:
```bash
dig merchant.bookourspot.com CNAME +short
# -> cname.vercel-dns.com.
```

---

## 2. Vercel domain

1. Vercel dashboard → your project → **Settings** → **Domains**
2. **Add** → `merchant.bookourspot.com`
3. Vercel auto-provisions SSL (~1 min). Status should flip to **Valid**.
4. Leave production branch mapping on `main` (both hosts point to same build).

No redirect config needed — proxy routing is handled in-app by `src/proxy.ts`.

---

## 3. Supabase Auth redirect URLs

Supabase dashboard → **Authentication** → **URL Configuration**:

**Site URL** (primary, used for email templates):
```
https://www.bookourspot.com
```

**Redirect URLs** — add all of these:
```
https://www.bookourspot.com/auth/callback
https://bookourspot.com/auth/callback
https://merchant.bookourspot.com/auth/callback
http://localhost:3000/auth/callback
http://merchant.localhost:3000/auth/callback
```

---

## 4. Google OAuth (Cloud Console)

Google Cloud Console → your OAuth 2.0 Client ID → **Edit**:

**Authorized JavaScript origins**:
```
https://www.bookourspot.com
https://bookourspot.com
https://merchant.bookourspot.com
http://localhost:3000
```

**Authorized redirect URIs** — leave the Supabase one; add nothing:
```
https://srpveyhriysncubkptrc.supabase.co/auth/v1/callback
```

Google redirects to Supabase → Supabase redirects to one of the URLs above based
on `redirectTo` param set by our client code.

---

## 5. Session cookie sharing (already in code)

`src/lib/supabase/middleware.ts`, `server.ts`, `client.ts` set cookie
`domain=.bookourspot.com` when the host ends with `.bookourspot.com`. Effect:
signing in on `www.*` = signed in on `business.*` and vice versa.

On localhost the domain attribute is omitted so cookies stay scoped to
`localhost` (or `merchant.localhost`) without extra setup.

---

## 6. Local subdomain testing (optional)

Add to `/etc/hosts`:
```
127.0.0.1 merchant.localhost
```

Then:
```bash
npm run dev
# visit http://merchant.localhost:3000 → rewrites to /dashboard
```

Chrome and Safari treat `*.localhost` as loopback by default — no hosts edit
needed on modern OS. If it doesn't resolve, the hosts line above fixes it.

---

## 7. Proxy routing cheat sheet

Defined in `src/proxy.ts`. Rewrites apply only when host is `business.*`:

| Visitor URL                              | Internally renders                  |
| ---------------------------------------- | ----------------------------------- |
| `merchant.bookourspot.com/`              | `/dashboard`                        |
| `merchant.bookourspot.com/bookings`      | `/dashboard/bookings`               |
| `merchant.bookourspot.com/services`      | `/dashboard/services`               |
| `merchant.bookourspot.com/staff`         | `/dashboard/staff`                  |
| `merchant.bookourspot.com/clients`       | `/dashboard/clients`                |
| `merchant.bookourspot.com/analytics`     | `/dashboard/analytics`              |
| `merchant.bookourspot.com/settings`      | `/dashboard/settings`               |
| `merchant.bookourspot.com/onboarding`    | `/dashboard/onboarding`             |
| `merchant.bookourspot.com/pos/:id`       | `/dashboard/pos/:id`                |
| `merchant.bookourspot.com/receipts/:id`  | `/dashboard/receipts/:id`           |
| `merchant.bookourspot.com/login`         | `/login` (merchant-branded UI)      |
| `merchant.bookourspot.com/signup`        | `/signup` (merchant-branded UI)     |
| `merchant.bookourspot.com/api/*`         | `/api/*` (shared)                   |

On `www.bookourspot.com`, merchant URLs (`/dashboard/*`) 301-redirect to the
business subdomain — merchants typing the wrong host still land correctly.

---

## 8. POS flow

```
merchant opens /dashboard/bookings
  → "Checkout" button on booked row
  → /dashboard/pos/:appointmentId
    → line items (prefilled), discount, tax, tip, payment method
    → "Complete payment" POST /api/appointments/:id/checkout
      → RPC checkout_appointment():
          * auth.uid() must own the business
          * increments businesses.receipt_counter
          * upserts transactions row (unique per appointment)
          * flips appointment.status -> completed
  → redirect /dashboard/receipts/:transactionId
    → printable receipt (window.print())
    → "WhatsApp" button shares receipt text with customer
```

Receipt numbers: `R<YYYYMMDD>-<5-digit counter>` (per business).

---

## 9. Database changes

Applied via migration `20260418_pos_and_staff_linking`:

- `transactions`: added `line_items jsonb`, `subtotal_amount`, `tax_amount`,
  `discount_amount`, `tip_amount`, `receipt_number`, `paid_at`, `notes`.
  `payment_method` expanded: `cash | card | qr_ewallet | bank_transfer | other`.
- `businesses.receipt_counter` integer default 0.
- `appointments.staff_id` nullable FK → `business_staff.id`.
- RPC `checkout_appointment()` `security definer` with `auth.uid()` check.

---

## 10. Action checklist (what you do)

- [ ] Cloudflare → add CNAME `business` → `cname.vercel-dns.com` (DNS only)
- [ ] Vercel → Domains → add `merchant.bookourspot.com`
- [ ] Supabase → Auth → add 3 new redirect URLs (see §3)
- [ ] Google Cloud → OAuth → add 3 JS origins (see §4)
- [ ] Vercel → env vars → ensure all from `docs/notifications-setup.md §7` are
      set for Production + Preview
- [ ] Deploy
- [ ] Smoke test: visit `https://merchant.bookourspot.com` → redirected to
      `/login` (merchant-branded) → sign in → land on dashboard
- [ ] Smoke test: book an appointment on `www.*` → switch tab to `business.*`
      → appointment shows up without re-login
- [ ] Run a POS checkout end-to-end → receipt renders → print preview OK

---

## 11. Merchant SaaS billing (Polar.sh) — future

Polar.sh is for charging merchants for BookOurSpot subscriptions (Starter RM0,
Growth RM79/month from `/for-business` pricing). Not for customer payments.

Follow-up plan when ready:
1. Polar dashboard → create product + price (Growth RM79/month)
2. Add `@polar-sh/sdk` to the repo
3. Create `/api/billing/checkout` → Polar `checkout.create()` → redirect
4. Polar webhook → `/api/webhooks/polar` → update `businesses.subscription_tier`
5. Gate premium features behind `subscription_tier` check
