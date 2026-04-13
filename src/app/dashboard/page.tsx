'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, CalendarDays, CheckCircle, DollarSign, Clock, Plus, List } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
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
      router.push('/');
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
      <div className="min-h-screen bg-gray-50">
        <Header title="Dashboard" />
        <main className="max-w-lg mx-auto px-4 pt-6 pb-24">
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
    <div className="min-h-screen bg-gray-50">
      <Header title={business?.name || 'Dashboard'} />

      <main className="max-w-lg mx-auto px-4 pt-6 pb-24">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className={`rounded-2xl p-4 shadow-sm border border-gray-100 ${card.color} bg-white`}
              >
                <div className={`w-9 h-9 rounded-xl ${card.iconBg} flex items-center justify-center mb-3`}>
                  <Icon size={18} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 mb-6">
          <Link href="/dashboard/bookings" className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <Plus size={16} className="mr-1.5" />
              Add Booking
            </Button>
          </Link>
          <Link href="/dashboard/bookings" className="flex-1">
            <Button variant="secondary" size="sm" className="w-full">
              <List size={16} className="mr-1.5" />
              View All Bookings
            </Button>
          </Link>
        </div>

        {/* Today's Schedule */}
        <h2 className="text-base font-semibold text-gray-900 mb-3">
          Today&apos;s Schedule
        </h2>

        {appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Calendar size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No appointments today</p>
            <p className="text-gray-400 text-sm mt-1">Your schedule is clear for today.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {apt.user?.name || 'Walk-in Customer'}
                    </h3>
                    <p className="text-sm text-gray-500">{apt.service?.name || 'Service'}</p>
                  </div>
                  <StatusBadge status={apt.status} />
                </div>

                <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
                  <Clock size={14} className="text-gray-400" />
                  {formatTime(apt.start_time)} - {formatTime(apt.end_time)}
                </div>

                {apt.status === 'booked' && (
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      loading={actionLoading === apt.id}
                      onClick={() => handleMarkComplete(apt.id)}
                    >
                      <CheckCircle size={14} className="mr-1.5" />
                      Mark Complete
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
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
      </main>

      <BottomNav />
    </div>
  );
}
