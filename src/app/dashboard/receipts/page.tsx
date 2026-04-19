'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { Plus, Receipt, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { goToCustomerHome } from '@/lib/navigation';
import { getMyBusiness } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Business } from '@/lib/types';

type ReceiptRow = {
  id: string;
  amount: number;
  payment_method: string | null;
  status: string;
  receipt_number: string | null;
  paid_at: string | null;
  created_at: string;
  entry_type: string | null;
  description: string | null;
  category: string | null;
  appointment:
    | {
        id: string;
        date: string;
        start_time: string;
        business_id: string;
        user: { name: string | null; phone: string | null } | null;
        service: { name: string | null } | null;
        walkin_name: string | null;
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

const PAYMENT_METHODS: Array<{ value: string; label: string }> = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'qr_ewallet', label: 'QR / eWallet' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'other', label: 'Other' },
];

export default function ReceiptsIndexPage() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showRevenue, setShowRevenue] = useState(false);
  const [revenueForm, setRevenueForm] = useState({
    amount: '',
    description: '',
    category: '',
    payment_method: 'cash',
  });
  const [submittingRevenue, setSubmittingRevenue] = useState(false);
  const [revenueError, setRevenueError] = useState<string | null>(null);

  const loadReceipts = useCallback(async (businessId: string) => {
    const supabase = createClient();

    // Pull both appointment-linked and manual-entry transactions.
    const [appointmentScoped, manualScoped] = await Promise.all([
      supabase
        .from('transactions')
        .select(
          `id, amount, payment_method, status, receipt_number, paid_at, created_at,
           entry_type, description, category,
           appointment:appointments!inner(
             id, date, start_time, business_id, walkin_name,
             user:users(name, phone),
             service:services(name)
           )`,
        )
        .eq('appointment.business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('transactions')
        .select(
          'id, amount, payment_method, status, receipt_number, paid_at, created_at, entry_type, description, category',
        )
        .eq('entry_type', 'manual')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    if (appointmentScoped.error) throw appointmentScoped.error;
    if (manualScoped.error) throw manualScoped.error;

    const combined: ReceiptRow[] = [
      ...((appointmentScoped.data as unknown as ReceiptRow[]) ?? []),
      ...((manualScoped.data as unknown as ReceiptRow[]) ?? []).map((r) => ({
        ...r,
        appointment: null,
      })),
    ].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

    return combined.slice(0, 50);
  }, []);

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
        const rows = await loadReceipts(biz.id);
        setReceipts(rows);
      } catch (err) {
        console.error('Receipts index load failed:', err);
        setError(err instanceof Error ? err.message : 'Failed to load receipts');
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading, profile, router, loadReceipts]);

  async function submitRevenue(e: React.FormEvent) {
    e.preventDefault();
    setRevenueError(null);
    const amount = Number(revenueForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setRevenueError('Amount must be a positive number.');
      return;
    }
    setSubmittingRevenue(true);
    try {
      const res = await fetch('/api/merchant/revenue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          description: revenueForm.description.trim() || undefined,
          category: revenueForm.category.trim() || undefined,
          payment_method: revenueForm.payment_method,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Failed to record revenue');

      // Refresh list.
      if (business) {
        const rows = await loadReceipts(business.id);
        setReceipts(rows);
      }
      setShowRevenue(false);
      setRevenueForm({ amount: '', description: '', category: '', payment_method: 'cash' });
    } catch (err) {
      setRevenueError(err instanceof Error ? err.message : 'Failed to record revenue');
    } finally {
      setSubmittingRevenue(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f3f2] pb-28 md:pb-8 md:pl-28 lg:pl-32">
      <Header title="Receipts" />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#006273]">Receipts</p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">Recent transactions</h1>
            <p className="mt-1 text-sm text-gray-500">
              {business?.name ? `${business.name} · ` : ''}
              Last 50 records
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setRevenueError(null);
                setShowRevenue(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#006273] to-[#107c91] px-4 py-2 text-xs font-semibold text-white hover:opacity-95"
            >
              <Plus size={14} />
              Add revenue
            </button>
            <Link
              href="/dashboard/pos"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e2e1] bg-white px-4 py-2 text-xs font-semibold text-[#006273] hover:bg-[#f6f3f2]"
            >
              <Receipt size={14} />
              POS
            </Link>
          </div>
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
              Completed POS checkouts and manual revenue entries will appear here.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {receipts.map((r) => {
              const isManual = r.entry_type === 'manual' || !r.appointment;
              const headline = isManual
                ? r.description || r.category || 'Manual revenue'
                : r.appointment?.user?.name ||
                  r.appointment?.walkin_name ||
                  'Guest';
              const subline = isManual
                ? r.category || 'Manual entry'
                : r.appointment?.service?.name || 'Service';
              const dateLabel = r.paid_at
                ? format(parseISO(r.paid_at), 'd MMM · HH:mm')
                : format(parseISO(r.created_at), 'd MMM · HH:mm');
              const methodLabel = r.payment_method
                ? PAYMENT_LABELS[r.payment_method] ?? r.payment_method
                : '—';
              const inner = (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900">{headline}</p>
                      <p className="truncate text-sm text-gray-600">{subline}</p>
                      <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.08em] text-gray-400">
                        {r.receipt_number ? `#${r.receipt_number} · ` : ''}
                        {isManual ? 'Manual · ' : ''}
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
                </>
              );
              return (
                <li key={r.id}>
                  {isManual ? (
                    <div className="block rounded-2xl bg-white p-4 shadow-sm">{inner}</div>
                  ) : (
                    <Link
                      href={`/dashboard/receipts/${r.id}`}
                      className="block rounded-2xl bg-white p-4 shadow-sm transition-colors hover:bg-[#fbfafa]"
                    >
                      {inner}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <BottomNav />

      {showRevenue && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-3xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Add revenue</h2>
              <button
                onClick={() => setShowRevenue(false)}
                className="rounded-full p-1.5 hover:bg-gray-100"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitRevenue} className="space-y-3">
              <Input
                label="Amount (RM)"
                type="number"
                min={0}
                step="0.01"
                required
                value={revenueForm.amount}
                onChange={(e) => setRevenueForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="0.00"
                inputMode="decimal"
              />
              <Input
                label="Description (optional)"
                value={revenueForm.description}
                onChange={(e) =>
                  setRevenueForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="e.g. Product sale, tip, misc."
              />
              <Input
                label="Category (optional)"
                value={revenueForm.category}
                onChange={(e) => setRevenueForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="e.g. Retail, Tip"
              />

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
                  Payment method
                </span>
                <select
                  className="w-full rounded-xl border border-[#e5e2e1] bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#006273] focus:outline-none"
                  value={revenueForm.payment_method}
                  onChange={(e) =>
                    setRevenueForm((f) => ({ ...f, payment_method: e.target.value }))
                  }
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>

              {revenueError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                  {revenueError}
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <Button type="submit" loading={submittingRevenue} className="flex-1">
                  Record revenue
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowRevenue(false)}
                  disabled={submittingRevenue}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
