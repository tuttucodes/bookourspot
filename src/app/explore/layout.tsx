import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Explore Local Salons, Barbershops, Spas and Car Washes',
  description:
    'Discover nearby salons, barbershops, spas, and car washes in Malaysia. Compare options and book instantly on BookOurSpot.',
  alternates: {
    canonical: '/explore',
  },
  openGraph: {
    title: 'Explore Local Services | BookOurSpot',
    description:
      'Search local beauty, wellness, and auto-care businesses and book instantly.',
    url: 'https://bookourspot.com/explore',
    type: 'website',
    images: ['/og-image.svg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Explore Local Services | BookOurSpot',
    description: 'Find and book local services in Malaysia.',
    images: ['/og-image.svg'],
  },
};

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
