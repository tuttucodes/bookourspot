import { createBrowserClient } from '@supabase/ssr';
import { getSupabasePublicConfig } from '@/lib/env';

const COOKIE_PARENT_DOMAIN = '.bookourspot.com';

function computeCookieOptions() {
  if (typeof window === 'undefined') return undefined;
  const host = window.location.hostname.toLowerCase();
  if (host.endsWith('.bookourspot.com') || host === 'bookourspot.com') {
    return { domain: COOKIE_PARENT_DOMAIN };
  }
  return undefined;
}

export function createClient() {
  const { url, anonKey } = getSupabasePublicConfig();
  const cookieOptions = computeCookieOptions();
  return createBrowserClient(url, anonKey, {
    ...(cookieOptions ? { cookieOptions } : {}),
  });
}
