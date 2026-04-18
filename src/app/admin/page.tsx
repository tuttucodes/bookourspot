import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function fetchOverview() {
  const supabase = await createServerSupabaseClient();
  const [apps, support, merchants, customers, txns] = await Promise.all([
    supabase
      .from('merchant_applications')
      .select('id, status', { count: 'exact', head: false })
      .in('status', ['submitted', 'under_review']),
    supabase
      .from('support_queries')
      .select('id, status', { count: 'exact', head: false })
      .in('status', ['open', 'in_progress']),
    supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'merchant'),
    supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'customer'),
    supabase
      .from('transactions')
      .select('id, amount', { count: 'exact' })
      .eq('status', 'completed')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const weekRevenue = (txns.data ?? []).reduce((acc, t) => acc + Number(t.amount ?? 0), 0);

  return {
    pendingApplications: apps.count ?? apps.data?.length ?? 0,
    openSupport: support.count ?? support.data?.length ?? 0,
    merchants: merchants.count ?? 0,
    customers: customers.count ?? 0,
    weekRevenue,
    weekTxns: txns.count ?? txns.data?.length ?? 0,
  };
}

function Stat({ label, value, href, tone }: { label: string; value: string | number; href?: string; tone?: 'warn' | 'ok' }) {
  const card = (
    <div
      className={`bg-white border rounded-2xl p-5 hover:shadow-sm transition-shadow ${
        tone === 'warn' ? 'border-orange-200' : 'border-gray-100'
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p
        className={`mt-1.5 text-3xl font-bold ${
          tone === 'warn' ? 'text-orange-600' : tone === 'ok' ? 'text-emerald-600' : 'text-gray-900'
        }`}
      >
        {value}
      </p>
    </div>
  );
  return href ? <Link href={href}>{card}</Link> : card;
}

export default async function AdminOverviewPage() {
  const data = await fetchOverview();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Platform health at a glance.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <Stat
          label="Pending applications"
          value={data.pendingApplications}
          href="/admin/applications"
          tone={data.pendingApplications > 0 ? 'warn' : undefined}
        />
        <Stat
          label="Open support queries"
          value={data.openSupport}
          href="/admin/support"
          tone={data.openSupport > 0 ? 'warn' : undefined}
        />
        <Stat label="Merchants live" value={data.merchants} href="/admin/merchants" />
        <Stat label="Customers" value={data.customers} href="/admin/customers" />
        <Stat label="Revenue · 7d" value={`RM ${data.weekRevenue.toFixed(2)}`} tone="ok" />
        <Stat label="Transactions · 7d" value={data.weekTxns} />
      </div>

      <section className="bg-white border border-gray-100 rounded-2xl p-5">
        <h2 className="font-semibold text-gray-900">Quick actions</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/admin/applications"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-600 text-white text-sm font-medium hover:bg-violet-700"
          >
            Review applications
          </Link>
          <Link
            href="/admin/support"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-gray-800"
          >
            Support inbox
          </Link>
          <Link
            href="/admin/merchants"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50"
          >
            Merchants
          </Link>
        </div>
      </section>
    </div>
  );
}
