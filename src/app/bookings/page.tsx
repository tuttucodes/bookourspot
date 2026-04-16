'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, XCircle, Sparkles, Repeat2 } from 'lucide-react';
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
    <div className="min-h-screen bg-[#fcf9f8]">
      <Header title="My Appointments" />

      <main className="mx-auto max-w-2xl px-4 pb-24 pt-6">
        {/* Tabs */}
        <div className="mb-6 flex gap-2 rounded-full bg-[#f0eded] p-1">
          {(['upcoming', 'past'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-full px-4 py-2.5 text-sm transition-all duration-150
                ${
                  activeTab === tab
                    ? 'bg-white text-[#006273] shadow-sm font-semibold'
                    : 'text-gray-500 hover:text-gray-700 font-medium'
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
          <>
            <div className="mb-3 flex items-baseline justify-between px-1">
              <h2 className="text-xs font-bold uppercase tracking-[0.1em] text-gray-500">
                {activeTab === 'upcoming' ? 'Active Bookings' : 'Booking History'}
              </h2>
              <span className="rounded-full border border-gray-200 px-2 py-0.5 text-[10px] text-gray-500">
                {displayed.length} appointments
              </span>
            </div>
            <div className="space-y-4">
              {displayed.map((booking) => (
                <div
                  key={booking.id}
                  className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-md"
                >
                  <div className="p-4 md:p-5">
                    {/* Business name */}
                    <div className="mb-2 flex items-start justify-between">
                      <h3 className="text-base font-bold text-gray-900">
                        {booking.business?.name || 'Unknown Business'}
                      </h3>
                      <StatusBadge status={booking.status} />
                    </div>

                    {/* Service and price */}
                    <p className="mb-2 text-sm text-gray-600">
                      {booking.service?.name || 'Service'}
                      <span className="mx-1.5 text-gray-300">|</span>
                      <span className="font-semibold text-[#006273]">
                        RM {booking.service?.price?.toFixed(2) || '0.00'}
                      </span>
                    </p>

                    {/* Date and time */}
                    <div className="mb-2 flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-gray-400" />
                        {format(new Date(booking.date + 'T00:00:00'), 'EEE, d MMM yyyy')}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={14} className="text-gray-400" />
                        {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                      </span>
                    </div>

                    {booking.business?.location && (
                      <p className="text-xs text-gray-500">{booking.business.location}</p>
                    )}

                    {activeTab === 'upcoming' && booking.status === 'booked' && (
                      <p className="mt-3 text-xs text-green-700">
                        100% free cancellation. Payment is made in person by cash or card.
                      </p>
                    )}
                  </div>

                  {activeTab === 'upcoming' && booking.status === 'booked' && (
                    <div className="flex gap-3 border-t border-gray-100 bg-[#f6f3f2] px-4 py-3 md:px-5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 rounded-full border-red-200 text-red-600 hover:bg-red-50"
                        loading={cancellingId === booking.id}
                        onClick={() => handleCancel(booking.id)}
                      >
                        <XCircle size={14} className="mr-1.5" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 rounded-full bg-gradient-to-r from-[#006273] to-[#107c91] text-white hover:opacity-95"
                        onClick={() => router.push(`/booking/${booking.id}/confirmed`)}
                      >
                        View Details
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'upcoming' && displayed.length > 0 && (
          <div className="mt-10 grid grid-cols-2 gap-3">
            <div className="aspect-square rounded-2xl bg-[#f4d9ff] p-4 text-[#2f004b]">
              <Sparkles size={22} />
              <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.1em]">Loyalty</p>
              <p className="mt-1 text-sm font-semibold leading-tight">Keep booking to unlock surprise rewards</p>
            </div>
            <div className="aspect-square rounded-2xl bg-[#eae7e7] p-4 text-gray-700">
              <Repeat2 size={22} />
              <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.1em]">Rebook</p>
              <p className="mt-1 text-sm font-semibold leading-tight">Your favorite services are one tap away</p>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
