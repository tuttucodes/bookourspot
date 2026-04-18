import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import { getSupabasePublicConfig } from '@/lib/env';

const COOKIE_PARENT_DOMAIN = '.bookourspot.com';

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const host = headerStore.get('host')?.toLowerCase() ?? '';
  const scopeToParent = host.endsWith('.bookourspot.com') || host === 'bookourspot.com';
  const { url, anonKey } = getSupabasePublicConfig();

  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              const finalOptions = scopeToParent
                ? { ...options, domain: COOKIE_PARENT_DOMAIN }
                : options;
              cookieStore.set(name, value, finalOptions);
            });
          } catch {
            // Called from Server Component — ignore
          }
        },
      },
    }
  );
}
