import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabasePublicConfig } from '@/lib/env';

/**
 * Parent domain for session cookies in production. Letting the cookie span
 * `.bookourspot.com` means `www.bookourspot.com`, `merchant.bookourspot.com`,
 * and `admin.bookourspot.com` share one Supabase session — signing in on one
 * host works on all.
 *
 * In local dev we intentionally leave `domain` unset so cookies work on
 * localhost and `merchant.localhost` without extra machinery.
 */
const COOKIE_PARENT_DOMAIN = '.bookourspot.com';

function shouldScopeToParentDomain(request: NextRequest): boolean {
  const host = request.headers.get('host')?.toLowerCase() ?? '';
  return host.endsWith('.bookourspot.com') || host === 'bookourspot.com';
}

type UpdateSessionOptions = {
  /**
   * Logical path the visitor is accessing (after any proxy rewrite).
   * When omitted, falls back to the URL pathname. Used so that a request to
   * `merchant.bookourspot.com/` — which the proxy rewrites internally to
   * `/dashboard` — is still treated as visiting a protected route.
   */
  logicalPath?: string;
};

export async function updateSession(
  request: NextRequest,
  options: UpdateSessionOptions = {}
) {
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

  // Use the rewritten path for protection checks so merchant.*/'/' -> /dashboard
  // still gates on auth.
  const effectivePath = options.logicalPath ?? request.nextUrl.pathname;

  // Redirect unauthenticated users away from protected routes.
  const protectedPaths = [
    '/dashboard',
    '/bookings',
    '/profile',
    '/admin',
    '/merchant-apply',
    '/pending-review',
  ];
  const isProtected = protectedPaths.some((path) => effectivePath.startsWith(path));

  if (isProtected && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.search = '';
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Pending merchants hitting /dashboard/* -> /pending-review.
  if (user && effectivePath.startsWith('/dashboard')) {
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
