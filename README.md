# BookOurSpot (`bookourspot.com`)

> Discover & book exclusive access to curated social meetups, secret nightlife, dining pop-ups, and festivals in Chennai.

![BookOurSpot Banner](/halloween-affair.jpg)

## Features

- **Editorial Event Directory**: Curated social experiences, house salons, festivals, and dining pop-ups.
- **Direct Multi-Tier Booking**: Fluid ticket tier allocation with quantity steppers and real-time capacity counter.
- **Guest Credential Binding**: Strict non-transferable admission bound to individual legal attendee names and WhatsApp contact details.
- **Signature Mixology Pairing**: Integrated craft cocktail add-on allocation with instant order summary updates.
- **Dynamic UPI Payment Flow**: Direct merchant UPI QR generation with encrypted reference payload and strict 12-digit Indian banking UTR reference verification.
- **Digital Pass Wallet**: Perforated ticket stubs with unique entry QR codes, barcodes, and guest credentials.
- **Apple Wallet & Google Wallet Integration**: Native pass generation with Chennai geofencing coordinates (`12.9815°N, 80.2520°E`) for automated lockscreen venue arrival alerts.
- **Door Host Security Hub**: In-app optical camera QR scanner with real-time gate check-in, duplicate pass prevention, haptic feedback, and audio chimes.
- **Offline High-Res PDF Tickets**: 1-click downloadable printable passes with optical security elements.

## Tech Stack

- **Framework**: React 19 + Vite 8
- **Styling**: Tailwind CSS
- **Icons**: Phosphor Icons (`@phosphor-icons/react`)
- **Pass Security & QR**: `qrcode`, `html5-qrcode`
- **PDF Generation**: `jspdf`, `html2canvas`
- **Audio & Haptics**: Native Web Audio API synthesis + `navigator.vibrate`
- **Backend / Cloud**: Supabase Client (`@supabase/supabase-js`) with local persistence failover

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Local Development Server

```bash
npm run dev
```

Open [http://localhost:5173/](http://localhost:5173/) to explore.

### 3. Production Build

```bash
npm run build
```

## Deployment

Deployable to Vercel, Netlify, or any static hosting platform. Includes optimized `vercel.json` SPA routing rewrites and security headers.
