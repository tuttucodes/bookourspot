import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SK Barbershop Cyberjaya | Redirect',
  description: 'Redirecting to the latest SK Barbershop profile page.',
  alternates: {
    canonical: '/skbarbershop',
  },
  robots: { index: false, follow: true },
  openGraph: {
    title: 'SK Barbershop Cyberjaya | BookOurSpot',
    description: 'Redirecting to the latest SK Barbershop booking page.',
    url: 'https://bookourspot.com/skbarbershop',
    type: 'website',
    images: ['/og-image.svg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SK Barbershop Cyberjaya | BookOurSpot',
    description: 'Book haircuts and grooming services online in Cyberjaya.',
    images: ['/og-image.svg'],
  },
};

export default function SKBarberLayout({ children }: { children: React.ReactNode }) {
  return children;
}
