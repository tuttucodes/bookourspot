'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { getServices } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatTime } from '@/lib/slots';
import type { Appointment, Service } from '@/lib/types';
import { goToCustomerHome } from '@/lib/navigation';

type LineItem = {
  service_id: string | null;
  name: string;
  price: number;
  quantity: number;
};

type PaymentMethod = 'cash' | 'card' | 'qr_ewallet' | 'bank_transfer' | 'other';

const PAYMENT_METHODS: Array<{ value: PaymentMethod; label: string; icon: string }> = [
  { value: 'cash', label: 'Cash', icon: '💵' },
  { value: 'card', label: 'Card', icon: '💳' },
  { value: 'qr_ewallet', label: 'QR / eWallet', icon: '📱' },
  { value: 'bank_transfer', label: 'Bank transfer', icon: '🏦' },
  { value: 'other', label: 'Other', icon: '•••' },
];

const TIP_PRESETS = [0, 5, 10, 15];

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export default function PosCheckoutPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const appointmentId = params?.id;
  const { profile, loading: authLoading } = useAuth();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [catalog, setCatalog] = useState<Service[]>([]);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState('0');
  const [taxAmount, setTaxAmount] = useState('0');
  const [tipAmount, setTipAmount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Route guard: merchant only
  useEffect(() => {
    if (authLoading) return;
    if (!profile || profile.role !== 'merchant') {
      goToCustomerHome();
    }
  }, [authLoading, profile, router]);

  const loadData = useCallback(async () => {
    if (!appointmentId) return;
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: appt, error: apptErr } = await supabase
        .from('appointments')
        .select('*, service:services(*), business:businesses(*), user:users(*)')
        .eq('id', appointmentId)
        .maybeSingle();
      if (apptErr) throw apptErr;
      if (!appt) throw new Error('Appointment not found');

      setAppointment(appt as Appointment);

      const businessId = (appt.business_id || (appt.business as { id?: string } | null)?.id) as string;
      const services = await getServices(businessId);
      setCatalog(services);

      // Prefill line items from appointment's service (if any)
      const primaryService = appt.service as Service | null;
      if (primaryService) {
        setLineItems([
          {
            service_id: primaryService.id,
            name: primaryService.name,
            price: Number(primaryService.price),
            quantity: 1,
          },
        ]);
      } else {
        setLineItems([]);
      }

      // If a paid transaction already exists, redirect straight to receipt.
      const { data: existingTx } = await supabase
        .from('transactions')
        .select('id, status')
        .eq('appointment_id', appointmentId)
        .maybeSingle();
      if (existingTx?.status === 'completed') {
        router.replace(`/dashboard/receipts/${existingTx.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load appointment');
    } finally {
      setLoading(false);
    }
  }, [appointmentId, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const subtotal = useMemo(
    () => round2(lineItems.reduce((acc, li) => acc + li.price * li.quantity, 0)),
    [lineItems]
  );
  const discount = round2(Math.max(0, Number(discountAmount) || 0));
  const tax = round2(Math.max(0, Number(taxAmount) || 0));
  const tip = round2(Math.max(0, Number(tipAmount) || 0));
  const total = round2(Math.max(0, subtotal - discount + tax + tip));

  function addServiceToCart(svc: Service) {
    setLineItems((prev) => {
      const existing = prev.find((li) => li.service_id === svc.id);
      if (existing) {
        return prev.map((li) =>
          li.service_id === svc.id ? { ...li, quantity: li.quantity + 1 } : li
        );
      }
      return [
        ...prev,
        {
          service_id: svc.id,
          name: svc.name,
          price: Number(svc.price),
          quantity: 1,
        },
      ];
    });
  }

  function updateLineItem(idx: number, patch: Partial<LineItem>) {
    setLineItems((prev) => prev.map((li, i) => (i === idx ? { ...li, ...patch } : li)));
  }

  function removeLineItem(idx: number) {
    setLineItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleCheckout() {
    if (!appointmentId || lineItems.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/appointments/${appointmentId}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          line_items: lineItems.map((li) => ({
            service_id: li.service_id,
            name: li.name,
            price: li.price,
            quantity: li.quantity,
          })),
          tax_amount: tax,
          discount_amount: discount,
          tip_amount: tip,
          payment_method: paymentMethod,
          notes: notes || undefined,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Checkout failed');
      const receipt = payload.data;
      if (receipt?.id) {
        router.replace(`/dashboard/receipts/${receipt.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-8 w-8 border-4 border-violet-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">Appointment not found</p>
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

  const customer = appointment.user;
  const business = appointment.business;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link
            href="/dashboard/bookings"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Checkout</h1>
            <p className="text-xs text-gray-500">
              {customer?.name || 'Customer'} • {appointment.date} • {formatTime(appointment.start_time)}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 space-y-4">
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Line items */}
        <section className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Line items</h2>
            <span className="text-xs text-gray-500">{lineItems.length} item(s)</span>
          </div>

          {lineItems.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">
              No services selected yet. Add from the catalog below.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {lineItems.map((li, idx) => (
                <li key={`${li.service_id ?? 'custom'}-${idx}`} className="py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{li.name}</p>
                    <p className="text-xs text-gray-500">RM {li.price.toFixed(2)} each</p>
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={li.quantity}
                    onChange={(e) =>
                      updateLineItem(idx, { quantity: Math.max(1, Math.floor(Number(e.target.value) || 1)) })
                    }
                    className="w-16 rounded-lg border border-gray-200 text-center text-sm py-1.5"
                  />
                  <p className="w-20 text-right text-sm font-semibold text-gray-900">
                    RM {(li.price * li.quantity).toFixed(2)}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeLineItem(idx)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                    aria-label="Remove"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Catalog */}
        {catalog.length > 0 && (
          <section className="bg-white rounded-2xl border border-gray-100 p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Add from catalog</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {catalog.map((svc) => (
                <button
                  key={svc.id}
                  type="button"
                  onClick={() => addServiceToCart(svc)}
                  className="text-left p-3 rounded-xl border border-gray-200 hover:border-violet-300 hover:bg-violet-50 transition-colors"
                >
                  <p className="text-sm font-medium text-gray-900 truncate">{svc.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">RM {Number(svc.price).toFixed(2)}</p>
                  <Plus size={14} className="mt-1 text-violet-600" />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Adjustments */}
        <section className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <h2 className="font-semibold text-gray-900">Adjustments</h2>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Discount (RM)"
              type="number"
              min="0"
              step="0.01"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
            />
            <Input
              label="Tax / SST (RM)"
              type="number"
              min="0"
              step="0.01"
              value={taxAmount}
              onChange={(e) => setTaxAmount(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tip (RM)</label>
            <div className="flex flex-wrap gap-2">
              {TIP_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTipAmount(String(preset))}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    Number(tipAmount) === preset
                      ? 'border-violet-600 bg-violet-50 text-violet-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {preset === 0 ? 'No tip' : `RM ${preset}`}
                </button>
              ))}
              <input
                type="number"
                min="0"
                step="0.01"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                className="w-24 rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
              />
            </div>
          </div>
        </section>

        {/* Payment method */}
        <section className="bg-white rounded-2xl border border-gray-100 p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Payment method</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PAYMENT_METHODS.map((pm) => (
              <button
                key={pm.value}
                type="button"
                onClick={() => setPaymentMethod(pm.value)}
                className={`p-3 rounded-xl text-left border-2 transition-all ${
                  paymentMethod === pm.value
                    ? 'border-violet-600 bg-violet-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <span className="text-xl">{pm.icon}</span>
                <p
                  className={`mt-1 text-sm font-medium ${
                    paymentMethod === pm.value ? 'text-violet-700' : 'text-gray-700'
                  }`}
                >
                  {pm.label}
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* Notes */}
        <section className="bg-white rounded-2xl border border-gray-100 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Notes (optional, printed on receipt)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, 1000))}
            placeholder="e.g. loyalty discount, staff tip assignment…"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm min-h-[72px]"
          />
        </section>

        {/* Totals */}
        <section className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>Subtotal</span>
            <span>RM {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Discount</span>
            <span>-RM {discount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Tax / SST</span>
            <span>+RM {tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Tip</span>
            <span>+RM {tip.toFixed(2)}</span>
          </div>
          <div className="pt-2 mt-1 border-t border-gray-100 flex justify-between text-base font-bold text-gray-900">
            <span>Total</span>
            <span>RM {total.toFixed(2)}</span>
          </div>
          {business?.name ? (
            <p className="text-xs text-gray-400 pt-1">
              Paid at {business.name}, {new Date().toLocaleString('en-MY')}
            </p>
          ) : null}
        </section>

        <Button
          type="button"
          size="lg"
          className="w-full"
          loading={submitting}
          onClick={handleCheckout}
          disabled={lineItems.length === 0 || total <= 0}
        >
          Complete payment · RM {total.toFixed(2)}
        </Button>
      </main>
    </div>
  );
}
