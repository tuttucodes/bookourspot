export function getSupabasePublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env.local.'
    );
  }
  return { url, anonKey };
}

/** Canonical site URL for OAuth redirectTo (must match Supabase Redirect URLs). No trailing slash. */
export function getPublicSiteUrl(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (!raw) return undefined;
  return raw.replace(/\/$/, '');
}
