'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Printer, MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { formatTime } from '@/lib/slots';
import type { Appointment, Business, Service, Transaction, User } from '@/lib/types';

type LineItem = {
  service_id: string | null;
  name: string;
  price: number;
  quantity: number;
  line_total?: number;
};

type ExtendedTransaction = Transaction & {
  line_items: LineItem[];
  subtotal_amount: number | null;
  tax_amount: number;
  discount_amount: number;
  tip_amount: number;
  receipt_number: string | null;
  paid_at: string | null;
  notes: string | null;
  appointment?: Appointment & {
    service?: Service | null;
    business?: Business | null;
    user?: User | null;
  };
};

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Cash',
  card: 'Card',
  qr_ewallet: 'QR / eWallet',
  bank_transfer: 'Bank transfer',
  other: 'Other',
};

export default function ReceiptPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const receiptId = params?.id;
  const { profile, loading: authLoading } = useAuth();

  const [tx, setTx] = useState<ExtendedTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!profile || profile.role !== 'merchant') {
      router.replace('/');
    }
  }, [authLoading, profile, router]);

  const loadReceipt = useCallback(async () => {
    if (!receiptId) return;
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: qErr } = await supabase
        .from('transactions')
        .select(
          '*, appointment:appointments(*, service:services(*), business:businesses(*), user:users(*))'
        )
        .eq('id', receiptId)
        .maybeSingle();
      if (qErr) throw qErr;
      if (!data) throw new Error('Receipt not found');
      setTx(data as unknown as ExtendedTransaction);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load receipt');
    } finally {
      setLoading(false);
    }
  }, [receiptId]);

  useEffect(() => {
    loadReceipt();
  }, [loadReceipt]);

  function handlePrint() {
    window.print();
  }

  function handleShareWhatsApp() {
    if (!tx) return;
    const customerPhone = tx.appointment?.user?.phone ?? '';
    if (!customerPhone) return;
    const text = `Thanks for visiting ${tx.appointment?.business?.name ?? 'us'}! Receipt ${tx.receipt_number ?? tx.id.slice(0, 8)} — total RM ${Number(tx.amount).toFixed(2)}. Paid via ${PAYMENT_LABELS[tx.payment_method] ?? tx.payment_method}.`;
    const digits = customerPhone.replace(/\D/g, '');
    const waNumber = digits.startsWith('60') ? digits : digits.startsWith('0') ? `60${digits.slice(1)}` : digits;
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`, '_blank');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-8 w-8 border-4 border-violet-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!tx) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">Receipt not found</p>
          {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
          <Link
            href="/dashboard/bookings"
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-violet-700 hover:text-violet-800"
          >
            <ArrowLeft size={16} /> Back to bookings
          </Link>
        </div>
      </div>
    );
  }

  const business = tx.appointment?.business;
  const customer = tx.appointment?.user;
  const lineItems = Array.isArray(tx.line_items) ? tx.line_items : [];
  const subtotal = tx.subtotal_amount ?? lineItems.reduce((acc, li) => acc + (li.price * (li.quantity ?? 1)), 0);
  const paidAt = tx.paid_at ? new Date(tx.paid_at) : null;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 print:bg-white">
      {/* Screen-only toolbar */}
      <header className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10 print:hidden">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link
            href="/dashboard/bookings"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">Receipt</h1>
            <p className="text-xs text-gray-500">
              {tx.receipt_number ?? tx.id.slice(0, 8)} • RM {Number(tx.amount).toFixed(2)}
            </p>
          </div>
          {customer?.phone ? (
            <Button variant="ghost" size="sm" onClick={handleShareWhatsApp}>
              <MessageSquare size={16} className="mr-1" /> WhatsApp
            </Button>
          ) : null}
          <Button size="sm" onClick={handlePrint}>
            <Printer size={16} className="mr-1" /> Print
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 print:p-0">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 print:border-0 print:rounded-none">
          {/* Business head */}
          <div className="text-center border-b border-gray-200 pb-4">
            <h2 className="text-xl font-bold text-gray-900">{business?.name ?? 'BookOurSpot Business'}</h2>
            {business?.address ? <p className="text-sm text-gray-500 mt-1">{business.address}</p> : null}
            {business?.phone ? <p className="text-xs text-gray-500 mt-0.5">{business.phone}</p> : null}
          </div>

          {/* Meta */}
          <dl className="mt-4 grid grid-cols-2 gap-y-1 text-sm">
            <dt className="text-gray-500">Receipt</dt>
            <dd className="text-right font-medium text-gray-900">
              {tx.receipt_number ?? tx.id.slice(0, 8).toUpperCase()}
            </dd>
            <dt className="text-gray-500">Date</dt>
            <dd className="text-right text-gray-900">
              {paidAt
                ? paidAt.toLocaleString('en-MY', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '—'}
            </dd>
            {tx.appointment ? (
              <>
                <dt className="text-gray-500">Appointment</dt>
                <dd className="text-right text-gray-900">
                  {tx.appointment.date} · {formatTime(tx.appointment.start_time)}
                </dd>
              </>
            ) : null}
            {customer?.name ? (
              <>
                <dt className="text-gray-500">Customer</dt>
                <dd className="text-right text-gray-900">{customer.name}</dd>
              </>
            ) : null}
            <dt className="text-gray-500">Payment</dt>
            <dd className="text-right text-gray-900">
              {PAYMENT_LABELS[tx.payment_method] ?? tx.payment_method}
            </dd>
          </dl>

          {/* Line items */}
          <table className="mt-6 w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200">
                <th className="py-2 font-medium">Item</th>
                <th className="py-2 font-medium text-center w-12">Qty</th>
                <th className="py-2 font-medium text-right w-20">Price</th>
                <th className="py-2 font-medium text-right w-24">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lineItems.map((li, idx) => (
                <tr key={idx}>
                  <td className="py-2 text-gray-900">{li.name}</td>
                  <td className="py-2 text-center text-gray-700">{li.quantity ?? 1}</td>
                  <td className="py-2 text-right text-gray-700">RM {Number(li.price).toFixed(2)}</td>
                  <td className="py-2 text-right text-gray-900 font-medium">
                    RM {(Number(li.price) * (li.quantity ?? 1)).toFixed(2)}
                  </td>
                </tr>
              ))}
              {lineItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-sm text-gray-500">
                    (No itemized line items)
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>

          {/* Totals */}
          <div className="mt-4 pt-3 border-t border-gray-200 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-900">RM {Number(subtotal).toFixed(2)}</span>
            </div>
            {Number(tx.discount_amount) > 0 ? (
              <div className="flex justify-between">
                <span className="text-gray-500">Discount</span>
                <span className="text-gray-900">-RM {Number(tx.discount_amount).toFixed(2)}</span>
              </div>
            ) : null}
            {Number(tx.tax_amount) > 0 ? (
              <div className="flex justify-between">
                <span className="text-gray-500">Tax / SST</span>
                <span className="text-gray-900">+RM {Number(tx.tax_amount).toFixed(2)}</span>
              </div>
            ) : null}
            {Number(tx.tip_amount) > 0 ? (
              <div className="flex justify-between">
                <span className="text-gray-500">Tip</span>
                <span className="text-gray-900">+RM {Number(tx.tip_amount).toFixed(2)}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200 mt-2">
              <span>Total paid</span>
              <span>RM {Number(tx.amount).toFixed(2)}</span>
            </div>
          </div>

          {tx.notes ? (
            <p className="mt-6 text-xs text-gray-500 whitespace-pre-wrap">Notes: {tx.notes}</p>
          ) : null}

          <p className="mt-8 text-center text-xs text-gray-400">
            Thank you for your visit · Powered by BookOurSpot
          </p>
        </div>
      </main>

      <style jsx global>{`
        @media print {
          header,
          nav,
          footer {
            display: none !important;
          }
          body {
            background: #fff !important;
          }
        }
      `}</style>
    </div>
  );
}
