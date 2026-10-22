# BookOutSpot

BookOutSpot is a mobile-first events discovery and ticket booking app built with React, Vite, Firebase Authentication, Supabase Postgres, and Vercel Functions.

## Run locally

```sh
npm install
npm run dev -- --host 127.0.0.1
```

Open the local URL printed by Vite (currently `http://127.0.0.1:5175/`).

## Environment setup

Client values belong in `.env.local` and use the Firebase Web app configuration from project `bookourspot-f311e`:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=bookourspot-f311e.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=bookourspot-f311e
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

The production Vercel project also needs these server-only variables:

```env
FIREBASE_PROJECT_ID=bookourspot-f311e
FIREBASE_SERVICE_ACCOUNT_JSON=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
BOOKOUTSPOT_UPI_VPA=9074417293@pthdfc
BOOKOUTSPOT_UPI_PAYEE_NAME=Rahul Babu
```

Never place Firebase service-account JSON or the Supabase service-role key in a `VITE_` variable or browser code. The manual checkout creates a personal UPI transfer to the configured payee; it does not represent a merchant-acquired/verified payment. The owner checks the credit and submitted UTR before approving passes.

Firebase Authentication must have Email/Password, Google and Phone enabled. Authorized domains must include `bookourspot.com` and `www.bookourspot.com`. For Google, set the correct support email and OAuth branding in Firebase Console. Phone sign-in uses reCAPTCHA and must be exercised on the deployed hostname.

## Database and gateway

Apply the ordered migrations in [`supabase/migrations`](supabase/migrations) to the intended Supabase project before using the admin event editor. The Vercel API validates Firebase ID tokens and keeps booking reads scoped to the signed-in Firebase UID. New event records are private to server-side admin APIs; the public event feed returns only published content.

The checkout API accepts Halloween Entry at ₹1,500 per guest or Couple / Duo at ₹2,800 per two guests. It recomputes the amount on the server, stores attendee records in Supabase, and leaves the booking pending until an administrator confirms the UTR and matching bank credit. UPI intent/QR is not proof of payment. The admin event editor can publish event details, but newly created events remain non-bookable until their pricing and inventory are connected to checkout.

Payments currently go directly to a personal UPI VPA, so UPI apps or the receiving bank may reject the transfer or classify it as suspicious. Removing merchant-style labels cannot override bank risk controls. For reliable public sales, onboard a payment provider with a merchant account and settlement to the business bank account.

## Production checklist

See [`LAUNCH_CHECKLIST.md`](LAUNCH_CHECKLIST.md) for status, remaining account setup, manual purchase verification, and launch gates.

## Build

```sh
npm run build
```
