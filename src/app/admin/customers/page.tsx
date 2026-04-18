import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type CustomerRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  phone_verified: boolean;
  created_at: string;
};

export default async function CustomersPage() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('users')
    .select('id, name, email, phone, phone_verified, created_at')
    .eq('role', 'customer')
    .order('created_at', { ascending: false })
    .limit(200);

  const rows = (data ?? []) as CustomerRow[];

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <p className="text-sm text-gray-500 mt-1">
          {rows.length} most recent (capped at 200 for performance).
        </p>
      </header>

      {rows.length === 0 ? (
        <p className="text-sm text-gray-500 bg-white border border-gray-100 rounded-2xl p-6 text-center">
          No customers yet.
        </p>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Phone</th>
                <th className="px-4 py-2 font-medium text-right">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-2 text-gray-900">{row.name || '—'}</td>
                  <td className="px-4 py-2 text-gray-600">{row.email}</td>
                  <td className="px-4 py-2 text-gray-600">
                    {row.phone ?? '—'}
                    {row.phone_verified ? (
                      <span className="ml-1.5 text-[10px] text-emerald-700">✓</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-500 text-xs">
                    {new Date(row.created_at).toLocaleDateString('en-MY', {
                      day: '2-digit',
                      month: 'short',
                      year: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
