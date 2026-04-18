import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// ============================================================================
// Subdomain host rewrites are handled at the Vercel edge via `vercel.json`
// rewrites (runs BEFORE Next.js static serving — beats the CDN cache).
// By the time this proxy runs, the pathname already reflects the real target
// (e.g. `merchant.bookourspot.com/` arrives here as `pathname=/dashboard`).
//
// Proxy's job now: refresh the Supabase auth session, enforce protected
// route auth, and redirect pending merchants away from /dashboard.
// ============================================================================

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
