# BookOutSpot production checklist

Updated: 23 October 2026

## Live now

- **Customer site:** `https://www.bookourspot.com` is deployed on Vercel. `/terms` and `/privacy` return successfully.
- **Authentication:** Firebase handles identity. Phone OTP is required for bookings; Google sign-in returns through the BookOutSpot domain and preserves a booking in progress. Firebase CLI deployed the callback configuration to `bookourspot-f311e`.
- **Booking data:** Supabase stores booking and payment-review records. Migrations through `20261022230000_manual_upi_review.sql` were applied and verified in the remote migration list.
- **Payments:** Manual UPI creates a pending booking and expects a customer-submitted UTR. The receiving VPA is personal (`9074417293@pthdfc`), not a merchant-acquired account; this has been rejected by all tested UPI apps per the operator. Removing merchant labels may help intent clarity, but the receiving bank/app can still reject personal account collections.
- **Admin:** `admin.bookourspot.com` currently has payment review. Event editing is being added with a protected Supabase table and server routes. This feature is not live until the new migration is applied and the Vercel deployment is updated. Firebase Authentication user accounts are listed in [Firebase Console](https://console.firebase.google.com/project/bookourspot-f311e/authentication/users).
- **Gateway cleanup:** the old YouPI Compute VM, disks, reserved IP and firewall rule are absent from the GCP project. Checkout no longer needs the gateway. A ₹400/month billing alert is configured; it is an alert, not a spending cap.
- **Live checks:** public routes returned HTTP 200; unauthenticated booking, payment-report and admin-payment API requests returned HTTP 401.

## Implemented

- [x] District-inspired, mobile-friendly event discovery with the Halloween event in the spotlight and other events marked unavailable.
- [x] Event detail pages, search, profile, tickets and booking history.
- [x] Halloween Entry at ₹1,500 and Duo at ₹2,800; all attendees provide names and phone numbers.
- [x] Firebase phone, Google and email/password sign-in options; unverified accounts cannot book. Phone OTP now uses a single autofill-friendly code field and phone sign-in no longer requires a second onboarding confirmation.
- [x] Mobile form controls use at least 16px text to prevent iOS Safari focus zoom.
- [x] UPI QR, Google Pay / PhonePe / Paytm app links and manual UTR review. UPI intent no longer labels a personal VPA as BookOutSpot or adds a merchant-style purchase note. No automated payment success is inferred from a QR, app return, SMS or screenshot.
- [ ] Apply `20261023090000_managed_events.sql` to the production Supabase project; confirm RLS and service-role-only grants.
- [ ] Deploy the current app/API to Vercel and verify admin event creation, update, publish and public feed behavior.
- [x] Customer Terms and Privacy pages linked from sign-in, checkout and the site footer.
- [x] Protected manual payment review and atomic ticket issuance on approval.
- [x] Production build and 10 booking / webhook unit tests pass.

## Must confirm before a broad public launch

- [ ] Resolve UPI collection with a merchant-enabled provider/merchant VPA before public sales. A personal VPA has been rejected by all tested apps; an updated QR cannot make a bank accept it.
- [ ] After payment collection works, perform one controlled payment and match its bank credit; approve it in admin and verify expected passes appear under the customer account. Also confirm reject, duplicate UTR and wrong-amount handling.
- [ ] Complete a real Google sign-in and phone OTP flow on iOS Safari and Android Chrome. The callback proxy returns Firebase’s handler, but an interactive OAuth/OTP run on physical devices has not been performed here.
- [ ] Confirm customer-facing Terms and Privacy with the operator’s registered legal name, postal address, and grievance/support contact. Those legal identity details were not provided, so the published pages identify BookOutSpot and the support email but call out that missing detail.
- [ ] Confirm the event organiser’s exact eligibility, cancellation/refund terms and invited-guest location communication. Current event copy says fourth-year students only, secret location, ₹1,500 solo / ₹2,800 duo.
- [ ] Verify `hello@bookourspot.com` is monitored and establish a daily bank reconciliation / refund process.
- [ ] Clean up `payments.bookourspot.com`: it now returns Cloudflare HTTP 403 after the old gateway was retired. Checkout on `www.bookourspot.com` is unaffected. Point that hostname to Vercel or remove the obsolete record in the DNS account; no Cloudflare/Namecheap API session is available in this workspace.

## Release status

The site, Firebase callback, Supabase booking workflow and manual approval portal are live. The personal-VPA collection path is currently rejected by UPI apps and is not ready for customer sales until a supported merchant collection method is configured. The event editor also awaits its database migration and deployment.
