'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { Receipt } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { goToCustomerHome } from '@/lib/navigation';
import { getMyBusiness } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import type { Business } from '@/lib/types';

type ReceiptRow = {
  id: string;
  amount: number;
  payment_method: string | null;
  status: string;
  receipt_number: string | null;
  paid_at: string | null;
  created_at: string;
  appointment:
    | {
        id: string;
        date: string;
        start_time: string;
        business_id: string;
        user: { name: string | null; phone: string | null } | null;
        service: { name: string | null } | null;
      }
    | null;
};

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Cash',
  card: 'Card',
  qr_ewallet: 'QR / eWallet',
  bank_transfer: 'Bank transfer',
  other: 'Other',
};

export default function ReceiptsIndexPage() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!profile || profile.role !== 'merchant') {
      goToCustomerHome();
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const biz = await getMyBusiness();
        if (!biz) {
          router.push('/dashboard/onboarding');
          return;
        }
        setBusiness(biz);

        const supabase = createClient();
        const { data, error: txErr } = await supabase
          .from('transactions')
          .select(
            `id, amount, payment_method, status, receipt_number, paid_at, created_at,
             appointment:appointments!inner(
               id, date, start_time, business_id,
               user:users(name, phone),
               service:services(name)
             )`,
          )
          .eq('appointment.business_id', biz.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (txErr) throw txErr;
        setReceipts((data as unknown as ReceiptRow[]) ?? []);
      } catch (err) {
        console.error('Receipts index load failed:', err);
        setError(err instanceof Error ? err.message : 'Failed to load receipts');
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading, profile, router]);

  return (
    <div className="min-h-screen bg-[#f6f3f2] pb-28 md:pb-8 md:pl-28 lg:pl-32">
      <Header title="Receipts" />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#006273]">Receipts</p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">Recent transactions</h1>
            <p className="mt-1 text-sm text-gray-500">
              {business?.name ? `${business.name} · ` : ''}
              Last 50 records
            </p>
          </div>
          <Link
            href="/dashboard/pos"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e2e1] bg-white px-4 py-2 text-xs font-semibold text-[#006273] hover:bg-[#f6f3f2]"
          >
            <Receipt size={14} />
            POS
          </Link>
        </header>

        {loading ? (
          <p className="rounded-2xl bg-white p-6 text-sm text-gray-500 shadow-sm">Loading receipts…</p>
        ) : error ? (
          <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p>
        ) : receipts.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <Receipt className="mx-auto mb-3 text-gray-400" size={32} />
            <p className="text-sm font-semibold text-gray-700">No receipts yet</p>
            <p className="mt-1 text-xs text-gray-500">
              Completed POS checkouts will appear here.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {receipts.map((r) => {
              const customerName = r.appointment?.user?.name || 'Guest';
              const serviceName = r.appointment?.service?.name || 'Service';
              const dateLabel = r.paid_at
                ? format(parseISO(r.paid_at), 'd MMM · HH:mm')
                : format(parseISO(r.created_at), 'd MMM · HH:mm');
              const methodLabel = r.payment_method
                ? PAYMENT_LABELS[r.payment_method] ?? r.payment_method
                : '—';
              return (
                <li key={r.id}>
                  <Link
                    href={`/dashboard/receipts/${r.id}`}
                    className="block rounded-2xl bg-white p-4 shadow-sm transition-colors hover:bg-[#fbfafa]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-900">{customerName}</p>
                        <p className="truncate text-sm text-gray-600">{serviceName}</p>
                        <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.08em] text-gray-400">
                          {r.receipt_number ? `#${r.receipt_number} · ` : ''}
                          {methodLabel} · {dateLabel}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-[#006273]">
                          RM {Number(r.amount).toFixed(2)}
                        </p>
                        <p
                          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${
                            r.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {r.status}
                        </p>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
