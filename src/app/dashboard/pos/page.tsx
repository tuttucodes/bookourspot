'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { Calendar, Clock, Plus, Receipt, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { goToCustomerHome } from '@/lib/navigation';
import { getMyBusiness, getBusinessAppointments, getServices } from '@/lib/api';
import { formatTime } from '@/lib/slots';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Appointment, Business, Service } from '@/lib/types';

export default function PosIndexPage() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const [showWalkin, setShowWalkin] = useState(false);
  const [walkinForm, setWalkinForm] = useState({
    name: '',
    phone: '',
    serviceId: '',
    durationMinutes: '',
  });
  const [submittingWalkin, setSubmittingWalkin] = useState(false);
  const [walkinError, setWalkinError] = useState<string | null>(null);

  const today = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  useEffect(() => {
    if (authLoading) return;
    if (!profile || profile.role !== 'merchant') {
      goToCustomerHome();
      return;
    }

    (async () => {
      try {
        const biz = await getMyBusiness();
        if (!biz) {
          router.push('/dashboard/onboarding');
          return;
        }
        setBusiness(biz);
        const [list, svcs] = await Promise.all([
          getBusinessAppointments(biz.id, today),
          getServices(biz.id),
        ]);
        setAppointments(list);
        setServices(svcs);
      } catch (err) {
        console.error('POS index load failed:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading, profile, router, today]);

  const pending = appointments.filter((a) => a.status === 'booked');

  async function submitWalkin(e: React.FormEvent) {
    e.preventDefault();
    setWalkinError(null);
    if (!walkinForm.name.trim()) {
      setWalkinError('Customer name is required.');
      return;
    }
    setSubmittingWalkin(true);
    try {
      const res = await fetch('/api/merchant/walkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walkin_name: walkinForm.name.trim(),
          walkin_phone: walkinForm.phone.trim() || undefined,
          service_id: walkinForm.serviceId || undefined,
          duration_minutes: walkinForm.durationMinutes
            ? Number(walkinForm.durationMinutes)
            : undefined,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Failed to add walk-in');
      if (payload.appointment?.id) {
        router.push(`/dashboard/pos/${payload.appointment.id}`);
      }
    } catch (err) {
      setWalkinError(err instanceof Error ? err.message : 'Failed to add walk-in');
    } finally {
      setSubmittingWalkin(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f3f2] pb-28 md:pb-8 md:pl-28 lg:pl-32">
      <Header title="POS" />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#006273]">Point of Sale</p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">Checkout queue</h1>
            <p className="mt-1 text-sm text-gray-500">
              {business?.name ? `${business.name} · ` : ''}
              {format(new Date(), 'EEE, d MMM yyyy')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setWalkinError(null);
                setShowWalkin(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#006273] to-[#107c91] px-4 py-2 text-xs font-semibold text-white hover:opacity-95"
            >
              <Plus size={14} />
              Add walk-in
            </button>
            <Link
              href="/dashboard/receipts"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e2e1] bg-white px-4 py-2 text-xs font-semibold text-[#006273] hover:bg-[#f6f3f2]"
            >
              <Receipt size={14} />
              Receipts
            </Link>
          </div>
        </header>

        {loading ? (
          <p className="rounded-2xl bg-white p-6 text-sm text-gray-500 shadow-sm">Loading appointments…</p>
        ) : pending.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <Calendar className="mx-auto mb-3 text-gray-400" size={32} />
            <p className="text-sm font-semibold text-gray-700">No open checkouts today</p>
            <p className="mt-1 text-xs text-gray-500">
              Bookings with status <span className="font-medium">booked</span> show up here, or add a walk-in.
            </p>
            <Link
              href="/dashboard/bookings"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#006273] to-[#107c91] px-4 py-2 text-xs font-semibold text-white hover:opacity-95"
            >
              Open bookings
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {pending.map((apt) => {
              const display =
                apt.user?.name ||
                (apt as Appointment & { walkin_name?: string | null }).walkin_name ||
                'Guest';
              return (
                <li key={apt.id} className="rounded-2xl bg-white p-4 shadow-sm">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900">{display}</p>
                      <p className="truncate text-sm text-gray-600">{apt.service?.name || 'Service'}</p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-[#006273]">
                      {apt.service?.price != null ? `RM ${Number(apt.service.price).toFixed(2)}` : '—'}
                    </p>
                  </div>

                  <div className="mb-3 flex items-center gap-1.5 text-xs text-gray-500">
                    <Clock size={12} className="text-gray-400" />
                    {formatTime(apt.start_time)} – {formatTime(apt.end_time)}
                  </div>

                  <Link
                    href={`/dashboard/pos/${apt.id}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#006273] to-[#107c91] px-4 py-2 text-xs font-semibold text-white hover:opacity-95"
                  >
                    <Receipt size={12} />
                    Checkout
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <BottomNav />

      {showWalkin && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-3xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Add walk-in</h2>
              <button
                onClick={() => setShowWalkin(false)}
                className="rounded-full p-1.5 hover:bg-gray-100"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitWalkin} className="space-y-3">
              <Input
                label="Customer name"
                required
                value={walkinForm.name}
                onChange={(e) => setWalkinForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Ahmad"
              />
              <Input
                label="Phone (optional)"
                value={walkinForm.phone}
                onChange={(e) => setWalkinForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+60…"
                inputMode="tel"
              />

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
                  Service
                </span>
                <select
                  className="w-full rounded-xl border border-[#e5e2e1] bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#006273] focus:outline-none"
                  value={walkinForm.serviceId}
                  onChange={(e) => setWalkinForm((f) => ({ ...f, serviceId: e.target.value }))}
                >
                  <option value="">No service (custom checkout)</option>
                  {services
                    .filter((s) => s.is_active)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} · RM {Number(s.price).toFixed(2)} · {s.duration_minutes}m
                      </option>
                    ))}
                </select>
              </label>

              <Input
                label="Duration (minutes, optional)"
                type="number"
                min={5}
                max={360}
                value={walkinForm.durationMinutes}
                onChange={(e) =>
                  setWalkinForm((f) => ({ ...f, durationMinutes: e.target.value }))
                }
                placeholder="Auto from service"
              />

              {walkinError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{walkinError}</p>
              )}

              <div className="flex gap-2 pt-1">
                <Button type="submit" loading={submittingWalkin} className="flex-1">
                  Start checkout
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowWalkin(false)}
                  disabled={submittingWalkin}
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
