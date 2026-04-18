import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-orange-100 text-orange-700 border-orange-200',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
  resolved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  closed: 'bg-gray-100 text-gray-600 border-gray-200',
};

type QueryRow = {
  id: string;
  subject: string;
  category: string;
  status: string;
  created_at: string;
  submitter_role: string | null;
  guest_name: string | null;
  guest_email: string | null;
  submitter: { name: string | null; email: string | null } | null;
};

export default async function SupportInboxPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createServerSupabaseClient();

  let q = supabase
    .from('support_queries')
    .select(
      'id, subject, category, status, created_at, submitter_role, guest_name, guest_email, submitter:users(name, email)'
    )
    .order('created_at', { ascending: false });

  if (status && ['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
    q = q.eq('status', status);
  } else {
    q = q.in('status', ['open', 'in_progress']);
  }

  const { data } = await q;
  const rows = (data ?? []) as unknown as QueryRow[];

  const tabs = [
    { key: 'open', label: 'Open', href: '/admin/support' },
    { key: 'resolved', label: 'Resolved', href: '/admin/support?status=resolved' },
    { key: 'closed', label: 'Closed', href: '/admin/support?status=closed' },
    { key: 'all', label: 'All', href: '/admin/support?status=all' },
  ];
  const activeTab = !status ? 'open' : status;

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support inbox</h1>
          <p className="text-sm text-gray-500 mt-1">Customer + merchant queries.</p>
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

      {rows.length === 0 ? (
        <p className="text-sm text-gray-500 bg-white border border-gray-100 rounded-2xl p-6 text-center">
          No queries in this view.
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => {
            const who =
              row.submitter?.name ??
              row.submitter?.email ??
              row.guest_name ??
              row.guest_email ??
              'Guest';
            return (
              <li key={row.id}>
                <Link
                  href={`/admin/support/${row.id}`}
                  className="block bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{row.subject}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {who} · {row.submitter_role ?? 'guest'} · {row.category}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                          STATUS_COLORS[row.status] ?? STATUS_COLORS.open
                        }`}
                      >
                        {row.status.replace('_', ' ')}
                      </span>
                      <p className="text-[11px] text-gray-400">
                        {new Date(row.created_at).toLocaleDateString('en-MY', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
