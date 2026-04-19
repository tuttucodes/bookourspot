'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { Calendar, Clock, Receipt } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { goToCustomerHome } from '@/lib/navigation';
import { getMyBusiness, getBusinessAppointments } from '@/lib/api';
import { formatTime } from '@/lib/slots';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import type { Appointment, Business } from '@/lib/types';

export default function PosIndexPage() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

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
        const list = await getBusinessAppointments(biz.id, today);
        setAppointments(list);
      } catch (err) {
        console.error('POS index load failed:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading, profile, router, today]);

  const pending = appointments.filter((a) => a.status === 'booked');

  return (
    <div className="min-h-screen bg-[#f6f3f2] pb-28 md:pb-8 md:pl-28 lg:pl-32">
      <Header title="POS" />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#006273]">Point of Sale</p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">Checkout queue</h1>
            <p className="mt-1 text-sm text-gray-500">
              {business?.name ? `${business.name} · ` : ''}
              {format(new Date(), 'EEE, d MMM yyyy')}
            </p>
          </div>
          <Link
            href="/dashboard/receipts"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e2e1] bg-white px-4 py-2 text-xs font-semibold text-[#006273] hover:bg-[#f6f3f2]"
          >
            <Receipt size={14} />
            Receipts
          </Link>
        </header>

        {loading ? (
          <p className="rounded-2xl bg-white p-6 text-sm text-gray-500 shadow-sm">Loading appointments…</p>
        ) : pending.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <Calendar className="mx-auto mb-3 text-gray-400" size={32} />
            <p className="text-sm font-semibold text-gray-700">No open checkouts today</p>
            <p className="mt-1 text-xs text-gray-500">
              Appointments marked <span className="font-medium">booked</span> appear here for payment.
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
            {pending.map((apt) => (
              <li key={apt.id} className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900">
                      {apt.user?.name || 'Guest'}
                    </p>
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
            ))}
          </ul>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
