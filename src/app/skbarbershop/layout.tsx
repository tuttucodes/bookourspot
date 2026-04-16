import type { Metadata } from 'next';

const title = 'SK Barbershop Cyberjaya, Malaysia | Book Appointment Online';
const description =
  'Book appointments at SK Barbershop in Cyberjaya, Selangor. View prices, services, opening hours, directions, and contact details for quick and affordable grooming.';
const canonicalPath = '/skbarbershop';
const canonicalUrl = `https://bookourspot.com${canonicalPath}`;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: canonicalPath,
  },
  keywords: [
    'barbershop cyberjaya',
    'cheap haircut cyberjaya',
    'fade haircut cyberjaya',
    'men grooming cyberjaya',
    'SK Barbershop Cyberjaya',
    'barber cyberjaya malaysia',
  ],
  openGraph: {
    title,
    description,
    url: canonicalUrl,
    type: 'website',
    locale: 'en_MY',
    images: ['/og-image.svg'],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/og-image.svg'],
  },
};

export default function SKBarbershopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
