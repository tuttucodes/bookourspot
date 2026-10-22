# BookOutSpot launch checklist

Status date: 22 October 2026. “Done” below refers to the current repository or verified account configuration; it does not imply that the current uncommitted code is deployed.

## Done in the current code

- [x] District-inspired, mobile-first event discovery with the supplied Halloween poster as the spotlight.
- [x] Every event opens its own shareable detail route; non-Halloween events say bookings are unavailable.
- [x] Halloween Entry: ₹1,500 for one guest.
- [x] Halloween Couple / Duo: ₹2,800 for two guests; both attendee names and phone numbers are required, and two passes are issued after confirmation.
- [x] Firebase sign-in UI supports phone OTP, email/password and Google.
- [x] Profile name editing writes to Firebase Auth; paid ticket history is read from owner-scoped Supabase API.
- [x] Checkout amount is set server-side; customer browser callbacks cannot issue tickets.
- [x] YouPI webhook handler validates its HMAC signature, event delivery metadata, UTR, order, amount and booking state before idempotent pass fulfillment.
- [x] Verified UTR is stored once with the paid booking for reconciliation; repeated delivery is idempotent.
- [x] Search, tickets and login overlays have been refreshed with responsive glass sheets, dialog semantics, keyboard close, and honest booking status.
- [x] Old Razorpay API routes have been removed; internal booking columns now use provider-neutral gateway names.
- [x] Vercel Production now has `FIREBASE_PROJECT_ID=bookourspot-f311e` so Firebase Admin can initialize.
- [x] Design assumptions and the remaining go-live items are documented in `DESIGN.md` and this checklist.

## Still required before accepting customer money

- [ ] **Choose a payment risk posture.** YouPI's own maintainers describe the project as experimental and not certified, bank/NPCI-approved, audited or production-ready. It relies on bank-alert observers and needs manual reconciliation. The conservative option for launch is a bank/acquirer-approved payment provider. If YouPI remains the choice, get independent security and compliance review and confirm your bank permits this receiving-account use.
- [ ] Deploy YouPI's persistent services and observer infrastructure. The static Vercel app does not host YouPI. Verify that `https://payments.bookourspot.com/youpi.js` serves the correct production merchant script.
- [ ] Configure the YouPI merchant receiving VPA as `9074417293@pthdfc` in its merchant panel, verify the account-holder name, and ensure proceeds settle directly to your account.
- [ ] Set Vercel Production `YOUPI_MERCHANT_KEY`, `YOUPI_WEBHOOK_SECRET` and `YOUPI_CHECKOUT_SCRIPT_URL`. Keep the webhook secret server-only.
- [ ] Configure the YouPI success webhook to `https://www.bookourspot.com/api/youpi/webhook`; verify its webhook secret and signature version match the code.
- [x] Applied `supabase/schema.sql` to the linked Supabase project; verified `bookings` and `booking_tickets` have RLS enabled, no anon/authenticated grants, all four `bos_*` RPCs exist and are restricted to `service_role`, and database advisors report no issues. Registered the applied schema as baseline migration `20261022194000` and committed the matching file under `supabase/migrations/` for reproducibility.
- [x] Confirmed Vercel Production has `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `FIREBASE_SERVICE_ACCOUNT_JSON`, and `FIREBASE_PROJECT_ID` (values were checked by name without exposing secrets).
- [ ] Confirm Firebase Authentication Email/Password, Google and Phone providers; test sign-in on `www.bookourspot.com`, including Google's authorized domain/OAuth settings and phone reCAPTCHA/SMS.
- [x] Build and deploy the current source to Vercel Production. Latest deployment `dpl_B42TVca9q6qH4mqhZJaymjt9RkTQ` is Ready and aliases `bookourspot.com` and `www.bookourspot.com` are attached. Node 24 is pinned; Vercel `NODE_OPTIONS=--experimental-require-module` is set in Production to allow its Node helper runtime to load Firebase Admin’s `jose` dependency. Verified live pages `/`, `/events`, `/events/halloween-affair` return HTTP 200; unauthenticated `/api/bookings` and `/api/youpi/status` return expected HTTP 401 instead of 500.
- [ ] Complete a low-value controlled payment after YouPI is configured: solo and duo, webhook success, delayed/retried webhook, duplicate delivery, wrong amount, user booking history, pass download, and bank statement reconciliation. Check the received money in the destination bank account; a UI success state is not proof of settlement.
- [ ] Add a real customer support contact and publish reviewed Terms, Privacy, cancellation/refund, event eligibility, and organiser/location disclosure before opening ticket sales.
- [ ] Enforce the Halloween event’s fourth-year-only admission rule before payment or at an organiser-controlled check-in; the current UI discloses it, but does not validate student status.
- [ ] Move door check-in/admission from local-only storage to a server-authoritative, organizer-authenticated endpoint before using it at the venue. Current gate operations do not sync between devices.
- [ ] Set up account recovery (password reset, email verification, and provider linking as appropriate) and verify the profile/pass account flow across a second device.

## Cost and operations

- [x] Existing BookOutSpot monthly Google Cloud billing alert was updated from ₹300 to ₹400. Alerts remain at 50%, 90% and 100% of current spend. A budget sends alerts; it is not a spend cap, and there are no Pub/Sub notifications configured.
- [ ] Keep any YouPI hosting plan within the ₹400/month target and validate actual GST/region pricing before provisioning. No persistent gateway resources have been created.
- [ ] Configure monitoring, backups for the YouPI database, alert delivery, webhook retry/replay review, refund/dispute handling, and an auditable daily reconciliation process.
- [ ] Add image optimization, production error monitoring, privacy/consent review, and an accessibility pass on real iOS/Android devices.

## Release gates

1. Booking schema and required Firebase/Supabase environment values are verified. YouPI production environment values remain absent; checkout must stay closed until its merchant script, key, webhook secret, and endpoint are deployed and verified.
2. Gateway host and webhook signature validated against a real, low-value transaction and destination bank statement.
3. Solo and Duo create exactly one booking and the correct number of valid passes; retries never double-issue.
4. Auth, search, event details, tickets and profile are checked on 320px mobile, iPhone Safari and desktop.
5. Customer support and reviewed legal/refund terms are visible before checkout.
6. Current source is deployed and both custom domains respond over HTTPS; repeat a browser check after final auth/schema/gateway configuration. A live POST to `/api/youpi/create-order` currently returns HTTP 503 by design because YouPI merchant configuration is not present.
