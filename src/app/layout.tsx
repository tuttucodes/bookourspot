import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const siteUrl = "https://bookourspot.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "BookOurSpot | Instant Appointment Booking in Malaysia",
    template: "%s | BookOurSpot",
  },
  description:
    "Discover and book appointments with top salons, barbershops, spas and car washes across Malaysia.",
  keywords: [
    "book salon appointment",
    "barbershop booking malaysia",
    "spa booking",
    "car wash booking",
    "BookOurSpot",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "BookOurSpot",
    title: "BookOurSpot | Instant Appointment Booking in Malaysia",
    description:
      "Find trusted local salons, barbershops, spas and car washes. Compare options and book in seconds.",
    locale: "en_MY",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "BookOurSpot - Book local services instantly",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BookOurSpot | Instant Appointment Booking in Malaysia",
    description: "Find and book local services with live availability.",
    images: ["/og-image.svg"],
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#7c3aed",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.className} h-full`}>
      <body className="min-h-full bg-gray-50">
        <main className="max-w-lg mx-auto bg-white min-h-screen relative">
          {children}
        </main>
      </body>
    </html>
  );
}
