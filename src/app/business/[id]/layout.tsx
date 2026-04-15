import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getSupabasePublicConfig } from '@/lib/env';

const SITE_URL = 'https://bookourspot.com';

type BusinessRow = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  location: string | null;
  updated_at: string;
  is_active: boolean;
};

async function fetchBusiness(id: string): Promise<BusinessRow | null> {
  const { url, anonKey } = getSupabasePublicConfig();
  const supabase = createClient(url, anonKey);

  const { data } = await supabase
    .from('businesses')
    .select('id, name, description, category, location, updated_at, is_active')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  return (data as BusinessRow | null) ?? null;
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const business = await fetchBusiness(id);
  const canonical = `${SITE_URL}/business/${id}`;

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

  return {
    title: `${business.name} | Book Appointment`,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${business.name} | Book Appointment`,
      description,
      url: canonical,
      type: 'website',
      images: ['/og-image.svg'],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${business.name} | Book Appointment`,
      description,
      images: ['/og-image.svg'],
    },
  };
}

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
