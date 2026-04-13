import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BookOurSpot — Book Appointments Instantly",
  description: "Malaysia's booking platform for salons, barbershops, car wash & more. Book appointments in seconds.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
