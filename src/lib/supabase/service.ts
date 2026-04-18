import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getServerSupabaseServiceConfig } from '@/lib/env.server';

let cached: SupabaseClient | null = null;

/**
 * Service-role Supabase client. Bypasses RLS — only call from trusted server code
 * (API routes, cron, webhooks). Never expose to the browser.
 */
export function getServiceSupabaseClient(): SupabaseClient {
  if (cached) return cached;
  const { url, serviceRoleKey } = getServerSupabaseServiceConfig();
  cached = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: { 'X-Client-Info': 'bookourspot-server' },
    },
  });
  return cached;
}
