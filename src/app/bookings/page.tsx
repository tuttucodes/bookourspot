'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { getMyBookings, cancelAppointment } from '@/lib/api';
import { formatTime } from '@/lib/slots';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import type { Appointment } from '@/lib/types';

type Tab = 'upcoming' | 'past';

export default function BookingsPage() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('upcoming');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!profile) {
      router.push('/login');
      return;
    }

    const fetchBookings = async () => {
      try {
        const data = await getMyBookings(profile.id);
        setBookings(data);
      } catch (err) {
        console.error('Failed to fetch bookings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [profile, authLoading, router]);

  const today = new Date().toISOString().split('T')[0];

  const upcoming = bookings.filter(
    (b) => b.status === 'booked' && b.date >= today
  );

  const past = bookings.filter(
    (b) => b.status === 'completed' || b.status === 'cancelled' || b.date < today
  );

  const displayed = activeTab === 'upcoming' ? upcoming : past;

  const handleCancel = async (id: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to cancel this appointment?'
    );
    if (!confirmed) return;

    setCancellingId(id);
    try {
      await cancelAppointment(id);
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b))
      );
    } catch (err) {
      console.error('Failed to cancel:', err);
      alert('Failed to cancel appointment. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="My Bookings" />
        <main className="max-w-lg mx-auto px-4 pt-6 pb-24">
          {/* Tab skeleton */}
          <div className="flex gap-2 mb-6">
            <div className="h-10 w-28 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-10 w-20 bg-gray-200 rounded-xl animate-pulse" />
          </div>
          {/* Card skeletons */}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100 animate-pulse"
            >
              <div className="h-5 w-40 bg-gray-200 rounded mb-3" />
              <div className="h-4 w-56 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-24 bg-gray-200 rounded" />
            </div>
          ))}
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="My Bookings" />

      <main className="max-w-lg mx-auto px-4 pt-6 pb-24">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['upcoming', 'past'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150
                ${
                  activeTab === tab
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
            >
              {tab === 'upcoming' ? `Upcoming (${upcoming.length})` : `Past (${past.length})`}
            </button>
          ))}
        </div>

        {/* Booking Cards */}
        {displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center mb-4">
              <Calendar size={28} className="text-violet-500" />
            </div>
            <p className="text-gray-500 font-medium">
              {activeTab === 'upcoming'
                ? 'No upcoming bookings'
                : 'No past bookings'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {activeTab === 'upcoming'
                ? 'Book a service to get started!'
                : 'Your completed and cancelled bookings will appear here.'}
            </p>
            {activeTab === 'upcoming' && (
              <Button
                variant="primary"
                size="sm"
                className="mt-4"
                onClick={() => router.push('/explore')}
              >
                Explore Services
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {displayed.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 transition-all hover:shadow-md"
              >
                {/* Business name */}
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">
                    {booking.business?.name || 'Unknown Business'}
                  </h3>
                  <StatusBadge status={booking.status} />
                </div>

                {/* Service and price */}
                <p className="text-sm text-gray-600 mb-2">
                  {booking.service?.name || 'Service'}
                  <span className="mx-1.5 text-gray-300">|</span>
                  <span className="font-medium text-violet-600">
                    RM {booking.service?.price?.toFixed(2) || '0.00'}
                  </span>
                </p>

                {/* Date and time */}
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-gray-400" />
                    {format(new Date(booking.date + 'T00:00:00'), 'EEE, d MMM yyyy')}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} className="text-gray-400" />
                    {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                  </span>
                </div>

                {/* Cancel button for upcoming booked appointments */}
                {activeTab === 'upcoming' && booking.status === 'booked' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    loading={cancellingId === booking.id}
                    onClick={() => handleCancel(booking.id)}
                  >
                    <XCircle size={14} className="mr-1.5" />
                    Cancel Appointment
                  </Button>
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
