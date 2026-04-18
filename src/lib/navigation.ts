'use client';

/**
 * Route helpers that work correctly across subdomains.
 *
 * Next.js `router.push('/')` is a client-side navigation — it fetches the RSC
 * payload for the target path without re-running the edge proxy. On the
 * merchant.* and admin.* subdomains the proxy is what rewrites `/` -> the
 * subdomain's real landing page, so a client-side push to `/` on those hosts
 * ends up rendering the customer home page instead of escaping the subdomain.
 *
 * These helpers force a full navigation when we need to cross subdomains.
 */

function isSubdomainHost(host: string): boolean {
  return (
    host.startsWith('merchant.') ||
    host.startsWith('admin.') ||
    host.startsWith('business.')
  );
}

/** Go to the customer home page, crossing subdomains if needed. */
export function goToCustomerHome(): void {
  if (typeof window === 'undefined') return;
  const host = window.location.hostname.toLowerCase();
  if (isSubdomainHost(host) && host.endsWith('.bookourspot.com')) {
    window.location.href = 'https://www.bookourspot.com';
    return;
  }
  window.location.href = '/';
}

/** Go to the customer login, crossing subdomains if needed. */
export function goToCustomerLogin(redirect?: string): void {
  if (typeof window === 'undefined') return;
  const host = window.location.hostname.toLowerCase();
  const q = redirect ? `?redirect=${encodeURIComponent(redirect)}` : '';
  if (isSubdomainHost(host) && host.endsWith('.bookourspot.com')) {
    window.location.href = `https://www.bookourspot.com/login${q}`;
    return;
  }
  window.location.href = `/login${q}`;
}
