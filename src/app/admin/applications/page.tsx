import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const STATUS_COLORS: Record<string, string> = {
  submitted: 'bg-orange-100 text-orange-700 border-orange-200',
  under_review: 'bg-blue-100 text-blue-700 border-blue-200',
  approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
  withdrawn: 'bg-gray-100 text-gray-600 border-gray-200',
};

type AppRow = {
  id: string;
  business_legal_name: string;
  business_trading_name: string | null;
  category: string;
  country: string;
  primary_reg_number: string;
  city: string | null;
  state: string | null;
  status: string;
  submitted_at: string;
  owner_name: string;
  owner_phone: string;
};

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createServerSupabaseClient();
  let q = supabase
    .from('merchant_applications')
    .select(
      'id, business_legal_name, business_trading_name, category, country, primary_reg_number, city, state, status, submitted_at, owner_name, owner_phone'
    )
    .order('submitted_at', { ascending: false });

  if (status && ['submitted', 'under_review', 'approved', 'rejected', 'withdrawn'].includes(status)) {
    q = q.eq('status', status);
  } else {
    q = q.in('status', ['submitted', 'under_review']);
  }

  const { data, error } = await q;
  const rows = (data ?? []) as AppRow[];

  const tabs = [
    { key: 'pending', label: 'Pending', href: '/admin/applications' },
    { key: 'approved', label: 'Approved', href: '/admin/applications?status=approved' },
    { key: 'rejected', label: 'Rejected', href: '/admin/applications?status=rejected' },
    { key: 'all', label: 'All', href: '/admin/applications?status=all' },
  ];
  const activeTab = !status ? 'pending' : status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'all';

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Merchant applications</h1>
          <p className="text-sm text-gray-500 mt-1">Review legitimacy and approve or reject.</p>
        </div>
        <div className="flex gap-1 bg-white border border-gray-200 rounded-full p-1">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={t.href}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                activeTab === t.key
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </header>

      {error ? (
        <p className="text-sm text-red-600">Failed to load: {error.message}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-500 bg-white border border-gray-100 rounded-2xl p-6 text-center">
          Nothing here. Applicants will appear once they submit.
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={`/admin/applications/${row.id}`}
                className="block bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {row.business_trading_name ?? row.business_legal_name}
                      <span className="ml-2 font-normal text-xs text-gray-500">
                        ({row.business_legal_name})
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {row.category} · {row.city ?? 'Unknown city'}, {row.state ?? ''} · {row.country}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Owner: {row.owner_name} · {row.owner_phone}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">Reg #: {row.primary_reg_number}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                        STATUS_COLORS[row.status] ?? STATUS_COLORS.submitted
                      }`}
                    >
                      {row.status.replace('_', ' ')}
                    </span>
                    <p className="text-[11px] text-gray-400">
                      {new Date(row.submitted_at).toLocaleDateString('en-MY', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
