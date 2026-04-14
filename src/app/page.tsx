import type { Metadata } from 'next';
import HomePageClient from '@/components/home/HomePageClient';

const SITE_URL = 'https://bookourspot.com';

export const metadata: Metadata = {
  title: 'BookOurSpot | Book Salons, Barbershops, Spas & Car Washes in Malaysia',
  description:
    'Book appointments instantly with trusted salons, barbershops, spas and car washes across Malaysia. Compare ratings, discover nearby businesses, and reserve your slot online.',
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    title: 'BookOurSpot | Book Salons, Barbershops, Spas & Car Washes',
    description:
      'Find and book top-rated local services with live availability on BookOurSpot.',
    siteName: 'BookOurSpot',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BookOurSpot | Instant Appointment Booking',
    description: 'Discover and book beauty and wellness services nearby.',
  },
};

export default function HomePage() {
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'BookOurSpot',
    url: SITE_URL,
    description:
      'Book appointments instantly with trusted salons, barbershops, spas and car washes across Malaysia.',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/explore?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
    inLanguage: 'en-MY',
  };

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'BookOurSpot',
    url: SITE_URL,
    sameAs: [],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <HomePageClient />
    </>
  );
}
