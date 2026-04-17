import { createClient } from '@supabase/supabase-js';
import { notFound, redirect } from 'next/navigation';
import { getSupabasePublicConfig } from '@/lib/env';

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BookBySlugPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const { url, anonKey } = getSupabasePublicConfig();
  const supabase = createClient(url, anonKey);

  const { data } = await supabase
    .from('businesses')
    .select('id')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (!data?.id) {
    notFound();
  }

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      value.forEach((v) => query.append(key, v));
    } else {
      query.set(key, value);
    }
  }
  const qs = query.toString();
  redirect(`/business/${data.id}/book${qs ? `?${qs}` : ''}`);
}
