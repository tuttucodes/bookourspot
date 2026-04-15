'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { format, addDays } from 'date-fns';
import { Clock, Check, ChevronRight, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { getBusiness, getServices, getAvailableSlots, bookAppointment } from '@/lib/api';
import { generateTimeSlots, formatTime } from '@/lib/slots';
import type { Business, Service, TimeSlot } from '@/lib/types';

type Step = 'service' | 'date' | 'time' | 'confirm';

function BookingFlow() {
  const { id: businessId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { authUser, profile, loading: authLoading } = useAuth();

  // Data state
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Selection state
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // Contact form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  // Current step
  const preSelectedServiceId = searchParams.get('service');
  const [step, setStep] = useState<Step>(preSelectedServiceId ? 'date' : 'service');

  // Generate next 14 days
  const next14Days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 14 }, (_, i) => addDays(today, i));
  }, []);

  // Fetch business and services
  useEffect(() => {
    if (!businessId) return;
    setLoadingData(true);
    Promise.all([getBusiness(businessId), getServices(businessId)])
      .then(([biz, svcs]) => {
        setBusiness(biz);
        setServices(svcs);
        // Pre-select service if provided via query param
        if (preSelectedServiceId) {
          const found = svcs.find((s) => s.id === preSelectedServiceId);
          if (found) setSelectedService(found);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingData(false));
  }, [businessId, preSelectedServiceId]);

  // Pre-fill contact info from profile
  useEffect(() => {
    if (profile) {
      setCustomerName(profile.name || '');
      if (profile.phone) setCustomerPhone(profile.phone);
      if (profile.email) setCustomerEmail(profile.email);
    }
  }, [profile]);

  // Fetch available slots when date changes
  useEffect(() => {
    if (!selectedDate || !selectedService || !business) return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    getAvailableSlots(businessId, dateStr)
      .then((appointments) => {
        const slots = generateTimeSlots(
          selectedDate,
          business.working_hours,
          selectedService.duration_minutes,
          appointments
        );
        setTimeSlots(slots);
      })
      .catch(() => setTimeSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, selectedService, business, businessId]);

  // Handle service selection
  function handleSelectService(service: Service) {
    setSelectedService(service);
    setStep('date');
  }

  // Handle date selection
  function handleSelectDate(date: Date) {
    setSelectedDate(date);
    setStep('time');
  }

  // Handle time slot selection
  function handleSelectSlot(slot: TimeSlot) {
    if (!slot.available) return;
    setSelectedSlot(slot);
    setStep('confirm');
  }

  // Handle booking confirmation
  async function handleConfirmBooking() {
    if (!authUser) {
      router.push(`/login?redirect=/business/${businessId}/book?service=${selectedService?.id}`);
      return;
    }
    if (!selectedService || !selectedDate || !selectedSlot || !customerPhone.trim()) return;

    setSubmitting(true);
    try {
      const appointment = await bookAppointment({
        business_id: businessId,
        service_id: selectedService.id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        start_time: selectedSlot.start,
        end_time: selectedSlot.end,
        notes: customerEmail ? `Email: ${customerEmail}` : undefined,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail || undefined,
      });
      router.push(`/booking/${appointment.id}/confirmed`);
    } catch {
      alert('Failed to book appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // Go back one step
  function handleBack() {
    if (step === 'confirm') setStep('time');
    else if (step === 'time') setStep('date');
    else if (step === 'date') {
      if (preSelectedServiceId) {
        router.back();
      } else {
        setStep('service');
      }
    } else {
      router.back();
    }
  }

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Book Appointment" showBack />
        <div className="max-w-lg mx-auto px-4 pt-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded-lg w-1/2" />
            <div className="h-4 bg-gray-100 rounded-lg w-1/3" />
            <div className="space-y-3 mt-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-white rounded-2xl border border-gray-100" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Not Found" showBack />
        <div className="text-center py-20">
          <p className="text-gray-500">Business not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <Header title="Book Appointment" showBack />

      <div className="max-w-lg mx-auto px-4 pt-5">
        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-6">
          {(['service', 'date', 'time', 'confirm'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                  step === s
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-200'
                    : (['service', 'date', 'time', 'confirm'] as Step[]).indexOf(step) > i
                    ? 'bg-violet-100 text-violet-600'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {(['service', 'date', 'time', 'confirm'] as Step[]).indexOf(step) > i ? (
                  <Check size={14} />
                ) : (
                  i + 1
                )}
              </div>
              {i < 3 && (
                <div
                  className={`w-6 h-0.5 rounded-full transition-all ${
                    (['service', 'date', 'time', 'confirm'] as Step[]).indexOf(step) > i
                      ? 'bg-violet-300'
                      : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Business name */}
        <p className="text-sm text-gray-500 mb-4">{business.name}</p>

        {/* Step 1: Service Selection */}
        {step === 'service' && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Select a Service</h2>
            {services.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                <p className="text-sm text-gray-400">No services available.</p>
              </div>
            ) : (
              services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => handleSelectService(service)}
                  className={`w-full text-left bg-white rounded-2xl border p-4 transition-all active:scale-[0.98] ${
                    selectedService?.id === service.id
                      ? 'border-violet-400 shadow-md shadow-violet-100'
                      : 'border-gray-100 hover:border-violet-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900">{service.name}</h3>
                      {service.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{service.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock size={12} className="text-violet-400" />
                          {service.duration_minutes} min
                        </span>
                        <span className="text-sm font-semibold text-violet-600">
                          RM {service.price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-300 shrink-0" />
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Step 2: Date Selection */}
        {step === 'date' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Pick a Date</h2>
              <button onClick={handleBack} className="text-sm text-violet-600 font-medium">
                Back
              </button>
            </div>

            {selectedService && (
              <div className="bg-violet-50 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                  <Clock size={18} className="text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{selectedService.name}</p>
                  <p className="text-xs text-gray-500">
                    {selectedService.duration_minutes} min &middot; RM {selectedService.price.toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {next14Days.map((date) => {
                const isSelected = selectedDate && format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => handleSelectDate(date)}
                    className={`flex-shrink-0 w-16 py-3 rounded-2xl flex flex-col items-center gap-1 transition-all active:scale-95 ${
                      isSelected
                        ? 'bg-violet-600 text-white shadow-lg shadow-violet-200'
                        : 'bg-white border border-gray-100 text-gray-700 hover:border-violet-200'
                    }`}
                  >
                    <span className={`text-[10px] font-medium uppercase ${isSelected ? 'text-violet-200' : 'text-gray-400'}`}>
                      {format(date, 'EEE')}
                    </span>
                    <span className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                      {format(date, 'd')}
                    </span>
                    <span className={`text-[10px] ${isSelected ? 'text-violet-200' : 'text-gray-400'}`}>
                      {format(date, 'MMM')}
                    </span>
                    {isToday && (
                      <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-violet-400'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Time Slot Selection */}
        {step === 'time' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Choose a Time</h2>
              <button onClick={handleBack} className="text-sm text-violet-600 font-medium">
                Back
              </button>
            </div>

            {selectedDate && (
              <p className="text-sm text-gray-500">
                {format(selectedDate, 'EEEE, d MMMM yyyy')}
              </p>
            )}

            {loadingSlots ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-violet-500" />
              </div>
            ) : timeSlots.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                <p className="text-sm text-gray-400">No slots available for this date.</p>
                <button
                  onClick={handleBack}
                  className="mt-3 text-sm text-violet-600 font-medium"
                >
                  Pick another date
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map((slot) => {
                  const isSelected =
                    selectedSlot?.start === slot.start && selectedSlot?.end === slot.end;
                  return (
                    <button
                      key={slot.start}
                      onClick={() => handleSelectSlot(slot)}
                      disabled={!slot.available}
                      className={`py-3 px-2 rounded-xl text-sm font-medium transition-all active:scale-95 ${
                        !slot.available
                          ? 'bg-gray-50 text-gray-300 border border-gray-100 cursor-not-allowed'
                          : isSelected
                          ? 'bg-violet-600 text-white shadow-md shadow-violet-200'
                          : 'bg-white text-gray-700 border-2 border-violet-200 hover:border-violet-400'
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

        {/* Step 4: Confirmation */}
        {step === 'confirm' && selectedService && selectedDate && selectedSlot && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Confirm Booking</h2>
              <button onClick={handleBack} className="text-sm text-violet-600 font-medium">
                Back
              </button>
            </div>

            {/* Summary Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Business</span>
                <span className="text-sm font-medium text-gray-900">{business.name}</span>
              </div>
              <div className="border-t border-gray-50" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Service</span>
                <span className="text-sm font-medium text-gray-900">{selectedService.name}</span>
              </div>
              <div className="border-t border-gray-50" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Date</span>
                <span className="text-sm font-medium text-gray-900">
                  {format(selectedDate, 'EEE, d MMM yyyy')}
                </span>
              </div>
              <div className="border-t border-gray-50" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Time</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatTime(selectedSlot.start)} - {formatTime(selectedSlot.end)}
                </span>
              </div>
              <div className="border-t border-gray-50" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Price</span>
                <span className="text-base font-bold text-violet-600">
                  RM {selectedService.price.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Your Details</h3>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Phone <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. 0123456789"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Email (optional)</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Auth warning */}
            {!authLoading && !authUser && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <p className="text-xs text-amber-700">
                  You need to be logged in to book. You will be redirected to login.
                </p>
              </div>
            )}

            {/* Confirm Button */}
            <button
              onClick={handleConfirmBooking}
              disabled={submitting || !customerPhone.trim()}
              className="w-full py-4 bg-violet-600 text-white font-semibold rounded-2xl hover:bg-violet-700 active:scale-[0.98] transition-all shadow-lg shadow-violet-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Booking...
                </>
              ) : (
                'Confirm Booking'
              )}
            </button>

            <p className="text-xs text-center text-gray-400">
              Pay at store &middot; RM {selectedService.price.toFixed(2)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50">
          <Header title="Book Appointment" showBack />
          <div className="max-w-lg mx-auto px-4 pt-8 flex justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-violet-600 border-t-transparent rounded-full" />
          </div>
        </div>
      }
    >
      <BookingFlow />
    </Suspense>
  );
}
