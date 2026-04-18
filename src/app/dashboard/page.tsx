'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, CalendarDays, CheckCircle, DollarSign, Clock, Plus, List, TrendingUp, Bell, UserPlus, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { goToCustomerHome } from '@/lib/navigation';
import {
  getMyBusiness,
  getDashboardStats,
  getBusinessAppointments,
  markAsCompleted,
  cancelAppointment,
} from '@/lib/api';
import { formatTime } from '@/lib/slots';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import type { Business, Appointment } from '@/lib/types';

interface DashboardStats {
  todayBookings: number;
  totalBookings: number;
  completedServices: number;
  totalRevenue: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!profile || profile.role !== 'merchant') {
      goToCustomerHome();
      return;
    }

    const fetchData = async () => {
      try {
        const biz = await getMyBusiness();
        if (!biz) {
          router.push('/dashboard/onboarding');
          return;
        }
        setBusiness(biz);

        const today = new Date().toISOString().split('T')[0];
        const [statsData, appointmentsData] = await Promise.all([
          getDashboardStats(biz.id),
          getBusinessAppointments(biz.id, today),
        ]);
        setStats(statsData);
        setAppointments(appointmentsData);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile, authLoading, router]);

  const handleMarkComplete = async (id: string) => {
    setActionLoading(id);
    try {
      await markAsCompleted(id);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'completed' } : a))
      );
      if (stats) {
        setStats({
          ...stats,
          completedServices: stats.completedServices + 1,
          todayBookings: Math.max(0, stats.todayBookings - 1),
        });
      }
    } catch (err) {
      console.error('Failed to mark as completed:', err);
      alert('Failed to mark as completed. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id: string) => {
    const confirmed = window.confirm('Are you sure you want to cancel this appointment?');
    if (!confirmed) return;

    setActionLoading(id);
    try {
      await cancelAppointment(id);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'cancelled' } : a))
      );
      if (stats) {
        setStats({
          ...stats,
          todayBookings: Math.max(0, stats.todayBookings - 1),
        });
      }
    } catch (err) {
      console.error('Failed to cancel:', err);
      alert('Failed to cancel appointment. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const formatRevenue = (amount: number) => {
    return `RM ${amount.toLocaleString('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#fcf9f8]">
        <Header title="Dashboard" />
        <main className="app-content-compact pt-6 pb-24">
          {/* Stat card skeletons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-pulse">
                <div className="h-8 w-8 bg-gray-200 rounded-lg mb-3" />
                <div className="h-6 w-12 bg-gray-200 rounded mb-1" />
                <div className="h-4 w-24 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
          {/* Schedule skeleton */}
          <div className="h-6 w-36 bg-gray-200 rounded mb-4 animate-pulse" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100 animate-pulse">
              <div className="h-5 w-40 bg-gray-200 rounded mb-3" />
              <div className="h-4 w-56 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-32 bg-gray-200 rounded" />
            </div>
          ))}
        </main>
        <BottomNav />
      </div>
    );
  }

  const statCards = [
    {
      label: "Today's Bookings",
      value: stats?.todayBookings ?? 0,
      icon: Calendar,
      color: 'bg-blue-50 text-blue-600',
      iconBg: 'bg-blue-100',
    },
    {
      label: 'Total Bookings',
      value: stats?.totalBookings ?? 0,
      icon: CalendarDays,
      color: 'bg-violet-50 text-violet-600',
      iconBg: 'bg-violet-100',
    },
    {
      label: 'Completed',
      value: stats?.completedServices ?? 0,
      icon: CheckCircle,
      color: 'bg-green-50 text-green-600',
      iconBg: 'bg-green-100',
    },
    {
      label: 'Revenue',
      value: formatRevenue(stats?.totalRevenue ?? 0),
      icon: DollarSign,
      color: 'bg-amber-50 text-amber-600',
      iconBg: 'bg-amber-100',
    },
  ];

  return (
    <div className="min-h-screen bg-[#fcf9f8]">
      <Header
        title={business?.name || 'Dashboard'}
        rightAction={
          <button className="rounded-full p-2 text-[#006273] transition-colors hover:bg-[#f0eded]">
            <Bell size={18} />
          </button>
        }
      />

      <main className="app-content pb-24 pt-6">
        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <section className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm lg:col-span-2">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.08em] text-gray-500">
              Total Revenue Today
            </p>
            <h2 className="text-4xl font-extrabold tracking-tight text-gray-900">
              {formatRevenue(stats?.totalRevenue ?? 0)}
            </h2>
            <div className="mt-2 flex items-center gap-1 text-[#006273]">
              <TrendingUp size={14} />
              <span className="text-xs font-semibold">
                {stats?.todayBookings ? `${stats.todayBookings} active bookings today` : 'Ready for new bookings'}
              </span>
            </div>
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#006273]/5 blur-3xl" />
          </section>

          <section className="rounded-3xl bg-[#006273] p-6 text-white shadow-sm">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.08em] text-white/80">
              Today&apos;s Schedule
            </p>
            <h3 className="text-3xl font-bold">{stats?.todayBookings ?? 0} Appointments</h3>
            <div className="mt-6">
              <div className="mb-2 flex items-end justify-between text-xs">
                <span>Progress</span>
                <span className="font-bold">
                  {stats?.todayBookings
                    ? `${Math.min(stats.completedServices, stats.todayBookings)}/${stats.todayBookings}`
                    : '0/0'}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-white transition-all"
                  style={{
                    width: stats?.todayBookings
                      ? `${Math.min(100, (stats.completedServices / Math.max(stats.todayBookings, 1)) * 100)}%`
                      : '0%',
                  }}
                />
              </div>
            </div>
          </section>
        </div>

        <section className="mb-6 grid grid-cols-3 gap-3 md:grid-cols-6">
          <Link
            href="/dashboard/bookings"
            className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-[#f0eded] p-4 text-center transition-colors hover:bg-[#e5e2e1]"
          >
            <Plus size={18} className="text-[#006273]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600">Add Appt</span>
          </Link>
          <Link
            href="/dashboard/bookings"
            className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-[#f0eded] p-4 text-center transition-colors hover:bg-[#e5e2e1]"
          >
            <UserPlus size={18} className="text-[#006273]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600">New Client</span>
          </Link>
          <Link
            href="/dashboard/services"
            className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-[#f0eded] p-4 text-center transition-colors hover:bg-[#e5e2e1]"
          >
            <List size={18} className="text-[#006273]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600">Services</span>
          </Link>
        </section>

        <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link
            href="/dashboard/clients"
            className="rounded-2xl bg-white p-4 text-center shadow-sm transition-colors hover:bg-[#f6f3f2]"
          >
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#006273]">Clients</p>
          </Link>
          <Link
            href="/dashboard/analytics"
            className="rounded-2xl bg-white p-4 text-center shadow-sm transition-colors hover:bg-[#f6f3f2]"
          >
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#006273]">Analytics</p>
          </Link>
          <Link
            href="/dashboard/staff"
            className="rounded-2xl bg-white p-4 text-center shadow-sm transition-colors hover:bg-[#f6f3f2]"
          >
            <div className="flex items-center justify-center gap-1 text-xs font-bold uppercase tracking-[0.08em] text-[#006273]">
              <Users size={14} />
              Staff
            </div>
          </Link>
          <Link
            href="/dashboard/settings"
            className="rounded-2xl bg-white p-4 text-center shadow-sm transition-colors hover:bg-[#f6f3f2]"
          >
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#006273]">Settings</p>
          </Link>
        </section>

        <section className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f6f3f2] text-[#006273]">
                  <Icon size={18} />
                </div>
                <p className="text-2xl font-bold tracking-tight text-gray-900">{card.value}</p>
                <p className="mt-0.5 text-xs text-gray-500">{card.label}</p>
              </div>
            );
          })}
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-gray-900">Upcoming Appointments</h2>
            <Link href="/dashboard/bookings" className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#006273]">
              View All
            </Link>
          </div>

          {appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#f0eded]">
                <Calendar size={24} className="text-gray-400" />
              </div>
              <p className="font-medium text-gray-500">No appointments today</p>
              <p className="mt-1 text-sm text-gray-400">Your schedule is clear for today.</p>
            </div>
          ) : (
            <div className="grid gap-3 xl:grid-cols-2">
              {appointments.map((apt) => (
                <div key={apt.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {apt.user?.name || 'Walk-in Customer'}
                      </h3>
                      <p className="text-sm text-gray-500">{apt.service?.name || 'Service'}</p>
                    </div>
                    <StatusBadge status={apt.status} />
                  </div>

                  <div className="mb-3 flex items-center gap-1.5 text-sm text-gray-500">
                    <Clock size={14} className="text-gray-400" />
                    {formatTime(apt.start_time)} - {formatTime(apt.end_time)}
                  </div>

                  {apt.status === 'booked' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        loading={actionLoading === apt.id}
                        className="bg-gradient-to-r from-[#006273] to-[#107c91] hover:opacity-95"
                        onClick={() => handleMarkComplete(apt.id)}
                      >
                        <CheckCircle size={14} className="mr-1.5" />
                        Mark Complete
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-200 text-red-600 hover:bg-red-50"
                        loading={actionLoading === apt.id}
                        onClick={() => handleCancel(apt.id)}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
