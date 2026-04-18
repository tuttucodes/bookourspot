import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabasePublicConfig } from '@/lib/env';

/**
 * Parent domain for session cookies in production. Letting the cookie span
 * `.bookourspot.com` means `www.bookourspot.com` and `business.bookourspot.com`
 * share the same Supabase session — sign in on one, you are signed in on both.
 *
 * In local dev we intentionally leave `domain` unset so cookies work on
 * localhost and `business.localhost` without extra machinery.
 */
const COOKIE_PARENT_DOMAIN = '.bookourspot.com';

function shouldScopeToParentDomain(request: NextRequest): boolean {
  const host = request.headers.get('host')?.toLowerCase() ?? '';
  return host.endsWith('.bookourspot.com') || host === 'bookourspot.com';
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { url, anonKey } = getSupabasePublicConfig();
  const scopeToParent = shouldScopeToParentDomain(request);

  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            const finalOptions = scopeToParent
              ? { ...options, domain: COOKIE_PARENT_DOMAIN }
              : options;
            supabaseResponse.cookies.set(name, value, finalOptions);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Redirect unauthenticated users away from protected routes.
  const protectedPaths = ['/dashboard', '/bookings', '/profile', '/admin', '/merchant-apply', '/pending-review'];
  const isProtected = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path));

  if (isProtected && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Pending merchants hitting /dashboard/* -> route to /pending-review.
  if (user && request.nextUrl.pathname.startsWith('/dashboard')) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    if (profile?.role === 'pending_merchant') {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/pending-review';
      redirectUrl.search = '';
      return NextResponse.redirect(redirectUrl);
    }
  }

  return supabaseResponse;
}
