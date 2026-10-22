# BookOutSpot

An events discovery and ticket booking web app, built with React, Vite, Firebase Authentication, Supabase Postgres, Vercel Functions, and Razorpay Checkout.

## Run locally

```sh
npm install
npm run dev -- --host 127.0.0.1
```

Open <http://127.0.0.1:5173/>.

## Environment setup

Client environment (`.env.local`):

```env
VITE_FIREBASE_API_KEY=YOUR_FIREBASE_WEB_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=bookourspot-f311e.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=bookourspot-f311e
VITE_FIREBASE_STORAGE_BUCKET=YOUR_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_FIREBASE_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_FIREBASE_WEB_APP_ID
```

Vercel server environment:

```env
FIREBASE_PROJECT_ID=bookourspot-f311e
FIREBASE_SERVICE_ACCOUNT_JSON={...server-only service account JSON...}
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_SERVICE_ROLE_KEY
RAZORPAY_KEY_ID=YOUR_RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET=YOUR_RAZORPAY_WEBHOOK_SECRET
```

Never add `FIREBASE_SERVICE_ACCOUNT_JSON`, `SUPABASE_SERVICE_ROLE_KEY`, or Razorpay secrets to a `VITE_` variable or browser code. In Google Cloud runtimes with Application Default Credentials configured, `FIREBASE_SERVICE_ACCOUNT_JSON` may be omitted.

Enable Email/Password, Google, and Phone providers in Firebase Authentication. Add `localhost` and the production hostname to Firebase Authentication's authorized domains, and configure reCAPTCHA/SMS settings for phone sign-in. For Vercel, create a dedicated Firebase service account with Firebase Authentication verification permissions and set its JSON as the server-only `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable. The API verifies Firebase ID tokens and uses the Firebase UID as the Supabase booking owner key.

Apply [`supabase/schema.sql`](supabase/schema.sql) before enabling paid checkout. It stores Firebase UIDs as text in user-owned booking records and server-issued ticket references, with browser RLS access revoked. Existing UUID owner IDs are migrated to their text representation and their Supabase Auth foreign key is removed. The Vercel functions verify Firebase ID tokens, create Razorpay orders, verify captured payments, fulfill tickets idempotently, and provide authenticated booking history.

## Booking availability

Only “A little Halloween affair” is currently configured for checkout at ₹1,500 per person. Other listed events are visible with booking unavailable until their organisers, dates, prices, terms, and inventory are confirmed.

## Build

```sh
npm run build
```
