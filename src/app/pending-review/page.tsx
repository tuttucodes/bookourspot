import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function PendingReviewPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect('/login?redirect=/pending');

  const [{ data: profile }, { data: app }] = await Promise.all([
    supabase.from('users').select('role').eq('id', authUser.id).maybeSingle(),
    supabase
      .from('merchant_applications')
      .select('id, status, submitted_at, rejection_reason, business_legal_name, business_trading_name')
      .eq('user_id', authUser.id)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (profile?.role === 'merchant') redirect('/dashboard');
  if (!app) redirect('/apply');

  const rejected = app.status === 'rejected';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white border border-gray-100 rounded-2xl p-6 space-y-4 text-center">
        <div
          className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center ${
            rejected ? 'bg-red-100 text-red-600' : 'bg-violet-100 text-violet-600'
          }`}
        >
          <span className="text-2xl">{rejected ? '✕' : '⏳'}</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900">
          {rejected ? 'Application not approved' : 'Application under review'}
        </h1>
        <p className="text-sm text-gray-500">
          {rejected
            ? 'Unfortunately we could not approve your application at this time.'
            : `We are reviewing ${
                app.business_trading_name ?? app.business_legal_name
              }. Most applications are approved within 1 business day.`}
        </p>
        {rejected && app.rejection_reason ? (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 text-left whitespace-pre-wrap">
            <span className="font-medium">Reason:</span> {app.rejection_reason}
          </p>
        ) : null}
        <p className="text-xs text-gray-500">
          Submitted {new Date(app.submitted_at).toLocaleString('en-MY')} · Reference{' '}
          <span className="font-mono">{app.id.slice(0, 8)}</span>
        </p>
        <div className="flex flex-col gap-2">
          {rejected ? (
            <Link
              href="/apply"
              className="inline-flex justify-center rounded-full bg-violet-600 text-white px-4 py-2 text-sm font-semibold hover:bg-violet-700"
            >
              Re-apply with corrected info
            </Link>
          ) : null}
          <Link
            href="/support"
            className="text-sm text-violet-700 hover:text-violet-800"
          >
            Contact support
          </Link>
        </div>
      </div>
    </div>
  );
}
