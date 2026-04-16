import type { MetadataRoute } from "next";
import { createClient } from '@supabase/supabase-js';
import { getSupabasePublicConfig } from '@/lib/env';

const BASE_URL = "https://bookourspot.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const { url, anonKey } = getSupabasePublicConfig();
  const supabase = createClient(url, anonKey);

  const { data: businessPages } = await supabase
    .from('businesses')
    .select('slug, updated_at')
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(5000);

  const dynamicBusinessUrls: MetadataRoute.Sitemap = (businessPages || []).map((business) => ({
    url: `${BASE_URL}/${business.slug}`,
    lastModified: business.updated_at ? new Date(business.updated_at) : now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [
    {
      url: `${BASE_URL}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/explore`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/skbarber`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/skbarbershop`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/for-business`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...dynamicBusinessUrls,
  ];
}
