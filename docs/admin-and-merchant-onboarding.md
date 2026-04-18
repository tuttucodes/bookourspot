# Admin Platform + Merchant Onboarding (Malaysia)

```
www.bookourspot.com        -> customer UX
merchant.bookourspot.com   -> merchant UX (dashboard, POS, receipts)
admin.bookourspot.com      -> internal BookOurSpot team (apps, support, merchants)
```

---

## 1. DNS + Vercel for admin subdomain

Same as business subdomain. One CNAME, one Vercel domain:

1. **Cloudflare** → DNS → add record
   - Type: `CNAME` · Name: `admin` · Target: `cname.vercel-dns.com` · Proxy status: **DNS only**
2. **Vercel** → project → Settings → Domains → **Add** `admin.bookourspot.com`

Verify:
```bash
dig admin.bookourspot.com CNAME +short   # -> cname.vercel-dns.com.
```

---

## 2. Supabase Auth redirect URLs

Already covered by `docs/subdomain-setup.md §3` — same additions:
```
https://admin.bookourspot.com/auth/callback
http://admin.localhost:3000/auth/callback
```

---

## 3. Granting admin role

Admins are **not** created through the UI. Do it via SQL in the Supabase
dashboard (or Supabase MCP) after the user has signed up at least once.

```sql
-- Promote an existing user to admin
update public.users
  set role = 'admin',
      updated_at = now()
  where email = 'raybkmedia@gmail.com';

-- Or superadmin (full access, same as admin for now; reserved for future policy splits)
update public.users set role = 'superadmin' where email = 'someone@bookourspot.com';
```

Revoke:
```sql
update public.users set role = 'customer' where email = '...';
```

No auth token refresh needed — the admin layout re-reads the role on every
server render.

---

## 4. Admin platform tour

| URL | What                                                          |
| --- | ------------------------------------------------------------- |
| `admin.bookourspot.com/`             | Overview — pending apps, open tickets, merchants, customers, 7d revenue |
| `admin.bookourspot.com/applications` | Merchant application queue (approve/reject)                   |
| `admin.bookourspot.com/applications/:id` | Full application detail with SSM/NRIC last-4, approve/reject with reason |
| `admin.bookourspot.com/merchants`    | All merchants + verification status                           |
| `admin.bookourspot.com/customers`    | Recent 200 customers                                          |
| `admin.bookourspot.com/support`      | Support query inbox (customer + merchant + guest)             |
| `admin.bookourspot.com/support/:id`  | Thread + reply + status change                                |

Proxy rewrites these to `/admin/*` internally (see `src/proxy.ts`).

---

## 5. Merchant application flow (public)

```
Visitor on merchant.bookourspot.com
  └─ Sign up (Google or email) with role=merchant
       └─ /merchant-apply (also: business.*/apply via proxy)
             4-step wizard:
               1. Owner: full name, NRIC/passport (hashed), MY mobile
               2. Business: legal name, trading name, business type (Sole prop / Sdn Bhd / LLP / Other),
                             SSM reg number (new 12-digit or legacy), category
               3. Location: address, city, state (MY states dropdown), postcode,
                             optional SST number + council licence
               4. Review + submit
             POST /api/merchant/apply
               ├─ Inserts merchant_applications row (status=submitted)
               ├─ Sets users.role = pending_merchant
               └─ Blocks duplicate SSM numbers platform-wide
  └─ Redirected to /pending-review ("application under review")
  └─ Middleware sends any /dashboard/* hits to /pending-review until approved
Admin approves at admin.bookourspot.com/applications/:id
  └─ RPC approve_merchant_application() atomically:
       * creates public.businesses row (verification_status=approved)
       * flips users.role = merchant
       * marks application approved
  └─ Merchant can now sign in and access /dashboard/*
```

Rejection path:
- Admin provides 10+ char reason → RPC `reject_merchant_application()` sets
  status=rejected, stores reason, flips role back to customer so they can
  re-apply with corrections.

---

## 6. Malaysia legitimacy fields captured

**Must-have (form blocks signup):**
- `owner_name` — full name
- `owner_id_type` — `nric` | `passport`
- `owner_id_number` — stored as SHA-256(id + OTP_PEPPER); only last 4 kept
- `owner_phone` — normalized to E.164 `+60…`
- `business_legal_name` — as per SSM
- `business_trading_name` — brand (optional, defaults to legal name)
- `business_type` — sole_prop / sdn_bhd / llp / other
- `primary_reg_number` — SSM (new `^\d{12}$` OR legacy `^\d{6,7}-[A-Z]$` OR
  `^[A-Z]{2}\d{7}-[A-Z]$` OR `^LLP\d{7}-[A-Z]{3}$`)
- `category` — salon / barbershop / spa / car_wash / other
- `address`, `postcode` (5 digits), `state` (dropdown of 16 MY states)

**Optional (can add later, doesn't block):**
- `sst_number` — only required above RM 500k turnover
- `council_licence_authority` — DBKL, MBPJ, MBSA, etc.
- `council_licence_number`
- `council_licence_expiry`

**Stored but not collected at signup** (admin / future tier-up):
- SSM certificate PDF upload
- Council licence PDF upload
- Bank details (collected at payout activation, not now)
- Halal cert (optional)
- LHDN tax file number (will be required for e-invoicing)

Validators live in `src/lib/my-validators.ts`. Extending to another country =
add a new validator module + a `country` case in `/api/merchant/apply`.

---

## 7. Support system

**Submit** (public form):
- `/support` page, `POST /api/support/submit`
- Authenticated users → `submitter_id` linked; `submitter_role` = merchant or customer
- Guests → provide at least email OR phone (enforced server-side)

**Admin inbox**:
- `/admin/support` — filtered tabs (open / resolved / closed / all)
- Thread UI with status cycle: open → in_progress → resolved → closed
- First admin reply auto-bumps open → in_progress and assigns the thread

**User visibility**:
- Customers/merchants see their own queries on `/support` page (last 20)
- RLS enforces `submitter_id = auth.uid()` for thread reads

---

## 8. SK Barbershop merchant seed (done)

Auth user: `rahulbabuk05@gmail.com`
Password: **`Book@123`** (bcrypt-hashed in `auth.users`, not in repo)
Business id: `22d7ab2b-81d6-4aa9-b79d-adbe9addc8f7`
Slug: `sk-barbershop` · verification_status: `approved`
Services seeded: Haircut (RM 25), Beard Trim (RM 15), Haircut + Beard (RM 35),
  Hot Towel Shave (RM 30), Student Cut (RM 20)

**Log in**:
```
https://merchant.bookourspot.com/login
  email: rahulbabuk05@gmail.com
  password: Book@123
```

Google OAuth also works — any Google account email that matches a merchant
user (or can be promoted via SQL) signs in the same way.

**Rotate the password** (recommended after first login):
```sql
-- Run in Supabase SQL editor
update auth.users
  set encrypted_password = crypt('NEW_STRONG_PASSWORD', gen_salt('bf')),
      updated_at = now()
  where email = 'rahulbabuk05@gmail.com';
```
Or let the user change it from their profile (Supabase's own reset flow — send
password reset email via the /login page).

---

## 9. Database reference

New tables:
- `public.merchant_applications` — staging area for pending merchants; RLS
  allows applicant to read own + admins to read/write all
- `public.support_queries` + `public.support_query_messages` — threaded inbox
- `public.email_suppressions`, `public.notification_logs`, `public.otp_codes`
  (from earlier notifications migration)

Extended tables:
- `public.users.role` — now `customer | merchant | pending_merchant | admin | superadmin`
- `public.users.phone_verified`, `phone_verified_at` — set by OTP verify
- `public.businesses` — added `country`, `legal_name`, `trading_name`,
  `primary_reg_number`, `business_type`, `owner_id_type`, `owner_id_last4`,
  `owner_id_hash`, `registration_details jsonb`, `verification_status`,
  `verified_at`, `verified_by`, `receipt_counter`
- `public.appointments.staff_id` — optional FK to `business_staff`
- `public.transactions` — `line_items`, `subtotal_amount`, `tax_amount`,
  `discount_amount`, `tip_amount`, `receipt_number`, `paid_at`, `notes`

RPCs:
- `approve_merchant_application(p_application_id uuid)` → creates business,
  flips user role
- `reject_merchant_application(p_application_id uuid, p_reason text)`
- `checkout_appointment(...)` → POS checkout (atomic)

All RPCs use `security definer` + `auth.uid()` role check. All tables have RLS.

---

## 10. Action checklist

- [ ] Cloudflare: add CNAME `admin` → `cname.vercel-dns.com` (DNS only)
- [ ] Vercel: add domain `admin.bookourspot.com`
- [ ] Supabase Auth URL Configuration: add `https://admin.bookourspot.com/auth/callback` to Redirect URLs
- [ ] Google Cloud OAuth: add `https://admin.bookourspot.com` to Authorized JS origins
- [ ] Promote at least one admin via SQL:
  ```sql
  update public.users set role = 'admin' where email = 'your@email.com';
  ```
- [ ] Smoke test: `admin.bookourspot.com` → redirects to /login (if not signed in) → sign in with promoted user → land on admin overview
- [ ] Smoke test: fresh Gmail → `merchant.bookourspot.com/signup` → Google sign-in → /merchant-apply → submit → /pending-review
- [ ] In admin inbox: see pending app → open → approve → verify public.businesses row created
- [ ] SK Barbershop: log in at `merchant.bookourspot.com` with `rahulbabuk05@gmail.com / Book@123` → dashboard works, POS works
- [ ] Change SK Barbershop password from default (see §8)

---

## 11. Future hardening (not in this shipment)

- Document uploads (SSM cert PDF, council licence scan) via Supabase Storage
  + signed URLs
- NRIC OCR / auto-check via vendor (MyDigital ID API when GA)
- Automated SSM e-Info lookup for name-vs-reg-number match (paid API)
- Sanctions / watchlist screening
- 2FA enforcement for admin accounts (Supabase MFA)
- Audit log table (`admin_audit_log`) for every approve/reject/reply action
- Webhook to alert on new applications (Slack / email via existing Resend infra)
