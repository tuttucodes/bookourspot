import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getRequestOrigin } from '@/lib/auth/request-origin';

/** Only allow same-origin relative paths to avoid open redirects. */
function safeInternalPath(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/';
  return raw;
}

export async function GET(request: Request) {
  const origin = getRequestOrigin(request);
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeInternalPath(
    searchParams.get('redirect') ?? searchParams.get('next')
  );

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, origin).toString());
    }
  }

  return NextResponse.redirect(
    new URL(`/login?error=auth&redirect=${encodeURIComponent(next)}`, origin).toString()
  );
}
