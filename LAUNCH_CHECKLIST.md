# BookOutSpot production checklist

Updated: 22 October 2026

## Live now

- **Customer site:** `https://www.bookourspot.com` is deployed on Vercel. `/terms` and `/privacy` return successfully.
- **Authentication:** Firebase handles identity. Phone OTP is required for bookings; Google sign-in returns through the BookOutSpot domain and preserves a booking in progress. Firebase CLI deployed the callback configuration to `bookourspot-f311e`.
- **Booking data:** Supabase stores booking and payment-review records. Migrations through `20261022230000_manual_upi_review.sql` were applied and verified in the remote migration list.
- **Payments:** UPI QR and app links create a pending booking. The customer submits the UTR; the owner matches the bank statement in `https://admin.bookourspot.com` and approves to issue passes. The screen does not show or copy the merchant VPA.
- **Admin:** `admin.bookourspot.com` is live. Payment approvals require the allowlisted owner email, verified phone and an explicit bank-check confirmation. Firebase Authentication user accounts are listed in [Firebase Console](https://console.firebase.google.com/project/bookourspot-f311e/authentication/users); the admin portal has a shortcut to that list.
- **Gateway cleanup:** the old YouPI Compute VM, disks, reserved IP and firewall rule are absent from the GCP project. Checkout no longer needs the gateway. A ₹400/month billing alert is configured; it is an alert, not a spending cap.
- **Live checks:** public routes returned HTTP 200; unauthenticated booking, payment-report and admin-payment API requests returned HTTP 401.

## Implemented

- [x] District-inspired, mobile-friendly event discovery with the Halloween event in the spotlight and other events marked unavailable.
- [x] Event detail pages, search, profile, tickets and booking history.
- [x] Halloween Entry at ₹1,500 and Duo at ₹2,800; all attendees provide names and phone numbers.
- [x] Firebase phone, Google and email/password sign-in options; unverified accounts cannot book.
- [x] Mobile form controls use at least 16px text to prevent iOS Safari focus zoom.
- [x] UPI QR, Google Pay / PhonePe / Paytm app links and manual UTR review. No automated payment success is inferred from a QR, app return, SMS or screenshot.
- [x] Customer Terms and Privacy pages linked from sign-in, checkout and the site footer.
- [x] Protected manual payment review and atomic ticket issuance on approval.
- [x] Production build and 10 booking / webhook unit tests pass.

## Must confirm before a broad public launch

- [ ] Perform one controlled UPI payment and match its actual bank credit; approve it in admin and verify the expected passes appear under the customer account. Also confirm reject, duplicate UTR and wrong-amount handling.
- [ ] Complete a real Google sign-in and phone OTP flow on iOS Safari and Android Chrome. The callback proxy returns Firebase’s handler, but an interactive OAuth/OTP run on physical devices has not been performed here.
- [ ] Confirm customer-facing Terms and Privacy with the operator’s registered legal name, postal address, and grievance/support contact. Those legal identity details were not provided, so the published pages identify BookOutSpot and the support email but call out that missing detail.
- [ ] Confirm the event organiser’s exact eligibility, cancellation/refund terms and invited-guest location communication. Current event copy says fourth-year students only, secret location, ₹1,500 solo / ₹2,800 duo.
- [ ] Verify `hello@bookourspot.com` is monitored and establish a daily bank reconciliation / refund process.
- [ ] Check the Namecheap DNS record for `payments.bookourspot.com`; the customer site no longer uses it. It was not changed because DNS target ownership was not independently verified.

## Release status

The site, Firebase callback, Supabase booking workflow and manual approval portal are live. Test registrations can be accepted; the owner must manually reconcile every UPI transfer. For a confident wide launch, first complete the controlled payment and real-device authentication checks above and fill the legal operator details.
