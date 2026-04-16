import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getSupabasePublicConfig } from '@/lib/env';
import { SK_BARBERSHOP_IMAGES } from '@/lib/sk-barbershop';

const SITE_URL = 'https://bookourspot.com';

type BusinessRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  location: string | null;
  updated_at: string;
  is_active: boolean;
};

async function fetchBusiness(slug: string): Promise<BusinessRow | null> {
  const { url, anonKey } = getSupabasePublicConfig();
  const supabase = createClient(url, anonKey);

  const { data } = await supabase
    .from('businesses')
    .select('id, slug, name, description, category, location, updated_at, is_active')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  return (data as BusinessRow | null) ?? null;
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const business = await fetchBusiness(slug);
  const canonical = `${SITE_URL}/${slug}`;

  if (!business) {
    return {
      title: 'Business Not Found',
      description: 'This business page is not available.',
      alternates: { canonical },
      robots: { index: false, follow: false },
    };
  }

  const description =
    business.description ||
    `Book ${business.category.replace('_', ' ')} appointments at ${business.name}${business.location ? ` in ${business.location}` : ''} with BookOurSpot.`;
  const isSkBarbershop = business.slug === 'skbarbershop';
  const socialImages = isSkBarbershop
    ? [
        {
          url: SK_BARBERSHOP_IMAGES.card,
          alt: 'SK Barbershop storefront in Cyberjaya',
        },
      ]
    : ['/og-image.svg'];

  return {
    title: `${business.name} | Book Appointment`,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${business.name} | Book Appointment`,
      description,
      url: canonical,
      type: 'website',
      images: socialImages,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${business.name} | Book Appointment`,
      description,
      images: isSkBarbershop ? [SK_BARBERSHOP_IMAGES.card] : ['/og-image.svg'],
    },
  };
}

export default function BusinessSlugLayout({ children }: { children: React.ReactNode }) {
  return children;
}
