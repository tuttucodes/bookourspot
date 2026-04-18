'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, Phone, Plus, X } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import {
  getMyBusiness,
  getBusinessAppointments,
  getServices,
  getAvailableSlots,
  bookAppointment,
  markAsCompleted,
  cancelAppointment,
} from '@/lib/api';
import { formatTime, generateTimeSlots } from '@/lib/slots';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import type { Business, Appointment, Service, AppointmentStatus, TimeSlot } from '@/lib/types';

type StatusFilter = 'all' | AppointmentStatus;

export default function MerchantBookingsPage() {
  const router = useRouter();
  const { profile, authUser, loading: authLoading } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServicesState] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Manual booking modal
  const [showManualBooking, setShowManualBooking] = useState(false);
  const [manualForm, setManualForm] = useState({
    serviceId: '',
    customerName: '',
    customerPhone: '',
    timeSlot: '',
  });
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Generate date range: past 7 days + next 14 days
  const today = new Date();
  const dateRange: string[] = [];
  for (let i = -7; i <= 14; i++) {
    const d = i < 0 ? subDays(today, Math.abs(i)) : addDays(today, i);
    dateRange.push(format(d, 'yyyy-MM-dd'));
  }

  useEffect(() => {
    if (authLoading) return;
    if (!profile || profile.role !== 'merchant') {
      router.push('/');
      return;
    }

    const fetchBusiness = async () => {
      try {
        const biz = await getMyBusiness();
        if (!biz) {
          router.push('/dashboard/onboarding');
          return;
        }
        setBusiness(biz);
        const svcs = await getServices(biz.id);
        setServicesState(svcs);
      } catch (err) {
        console.error('Failed to load business:', err);
      }
    };

    fetchBusiness();
  }, [profile, authLoading, router]);

  useEffect(() => {
    if (!business) return;

    const fetchAppointments = async () => {
      setLoading(true);
      try {
        const data = await getBusinessAppointments(business.id, selectedDate);
        setAppointments(data);
      } catch (err) {
        console.error('Failed to fetch appointments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [business, selectedDate]);

  // Fetch available slots when service changes for manual booking
  useEffect(() => {
    if (!business || !manualForm.serviceId || !showManualBooking) return;

    const fetchSlots = async () => {
      try {
        const existingApts = await getAvailableSlots(business.id, selectedDate);
        const service = services.find((s) => s.id === manualForm.serviceId);
        if (!service) return;

        const slots = generateTimeSlots(
          new Date(selectedDate + 'T00:00:00'),
          business.working_hours,
          service.duration_minutes,
          existingApts
        );
        setAvailableSlots(slots.filter((s) => s.available));
      } catch (err) {
        console.error('Failed to fetch slots:', err);
      }
    };

    fetchSlots();
  }, [business, manualForm.serviceId, selectedDate, showManualBooking, services]);

  const filtered = statusFilter === 'all'
    ? appointments
    : appointments.filter((a) => a.status === statusFilter);

  const handleMarkComplete = async (id: string) => {
    setActionLoading(id);
    try {
      await markAsCompleted(id);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'completed' } : a))
      );
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
    } catch (err) {
      console.error('Failed to cancel:', err);
      alert('Failed to cancel appointment. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleManualBooking = async () => {
    if (!business || !authUser || !manualForm.serviceId || !manualForm.timeSlot || !manualForm.customerName) return;

    const service = services.find((s) => s.id === manualForm.serviceId);
    if (!service) return;

    const [startTime, endTime] = manualForm.timeSlot.split('-');

    setSubmitting(true);
    try {
      const newApt = await bookAppointment({
        business_id: business.id,
        service_id: manualForm.serviceId,
        date: selectedDate,
        start_time: startTime,
        end_time: endTime,
        notes: `Walk-in: ${manualForm.customerName}${manualForm.customerPhone ? ` | ${manualForm.customerPhone}` : ''}`,
        customer_name: manualForm.customerName,
        customer_phone: manualForm.customerPhone || undefined,
      });
      setAppointments((prev) => [...prev, newApt]);
      setShowManualBooking(false);
      setManualForm({ serviceId: '', customerName: '', customerPhone: '', timeSlot: '' });
    } catch (err) {
      console.error('Failed to create booking:', err);
      alert('Failed to create booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const statusFilters: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'booked', label: 'Booked' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  if (authLoading || (!business && loading)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Bookings" showBack />
        <main className="app-content-compact pt-6 pb-24">
          <div className="h-16 bg-gray-200 rounded-xl animate-pulse mb-4" />
          <div className="flex gap-2 mb-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 w-20 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
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

  return (
    <div className="min-h-screen bg-[#fcf9f8]">
      <Header title="Bookings" showBack />

      <main className="app-content pt-4 pb-24">
        <div className="mb-6">
          <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.08em] text-gray-500">
            Current Schedule
          </label>
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">
            {format(new Date(selectedDate + 'T00:00:00'), 'EEEE, d MMM')}
          </h2>
        </div>

        {/* Date Picker - Horizontal Scroll */}
        <div className="mb-4 -mx-4 px-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide md:flex-wrap md:overflow-visible">
            {dateRange.map((date) => {
              const d = new Date(date + 'T00:00:00');
              const isSelected = date === selectedDate;
              const isToday = date === format(today, 'yyyy-MM-dd');
              return (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl text-xs font-medium transition-all
                    ${isSelected
                      ? 'bg-[#006273] text-white shadow-sm ring-4 ring-[#107c91]/10'
                      : 'bg-[#f0eded] text-gray-600 border border-transparent hover:bg-[#e5e2e1]'
                    }`}
                >
                  <span className={`text-[10px] uppercase ${isSelected ? 'text-violet-200' : 'text-gray-400'}`}>
                    {format(d, 'EEE')}
                  </span>
                  <span className="text-lg font-bold">{format(d, 'd')}</span>
                  <span className={`text-[10px] ${isSelected ? 'text-violet-200' : 'text-gray-400'}`}>
                    {format(d, 'MMM')}
                  </span>
                  {isToday && (
                    <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? 'bg-white' : 'bg-violet-500'}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${statusFilter === filter.value
                  ? 'bg-[#006273] text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Appointments List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-pulse">
                <div className="h-5 w-40 bg-gray-200 rounded mb-3" />
                <div className="h-4 w-56 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-32 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Calendar size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No appointments</p>
            <p className="text-gray-400 text-sm mt-1">
              No {statusFilter !== 'all' ? statusFilter : ''} appointments for this date.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {filtered.map((apt) => (
              <div
                key={apt.id}
                className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {apt.user?.name || 'Walk-in Customer'}
                    </h3>
                    {apt.user?.phone && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Phone size={12} />
                        {apt.user.phone}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={apt.status} />
                </div>

                <p className="mb-1 text-sm text-gray-600">{apt.service?.name || 'Service'}</p>

                <div className="mb-3 flex items-center gap-1.5 text-sm text-gray-500">
                  <Clock size={14} className="text-gray-400" />
                  {formatTime(apt.start_time)} - {formatTime(apt.end_time)}
                </div>

                {apt.notes && (
                  <p className="text-xs text-gray-400 mb-3 bg-gray-50 rounded-lg px-3 py-1.5">
                    {apt.notes}
                  </p>
                )}

                {apt.status === 'booked' && (
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/dashboard/pos/${apt.id}`}
                      className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#006273] to-[#107c91] hover:opacity-95"
                    >
                      Checkout
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      loading={actionLoading === apt.id}
                      onClick={() => handleMarkComplete(apt.id)}
                    >
                      Mark Complete (no receipt)
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

        {/* Add Booking Button */}
        <div className="fixed bottom-20 right-4 md:right-8">
          <button
            onClick={() => setShowManualBooking(true)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#006273] to-[#107c91] text-white shadow-lg transition-colors hover:opacity-95"
          >
            <Plus size={24} />
          </button>
        </div>

        {/* Manual Booking Modal */}
        {showManualBooking && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowManualBooking(false)} />
            <div className="relative bg-white rounded-t-3xl w-full max-w-2xl p-6 pb-8 max-h-[85vh] overflow-y-auto md:rounded-3xl md:mb-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Add Manual Booking</h2>
                <button
                  onClick={() => setShowManualBooking(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Customer Name */}
                <Input
                  label="Customer Name"
                  placeholder="Enter customer name"
                  value={manualForm.customerName}
                  onChange={(e) => setManualForm({ ...manualForm, customerName: e.target.value })}
                />

                {/* Customer Phone */}
                <Input
                  label="Phone Number (optional)"
                  placeholder="e.g. 012-345-6789"
                  value={manualForm.customerPhone}
                  onChange={(e) => setManualForm({ ...manualForm, customerPhone: e.target.value })}
                />

                {/* Service Selection */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">Service</label>
                  <select
                    value={manualForm.serviceId}
                    onChange={(e) => setManualForm({ ...manualForm, serviceId: e.target.value, timeSlot: '' })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  >
                    <option value="">Select a service</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} - RM {s.price.toFixed(2)} ({s.duration_minutes} min)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Time Slot Selection */}
                {manualForm.serviceId && (
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">Time Slot</label>
                    {availableSlots.length === 0 ? (
                      <p className="text-sm text-gray-400">No available slots for this date.</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {availableSlots.map((slot) => {
                          const val = `${slot.start}-${slot.end}`;
                          const isSelected = manualForm.timeSlot === val;
                          return (
                            <button
                              key={val}
                              onClick={() => setManualForm({ ...manualForm, timeSlot: val })}
                              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all
                                ${isSelected
                                  ? 'bg-violet-600 text-white'
                                  : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                                }`}
                            >
                              {formatTime(slot.start)}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full mt-4"
                  loading={submitting}
                  disabled={!manualForm.customerName || !manualForm.serviceId || !manualForm.timeSlot}
                  onClick={handleManualBooking}
                >
                  Create Booking
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
