# BookOutSpot

BookOutSpot is a mobile-first events discovery and ticket booking app built with React, Vite, Firebase Authentication, Supabase Postgres, Vercel Functions, and the self-hosted YouPI UPI checkout.

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
YOUPI_MERCHANT_KEY=
YOUPI_WEBHOOK_SECRET=
YOUPI_CHECKOUT_SCRIPT_URL=https://payments.bookourspot.com/youpi.js
```

Never place Firebase service-account JSON, the Supabase service-role key, or the YouPI webhook secret in a `VITE_` variable or browser code. Configure the receiving VPA only in the YouPI merchant setup, and verify the bank account holder there. Customer-facing checkout says **Payments by BookOutSpot**.

Firebase Authentication must have Email/Password, Google and Phone enabled. Authorized domains must include `bookourspot.com` and `www.bookourspot.com`. For Google, set the correct support email and OAuth branding in Firebase Console. Phone sign-in uses reCAPTCHA and must be exercised on the deployed hostname.

## Database and gateway

Apply the current [`supabase/schema.sql`](supabase/schema.sql) in the intended Supabase project before using booking and ticket APIs. It upgrades the prior solo-only schema and renames the legacy payment columns without deleting existing booking data. The Vercel API validates Firebase ID tokens and keeps booking reads scoped to the signed-in Firebase UID.

The checkout API accepts the Halloween Entry option at ₹1,500 per guest or Couple / Duo at ₹2,800 per two guests. It computes the amount on the server, stores attendee records in Supabase, and only issues passes after a signed YouPI webhook is validated. The verified UTR is stored for transaction reconciliation. Other events are browseable but cannot be purchased.

YouPI is a separate, persistent self-hosted gateway. It must be deployed at `payments.bookourspot.com`, configured with the merchant receiving account, and set to send its signed success webhook to `https://www.bookourspot.com/api/youpi/webhook`. The script and webhook must use the same merchant configuration and webhook secret. Production checkout stays unavailable until these external settings are supplied.

## Production checklist

See [`LAUNCH_CHECKLIST.md`](LAUNCH_CHECKLIST.md) for status, remaining account setup, manual purchase verification, and launch gates.

## Build

```sh
npm run build
```
