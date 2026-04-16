'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { addDays, format } from 'date-fns';
import { Clock3, Loader2, MapPin, Phone, Scissors, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { bookAppointment, getAvailableSlots, getBusinesses, getServices } from '@/lib/api';
import { generateTimeSlots, formatTime } from '@/lib/slots';
import type { Business, Service, TimeSlot, WorkingHours } from '@/lib/types';
import { DEFAULT_WORKING_HOURS } from '@/lib/constants';

const STATIC_PROFILE = {
  name: 'SK Barbershop',
  category: 'Barbershop',
  description:
    'SK Barbershop in Cyberjaya offers affordable and modern grooming services tailored for students and professionals. Known for clean fades, quick service, and a friendly atmosphere.',
  address: 'No 7G Basement, Jalan GC 13, Glomac, 63000 Cyberjaya, Selangor, Malaysia',
  city: 'Cyberjaya',
  state: 'Selangor',
  country: 'Malaysia',
  phone: '+60182313918',
  ratingAverage: 4.2,
  ratingCount: 13,
  priceRange: 'RM20 - RM50',
  googleMapsLink: 'https://www.google.com/maps/search/?api=1&query=2.9261216,101.6558098',
  googleMapsDirectionLink: 'https://www.google.com/maps/dir/?api=1&destination=2.9261216,101.6558098',
  appleMapsLink: 'http://maps.apple.com/?ll=2.9261216,101.6558098&q=SK%20Barbershop',
};

const FEATURES = [
  'Walk-ins allowed',
  'Student-friendly pricing',
  'Quick service',
  'Modern fade styles',
  'Casual local barbershop',
];

const DAY_LABELS: Record<keyof WorkingHours | string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

function toStructuredOpeningHours(workingHours: WorkingHours) {
  return Object.entries(workingHours).map(([day, value]) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: DAY_LABELS[day] ?? day,
    opens: value.open,
    closes: value.close,
  }));
}

function normalizeWorkingHours(hours: WorkingHours | null): WorkingHours {
  return hours ?? DEFAULT_WORKING_HOURS;
}

function format24hToText(value: string) {
  const [h, m] = value.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${`${m}`.padStart(2, '0')} ${suffix}`;
}

export default function SKBarbershopPage() {
  const router = useRouter();
  const { authUser, profile, loading: authLoading } = useAuth();

  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlotStart, setSelectedSlotStart] = useState('');
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [fullName, setFullName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('+60');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');

  const next14Days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 14 }, (_, i) => addDays(today, i));
  }, []);

  const selectedService = services.find((s) => s.id === selectedServiceId) ?? null;
  const selectedSlot = slots.find((slot) => slot.start === selectedSlotStart) ?? null;
  const workingHours = normalizeWorkingHours(business?.working_hours ?? null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.name || '');
      setCustomerPhone(profile.phone || '+60');
      setCustomerEmail(profile.email || '');
    }
  }, [profile]);

  useEffect(() => {
    let cancelled = false;
    async function loadBusinessAndServices() {
      setLoadingData(true);
      try {
        const shops = await getBusinesses('barbershop', 'SK Barbershop');
        const exact = shops.find(
          (item) => item.name.trim().toLowerCase() === 'sk barbershop'
        ) ?? shops[0];

        if (!exact) {
          if (!cancelled) {
            setBusiness(null);
            setServices([]);
          }
          return;
        }

        const svcs = await getServices(exact.id);
        if (!cancelled) {
          setBusiness(exact);
          setServices(svcs);
          setSelectedServiceId((prev) => prev || svcs[0]?.id || '');
        }
      } catch {
        if (!cancelled) {
          setBusiness(null);
          setServices([]);
        }
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    }

    loadBusinessAndServices();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!business || !selectedDate || !selectedService) {
      setSlots([]);
      setSelectedSlotStart('');
      return;
    }
    const businessId = business.id;
    const serviceDurationMinutes = selectedService.duration_minutes;

    let cancelled = false;
    async function loadSlots() {
      setLoadingSlots(true);
      setSelectedSlotStart('');
      try {
        const appointments = await getAvailableSlots(businessId, selectedDate);
        const computed = generateTimeSlots(
          new Date(`${selectedDate}T00:00:00`),
          workingHours,
          serviceDurationMinutes,
          appointments
        );
        if (!cancelled) setSlots(computed);
      } catch {
        if (!cancelled) setSlots([]);
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    }

    loadSlots();
    return () => {
      cancelled = true;
    };
  }, [business, selectedDate, selectedService, workingHours]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BarberShop',
    name: business?.name || STATIC_PROFILE.name,
    description: business?.description || STATIC_PROFILE.description,
    telephone: business?.phone || STATIC_PROFILE.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'No 7G Basement, Jalan GC 13, Glomac',
      postalCode: '63000',
      addressLocality: STATIC_PROFILE.city,
      addressRegion: STATIC_PROFILE.state,
      addressCountry: STATIC_PROFILE.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 2.9261216,
      longitude: 101.6558098,
    },
    areaServed: [STATIC_PROFILE.city, 'Putrajaya', 'Selangor'],
    priceRange: STATIC_PROFILE.priceRange,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: STATIC_PROFILE.ratingAverage,
      reviewCount: STATIC_PROFILE.ratingCount,
    },
    openingHoursSpecification: toStructuredOpeningHours(workingHours),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Grooming Services',
      itemListElement: services.map((service) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: service.name,
        },
        priceCurrency: 'MYR',
        priceSpecification: {
          '@type': 'PriceSpecification',
          description: `RM ${service.price.toFixed(2)}`,
        },
      })),
    },
    sameAs: [STATIC_PROFILE.googleMapsLink, STATIC_PROFILE.appleMapsLink],
    url: 'https://bookourspot.com/skbarbershop',
  };

  function validateBooking() {
    const nextErrors: Record<string, string> = {};
    if (!selectedServiceId) nextErrors.selectedServiceId = 'Please select a service.';
    if (!selectedDate) nextErrors.selectedDate = 'Please select your preferred date.';
    if (!selectedSlotStart) nextErrors.selectedSlotStart = 'Please select a time slot.';
    if (!fullName.trim()) nextErrors.fullName = 'Please enter your full name.';
    if (!customerPhone.trim() || customerPhone.trim().length < 7) {
      nextErrors.customerPhone = 'Please enter a valid phone number.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function onBookNow() {
    setSubmitError('');
    if (!validateBooking() || !business || !selectedService || !selectedSlot) return;

    if (!authUser) {
      router.push('/login?redirect=/skbarbershop');
      return;
    }

    setSubmitting(true);
    try {
      const appointment = await bookAppointment({
        business_id: business.id,
        service_id: selectedService.id,
        date: selectedDate,
        start_time: selectedSlot.start,
        end_time: selectedSlot.end,
        notes: notes.trim() || undefined,
        customer_name: fullName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim() || undefined,
      });

      router.push(`/booking/${appointment.id}/confirmed`);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Booking failed. Please try again.';
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingData) {
    return (
      <main className="min-h-screen bg-neutral-50 text-neutral-900 px-4 py-20">
        <div className="max-w-5xl mx-auto flex items-center justify-center">
          <Loader2 className="animate-spin text-neutral-700" />
        </div>
      </main>
    );
  }

  const displayName = business?.name || STATIC_PROFILE.name;
  const displayDescription = business?.description || STATIC_PROFILE.description;
  const displayAddress = business?.address || STATIC_PROFILE.address;
  const displayPhone = business?.phone || STATIC_PROFILE.phone;

  return (
    <main className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-6">
        <div className="rounded-3xl overflow-hidden border border-[#e5e2e1] bg-white shadow-sm">
          <div className="bg-gradient-to-r from-[#006273] via-[#107c91] to-[#7cd3ea] p-6 sm:p-10 text-white">
            <p className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]">
              Cyberjaya Featured Barbershop
            </p>
            <h1 className="mt-4 text-3xl sm:text-5xl font-extrabold tracking-tight">
              {displayName}
            </h1>
            <p className="mt-3 text-sm sm:text-base text-white/90 max-w-3xl">{displayDescription}</p>
            <div className="mt-5 flex flex-wrap gap-2 text-sm">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">
                <Star size={14} className="text-yellow-300" fill="currentColor" />
                {STATIC_PROFILE.ratingAverage} ({STATIC_PROFILE.ratingCount} reviews)
              </span>
              <span className="rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">{STATIC_PROFILE.category}</span>
              <span className="rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">{STATIC_PROFILE.priceRange}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-8 grid lg:grid-cols-3 gap-4">
        <article className="lg:col-span-2 rounded-2xl border border-[#e5e2e1] bg-white p-5 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Services & Prices</h2>
          <p className="text-sm text-[#3e484c] mt-1">
            Real-time active services from BookOurSpot business profile.
          </p>

          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            {services.length === 0 ? (
              <p className="text-sm text-neutral-500">No services published yet.</p>
            ) : (
              services.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => setSelectedServiceId(service.id)}
                  className={`text-left rounded-xl border p-4 transition ${
                    selectedServiceId === service.id
                      ? 'border-[#006273] bg-[#006273] text-white shadow-md'
                      : 'border-[#bec8cc] bg-white hover:border-[#006273]'
                  }`}
                >
                  <p className="font-semibold">{service.name}</p>
                  <p className={`text-sm mt-1 ${selectedServiceId === service.id ? 'text-[#acecff]' : 'text-[#3e484c]'}`}>
                    RM {service.price.toFixed(2)}
                  </p>
                  <p className={`text-xs mt-2 ${selectedServiceId === service.id ? 'text-[#7cd3ea]' : 'text-[#6e797c]'}`}>
                    Duration: {service.duration_minutes} min
                  </p>
                </button>
              ))
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-[#e5e2e1] bg-white p-5 sm:p-6">
          <h2 className="text-xl font-bold tracking-tight">Location & Contact</h2>
          <p className="mt-3 text-sm text-[#3e484c] inline-flex items-start gap-2">
            <MapPin size={16} className="mt-0.5 text-[#006273]" /> {displayAddress}
          </p>
          <p className="mt-3 text-sm text-[#3e484c] inline-flex items-center gap-2">
            <Phone size={16} className="text-[#006273]" /> {displayPhone}
          </p>
          <div className="mt-4 grid grid-cols-1 gap-2">
            <a className="rounded-xl border border-[#bec8cc] px-3 py-2 text-sm hover:bg-[#f6f3f2]" href={STATIC_PROFILE.googleMapsLink} target="_blank" rel="noreferrer">
              Open in Google Maps
            </a>
            <a className="rounded-xl border border-[#bec8cc] px-3 py-2 text-sm hover:bg-[#f6f3f2]" href={STATIC_PROFILE.googleMapsDirectionLink} target="_blank" rel="noreferrer">
              Get Google Maps Directions
            </a>
          </div>
        </article>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-8 grid lg:grid-cols-3 gap-4">
        <article className="rounded-2xl border border-[#e5e2e1] bg-white p-5">
          <h2 className="text-xl font-bold tracking-tight inline-flex items-center gap-2">
            <Clock3 size={18} className="text-[#006273]" /> Opening Hours
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            {Object.entries(workingHours).map(([day, hours]) => (
              <li key={day} className="flex items-center justify-between border-b border-[#f0eded] pb-2">
                <span className="text-[#3e484c]">{DAY_LABELS[day] ?? day}</span>
                <span className="font-medium">
                  {hours.closed ? 'Closed' : `${hours.open} - ${hours.close}`}
                </span>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-[#e5e2e1] bg-white p-5">
          <h2 className="text-xl font-bold tracking-tight">Shop Highlights</h2>
          <ul className="mt-4 space-y-2 text-sm text-[#3e484c]">
            {FEATURES.map((feature) => (
              <li key={feature} className="inline-flex items-center gap-2">
                <Scissors size={14} className="text-[#006273]" /> {feature}
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-[#e5e2e1] bg-white p-5">
          <h2 className="text-xl font-bold tracking-tight">Share This Booking Page</h2>
          <p className="mt-3 text-sm text-[#3e484c]">
            Use this dedicated link in bio, Instagram, and QR codes outside your shop:
          </p>
          <p className="mt-2 rounded-xl bg-[#f6f3f2] px-3 py-2 text-sm font-medium break-all">
            https://bookourspot.com/skbarbershop
          </p>
        </article>
      </section>

      <section id="book-now" className="max-w-6xl mx-auto px-4 sm:px-6 pb-14">
        <article className="rounded-3xl border border-[#e5e2e1] bg-white p-5 sm:p-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Book an Appointment</h2>
          <p className="mt-1 text-sm text-[#3e484c]">
            Book directly on BookOurSpot with service, date, and exact time slot.
          </p>

          {!authLoading && !authUser ? (
            <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Sign in is required to complete booking. You will be redirected to login when you confirm.
            </div>
          ) : null}

          <div className="mt-5 grid sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="fullName" className="text-sm font-semibold">Full name</label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#bec8cc] px-3 py-2 bg-white focus:border-[#006273] focus:ring-[#7cd3ea]"
                placeholder="Your full name"
              />
              {errors.fullName ? <p className="mt-1 text-xs text-red-600">{errors.fullName}</p> : null}
            </div>

            <div>
              <label htmlFor="customerPhone" className="text-sm font-semibold">Phone</label>
              <input
                id="customerPhone"
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#bec8cc] px-3 py-2 bg-white focus:border-[#006273] focus:ring-[#7cd3ea]"
                placeholder="+6012xxxxxxx"
              />
              {errors.customerPhone ? <p className="mt-1 text-xs text-red-600">{errors.customerPhone}</p> : null}
            </div>

            <div>
              <label htmlFor="customerEmail" className="text-sm font-semibold">Email (optional)</label>
              <input
                id="customerEmail"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#bec8cc] px-3 py-2 bg-white focus:border-[#006273] focus:ring-[#7cd3ea]"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="selectedDate" className="text-sm font-semibold">Preferred date</label>
              <select
                id="selectedDate"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#bec8cc] px-3 py-2 bg-white focus:border-[#006273] focus:ring-[#7cd3ea]"
              >
                <option value="">Select date</option>
                {next14Days.map((date) => {
                  const value = format(date, 'yyyy-MM-dd');
                  return (
                    <option key={value} value={value}>
                      {format(date, 'EEE, d MMM yyyy')}
                    </option>
                  );
                })}
              </select>
              {errors.selectedDate ? <p className="mt-1 text-xs text-red-600">{errors.selectedDate}</p> : null}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="selectedService" className="text-sm font-semibold">Service</label>
              <select
                id="selectedService"
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#bec8cc] px-3 py-2 bg-white focus:border-[#006273] focus:ring-[#7cd3ea]"
              >
                <option value="">Select service</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} (RM {service.price.toFixed(2)}, {service.duration_minutes} min)
                  </option>
                ))}
              </select>
              {errors.selectedServiceId ? <p className="mt-1 text-xs text-red-600">{errors.selectedServiceId}</p> : null}
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-semibold">Available time slots</label>
              {loadingSlots ? (
                <div className="mt-2 text-sm text-neutral-500 inline-flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Loading slots...
                </div>
              ) : slots.length === 0 ? (
                <p className="mt-2 text-sm text-neutral-500">Select a date and service to see available slots.</p>
              ) : (
                <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot.start}
                      type="button"
                      onClick={() => slot.available && setSelectedSlotStart(slot.start)}
                      disabled={!slot.available}
                      className={`rounded-lg px-2 py-2 text-xs border ${
                        !slot.available
                          ? 'border-[#e5e2e1] text-[#bec8cc] bg-[#f0eded] cursor-not-allowed line-through'
                          : selectedSlotStart === slot.start
                          ? 'bg-[#006273] text-white border-[#006273]'
                          : 'border-[#bec8cc] hover:border-[#006273]'
                      }`}
                    >
                      {formatTime(slot.start)}
                    </button>
                  ))}
                </div>
              )}
              {errors.selectedSlotStart ? <p className="mt-1 text-xs text-red-600">{errors.selectedSlotStart}</p> : null}
            </div>

            {selectedSlot ? (
              <div className="sm:col-span-2 rounded-full bg-[#ebfaff] text-[#004e5c] px-3 py-2 text-sm">
                Selected slot: {format24hToText(selectedSlot.start)} - {format24hToText(selectedSlot.end)}
              </div>
            ) : null}

            <div className="sm:col-span-2">
              <label htmlFor="notes" className="text-sm font-semibold">Notes (optional)</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#bec8cc] px-3 py-2 min-h-24 bg-white focus:border-[#006273] focus:ring-[#7cd3ea]"
                placeholder="Any preferred style or request?"
              />
            </div>
          </div>

          {submitError ? (
            <div className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {submitError}
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onBookNow}
              disabled={submitting || !business || !selectedService || !selectedSlot}
              className="inline-flex items-center gap-2 rounded-full bg-[#006273] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[#004e5c] disabled:opacity-50"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
              Book on BookOurSpot
            </button>
            <a
              href={`tel:${displayPhone}`}
              className="inline-flex items-center gap-2 rounded-full border border-[#bec8cc] px-5 py-2.5 text-sm font-medium hover:bg-[#f6f3f2]"
            >
              <Phone size={16} /> Call Shop
            </a>
            <Link
              href={STATIC_PROFILE.googleMapsDirectionLink}
              target="_blank"
              className="inline-flex items-center gap-2 rounded-full border border-[#bec8cc] px-5 py-2.5 text-sm font-medium hover:bg-[#f6f3f2]"
            >
              <MapPin size={16} /> Get Directions
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}
