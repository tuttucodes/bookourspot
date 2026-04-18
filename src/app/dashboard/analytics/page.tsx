'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getMyBusiness, getDashboardStats, getBusinessAppointments, getBusinessCustomers } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { Button } from '@/components/ui/Button';
import type { Appointment, Business } from '@/lib/types';
import { goToCustomerHome } from '@/lib/navigation';

type CustomerRow = {
  user: { id: string }[] | null;
  date: string;
  status: string;
  service?: { name?: string; price?: number }[] | null;
};

export default function MerchantAnalyticsPage() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customerRows, setCustomerRows] = useState<CustomerRow[]>([]);
  const [stats, setStats] = useState<{ todayBookings: number; totalBookings: number; completedServices: number; totalRevenue: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'weekly' | 'monthly'>('weekly');

  useEffect(() => {
    if (authLoading) return;
    if (!profile || profile.role !== 'merchant') {
      goToCustomerHome();
      return;
    }

    const load = async () => {
      try {
        const biz = await getMyBusiness();
        if (!biz) {
          router.push('/dashboard/onboarding');
          return;
        }
        setBusiness(biz);
        const [statsData, appointmentRows, customers] = await Promise.all([
          getDashboardStats(biz.id),
          getBusinessAppointments(biz.id),
          getBusinessCustomers(biz.id),
        ]);
        setStats(statsData);
        setAppointments(appointmentRows);
        setCustomerRows(((customers as unknown) as CustomerRow[]) || []);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [authLoading, profile, router]);

  const serviceDistribution = useMemo(() => {
    const totals = new Map<string, number>();
    appointments.forEach((apt) => {
      const key = apt.service?.name || 'Unknown';
      totals.set(key, (totals.get(key) || 0) + 1);
    });
    const values = Array.from(totals.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
    const total = values.reduce((sum, item) => sum + item.count, 0) || 1;
    return values.map((item) => ({ ...item, pct: Math.round((item.count / total) * 100) }));
  }, [appointments]);

  const peakHour = useMemo(() => {
    const buckets = new Map<string, number>();
    appointments.forEach((apt) => {
      const hour = `${apt.start_time.slice(0, 2)}:00`;
      buckets.set(hour, (buckets.get(hour) || 0) + 1);
    });
    return Array.from(buckets.entries()).sort((a, b) => b[1] - a[1])[0];
  }, [appointments]);

  const customerComposition = useMemo(() => {
    const visits = new Map<string, number>();
    customerRows.forEach((row) => {
      const user = row.user?.[0];
      if (!user?.id) return;
      visits.set(user.id, (visits.get(user.id) || 0) + 1);
    });
    const values = Array.from(visits.values());
    const returning = values.filter((count) => count > 1).length;
    const total = values.length || 1;
    const newly = values.filter((count) => count === 1).length;
    return {
      returningPct: Math.round((returning / total) * 100),
      newPct: Math.round((newly / total) * 100),
    };
  }, [customerRows]);

  const leaderboard = useMemo(() => {
    const serviceRevenue = new Map<string, number>();
    appointments.forEach((apt) => {
      const key = apt.service?.name || 'Unknown Service';
      const amount = Number(apt.service?.price || 0);
      serviceRevenue.set(key, (serviceRevenue.get(key) || 0) + amount);
    });
    return Array.from(serviceRevenue.entries())
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3);
  }, [appointments]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#fcf9f8]">
        <Header title="Business Insights" showBack />
        <main className="app-content-compact pb-24 pt-6">
          <div className="space-y-4 animate-pulse">
            <div className="h-64 rounded-3xl bg-white" />
            <div className="h-64 rounded-3xl bg-white" />
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcf9f8]">
      <Header title="Business Insights" showBack />

      <main className="app-content pb-24 pt-6">
        <div className="mb-6 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Performance Dashboard</h2>
            <p className="mt-1 text-sm uppercase tracking-[0.08em] text-gray-500">{business?.name}</p>
          </div>
          <div className="rounded-full bg-[#f0eded] p-1">
            <Button
              variant={range === 'weekly' ? 'primary' : 'ghost'}
              size="sm"
              className={range === 'weekly' ? 'rounded-full bg-[#006273]' : 'rounded-full'}
              onClick={() => setRange('weekly')}
            >
              Weekly
            </Button>
            <Button
              variant={range === 'monthly' ? 'primary' : 'ghost'}
              size="sm"
              className={range === 'monthly' ? 'rounded-full bg-[#006273]' : 'rounded-full'}
              onClick={() => setRange('monthly')}
            >
              Monthly
            </Button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4">
          <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#006273]">Total Revenue</p>
                <h3 className="text-4xl font-black tracking-tight text-gray-900">RM {Number(stats?.totalRevenue || 0).toFixed(2)}</h3>
                <span className="mt-2 inline-block rounded-full bg-[#ebfaff] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#006273]">
                  {range === 'weekly' ? 'Weekly view' : 'Monthly view'}
                </span>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-gray-500">Avg Ticket</p>
                <p className="text-xl font-bold text-gray-900">
                  RM {stats?.completedServices ? (Number(stats.totalRevenue) / Math.max(stats.completedServices, 1)).toFixed(2) : '0.00'}
                </p>
              </div>
            </div>

            <div className="flex h-44 items-end gap-2">
              {[40, 65, 55, 85, 70, 100, 60].map((height, index) => (
                <div key={index} className="flex-1 rounded-t-xl bg-[#006273]/10 hover:bg-[#006273]/20" style={{ height: `${height}%` }} />
              ))}
            </div>
          </section>

          <section className="grid grid-cols-2 gap-4">
            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">New Clients</p>
              <p className="mt-2 text-3xl font-black text-gray-900">{customerComposition.newPct}%</p>
            </div>
            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Returning</p>
              <p className="mt-2 text-3xl font-black text-[#006273]">{customerComposition.returningPct}%</p>
            </div>
          </section>

          <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
            <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Service Distribution</h4>
            <div className="space-y-3">
              {serviceDistribution.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${index === 0 ? 'bg-[#006273]' : index === 1 ? 'bg-[#843ab4]' : 'bg-[#96636d]'}`} />
                    <span className="text-sm font-medium text-gray-700">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{item.pct}%</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl bg-[#107c91] p-5 text-white shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-white/80">Peak Booking Times</p>
            <p className="mt-2 text-2xl font-black">
              {peakHour ? `${peakHour[0]} - ${String(Number(peakHour[0].slice(0, 2)) + 1).padStart(2, '0')}:00` : 'No peak time yet'}
            </p>
            <p className="mt-2 text-sm text-white/90">
              {peakHour ? `${peakHour[1]} appointments start during this hour.` : 'Bookings will appear as customers schedule visits.'}
            </p>
          </section>

          <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
            <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Top Revenue Services</h4>
            <div className="space-y-4">
              {leaderboard.map((item, index) => (
                <div key={item.name}>
                  <div className="mb-1 flex justify-between">
                    <p className="text-sm font-bold text-gray-900">{item.name}</p>
                    <p className="text-xs font-bold text-[#006273]">RM {item.revenue.toFixed(2)}</p>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#f0eded]">
                    <div
                      className="h-full rounded-full bg-[#006273]"
                      style={{ width: `${Math.max(25, 100 - index * 20)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
