import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SK Barbershop Cyberjaya | Book Haircuts Online',
  description:
    'Book your SK Barbershop appointment in Cyberjaya. View services, reviews, availability, and confirm your slot instantly.',
  alternates: {
    canonical: '/skbarber',
  },
  openGraph: {
    title: 'SK Barbershop Cyberjaya | BookOurSpot',
    description:
      'Book SK Barbershop appointments online with instant confirmation on BookOurSpot.',
    url: 'https://bookourspot.com/skbarber',
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
