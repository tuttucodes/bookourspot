import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { AdminNav } from './_components/AdminNav';

export const dynamic = 'force-dynamic';

/**
 * Server-side role gate for the admin platform.
 *
 * Runs on every request to /admin/*. Rejects anyone who is not
 * `role in ('admin','superadmin')`. Proxy already rewrites
 * admin.bookourspot.com/* -> /admin/*, so this gate covers both hosts.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect('/login?redirect=/admin');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('id, name, email, role')
    .eq('id', authUser.id)
    .maybeSingle();

  if (!profile || !['admin', 'superadmin'].includes(profile.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-xl font-bold text-gray-900">Access denied</h1>
          <p className="text-sm text-gray-600">
            Your account does not have admin privileges. Contact the BookOurSpot team if you
            believe this is a mistake.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-violet-700 hover:text-violet-800"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav role={profile.role} name={profile.name} />
      <main className="max-w-6xl mx-auto p-4 md:p-6">{children}</main>
    </div>
  );
}
