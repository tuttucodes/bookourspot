/**
 * Resolve the public origin for redirects after OAuth (PKCE callback).
 * On Vercel, prefer forwarded headers so redirects match the user's browser URL.
 */
export function getRequestOrigin(request: Request): string {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https';

  if (forwardedHost) {
    const host = forwardedHost.split(',')[0].trim();
    return `${forwardedProto}://${host}`;
  }

  return new URL(request.url).origin;
}
