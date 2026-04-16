import { createClient } from '@supabase/supabase-js';
import { notFound, permanentRedirect } from 'next/navigation';
import { getSupabasePublicConfig } from '@/lib/env';

async function fetchBusinessSlug(id: string): Promise<string | null> {
  const { url, anonKey } = getSupabasePublicConfig();
  const supabase = createClient(url, anonKey);

  const { data } = await supabase
    .from('businesses')
    .select('slug')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  return data?.slug ?? null;
}

export default async function BusinessPageRedirect(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const slug = await fetchBusinessSlug(id);

  if (!slug) {
    notFound();
  }

  permanentRedirect(`/${slug}`);
}
