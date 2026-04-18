import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// ============================================================================
// Host routing for BookOurSpot subdomains
//
// www.bookourspot.com       -> customer UI (explore, book, profile, ...)
// business.bookourspot.com  -> merchant UI (dashboard, POS, receipts, staff)
// admin.bookourspot.com     -> super-admin UI (applications, support, merchants)
//
// Single Next.js app, single Supabase, shared session cookie (scoped to
// `.bookourspot.com` so signing in on one host works on all). Host routing
// is implemented here via rewrites/redirects so each subdomain gets clean
// URLs (e.g. `business.*/bookings` instead of `business.*/dashboard/bookings`).
// Files live under src/app/dashboard/* and src/app/admin/* respectively.
// ============================================================================

// Primary merchant subdomain is merchant.*. `business.*` is kept as an alias
// in case any bookmarks/emails still reference it.
const MERCHANT_HOSTS = new Set<string>([
  'merchant.bookourspot.com',
  'merchant.localhost',
  'merchant.localhost:3000',
  'business.bookourspot.com',
  'business.localhost',
  'business.localhost:3000',
]);

const ADMIN_HOSTS = new Set<string>([
  'admin.bookourspot.com',
  'admin.localhost',
  'admin.localhost:3000',
]);

const APEX_OR_WWW_HOSTS = new Set<string>([
  'www.bookourspot.com',
  'bookourspot.com',
]);

// --- Merchant rewrites ------------------------------------------------------
const MERCHANT_PASSTHROUGH_PREFIXES = [
  '/dashboard',
  '/auth',
  '/api',
  '/login',
  '/signup',
  '/logout',
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/llms.txt',
];

const MERCHANT_CLEAN_REWRITES: Array<[prefix: string, target: string]> = [
  ['/pos', '/dashboard/pos'],
  ['/receipts', '/dashboard/receipts'],
  ['/bookings', '/dashboard/bookings'],
  ['/services', '/dashboard/services'],
  ['/staff', '/dashboard/staff'],
  ['/clients', '/dashboard/clients'],
  ['/analytics', '/dashboard/analytics'],
  ['/settings', '/dashboard/settings'],
  ['/onboarding', '/dashboard/onboarding'],
  ['/apply', '/merchant-apply'],
  ['/pending', '/pending-review'],
];

// --- Admin rewrites ---------------------------------------------------------
const ADMIN_PASSTHROUGH_PREFIXES = [
  '/admin',
  '/auth',
  '/api',
  '/login',
  '/logout',
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
];

const ADMIN_CLEAN_REWRITES: Array<[prefix: string, target: string]> = [
  ['/applications', '/admin/applications'],
  ['/merchants', '/admin/merchants'],
  ['/customers', '/admin/customers'],
  ['/support', '/admin/support'],
  ['/queries', '/admin/support'],
  ['/settings', '/admin/settings'],
];

// --- Host helpers -----------------------------------------------------------
function isMerchantHost(host: string | null | undefined): boolean {
  if (!host) return false;
  return MERCHANT_HOSTS.has(host.toLowerCase());
}

function isAdminHost(host: string | null | undefined): boolean {
  if (!host) return false;
  return ADMIN_HOSTS.has(host.toLowerCase());
}

function isProductionCustomerHost(host: string | null | undefined): boolean {
  if (!host) return false;
  return APEX_OR_WWW_HOSTS.has(host.toLowerCase());
}

function rewritePath(
  pathname: string,
  cleanRewrites: Array<[prefix: string, target: string]>,
  rootTarget: string
): string | null {
  if (pathname === '' || pathname === '/') return rootTarget;
  for (const [prefix, target] of cleanRewrites) {
    if (pathname === prefix) return target;
    if (pathname.startsWith(prefix + '/')) return target + pathname.slice(prefix.length);
  }
  return null;
}

function isPassthrough(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

// --- Main entry -------------------------------------------------------------
export async function proxy(request: NextRequest) {
  const host = request.headers.get('host');
  const { pathname, search } = request.nextUrl;

  // Admin subdomain
  if (isAdminHost(host)) {
    if (isPassthrough(pathname, ADMIN_PASSTHROUGH_PREFIXES)) {
      return await updateSession(request);
    }
    const rewritten = rewritePath(pathname, ADMIN_CLEAN_REWRITES, '/admin');
    if (rewritten) {
      const url = request.nextUrl.clone();
      url.pathname = rewritten;
      const rewriteResp = NextResponse.rewrite(url);
      const sessionResp = await updateSession(request);
      sessionResp.cookies.getAll().forEach((c) => {
        rewriteResp.cookies.set(c.name, c.value, c);
      });
      return rewriteResp;
    }
    // Unknown path on admin host — redirect to admin root
    const adminRoot = new URL('/', `https://${host}`);
    return NextResponse.redirect(adminRoot);
  }

  // Merchant subdomain
  if (isMerchantHost(host)) {
    if (isPassthrough(pathname, MERCHANT_PASSTHROUGH_PREFIXES)) {
      return await updateSession(request);
    }
    const rewritten = rewritePath(pathname, MERCHANT_CLEAN_REWRITES, '/dashboard');
    if (rewritten) {
      const url = request.nextUrl.clone();
      url.pathname = rewritten;
      const rewriteResp = NextResponse.rewrite(url);
      const sessionResp = await updateSession(request);
      sessionResp.cookies.getAll().forEach((c) => {
        rewriteResp.cookies.set(c.name, c.value, c);
      });
      return rewriteResp;
    }
    // Unknown path on merchant host — bounce to customer site
    const target = new URL(pathname + search, 'https://www.bookourspot.com');
    return NextResponse.redirect(target);
  }

  // Customer host (prod only): push /dashboard/* to business subdomain and
  // /admin/* to admin subdomain so admins never land on the main site.
  if (isProductionCustomerHost(host)) {
    if (pathname.startsWith('/dashboard')) {
      const cleanPath = pathname.replace(/^\/dashboard/, '') || '/';
      return NextResponse.redirect(new URL(cleanPath + search, 'https://merchant.bookourspot.com'));
    }
    if (pathname.startsWith('/admin')) {
      const cleanPath = pathname.replace(/^\/admin/, '') || '/';
      return NextResponse.redirect(new URL(cleanPath + search, 'https://admin.bookourspot.com'));
    }
  }

  // Default: session refresh
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
