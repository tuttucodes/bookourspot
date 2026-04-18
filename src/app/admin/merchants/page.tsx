import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type MerchantRow = {
  id: string;
  name: string;
  trading_name: string | null;
  category: string;
  location: string | null;
  country: string;
  verification_status: string;
  primary_reg_number: string | null;
  is_active: boolean;
  owner: { name: string | null; email: string | null } | null;
  created_at: string;
};

const VERIFY_COLORS: Record<string, string> = {
  approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  pending: 'bg-orange-100 text-orange-700 border-orange-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
  suspended: 'bg-gray-100 text-gray-600 border-gray-200',
};

export default async function MerchantsPage() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('businesses')
    .select(
      'id, name, trading_name, category, location, country, verification_status, primary_reg_number, is_active, created_at, owner:users!businesses_owner_id_fkey(name, email)'
    )
    .order('created_at', { ascending: false });

  const rows = (data ?? []) as unknown as MerchantRow[];

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Merchants</h1>
        <p className="text-sm text-gray-500 mt-1">{rows.length} businesses on the platform.</p>
      </header>

      {error ? (
        <p className="text-sm text-red-600">Failed to load: {error.message}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-500 bg-white border border-gray-100 rounded-2xl p-6 text-center">
          No merchants yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.id}>
              <div className="bg-white border border-gray-100 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {row.trading_name ?? row.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {row.category} · {row.location ?? 'No location'} · {row.country}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Owner: {row.owner?.name ?? '—'} · {row.owner?.email ?? '—'}
                    </p>
                    {row.primary_reg_number ? (
                      <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                        Reg #: {row.primary_reg_number}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                        VERIFY_COLORS[row.verification_status] ?? VERIFY_COLORS.pending
                      }`}
                    >
                      {row.verification_status}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {row.is_active ? 'Active' : 'Inactive'} ·{' '}
                      {new Date(row.created_at).toLocaleDateString('en-MY', {
                        day: '2-digit',
                        month: 'short',
                        year: '2-digit',
                      })}
                    </span>
                    <Link
                      href={`/business/${row.id}`}
                      className="text-xs text-violet-700 hover:text-violet-800"
                    >
                      View public page →
                    </Link>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
