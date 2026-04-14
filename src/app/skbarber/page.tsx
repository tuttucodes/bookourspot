'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { Playfair_Display, Work_Sans } from 'next/font/google';
import { Clock3, MapPin, Scissors, Star, CheckCircle2, Moon, Sun } from 'lucide-react';

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['600', '700'], display: 'swap' });
const workSans = Work_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap' });

type Service = { id: string; name: string; price: string; durationMins: number };
type Review = { author: string; rating: number; date: string; text: string; source: string };

const OWNER_WHATSAPP = '60123456789';
const BUSINESS = {
  name: 'SK Barbershop',
  category: 'Barbershop',
  location: 'Cyberjaya, Selangor, Malaysia',
  tagline: "Clean Cuts. Great Vibes. Cyberjaya's Favourite Barber.",
  googleRating: 3.8,
  googleReviewCount: 22,
  bookourspotRating: 4.2,
  bookourspotReviewCount: 13,
  coverImage:
    'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=1400&q=80',
  openMinutes: 10 * 60 + 30,
  closeMinutes: 22 * 60,
};

const SERVICES: Service[] = [
  { id: 'haircut', name: 'Haircut', price: 'RM 15–25', durationMins: 30 },
  { id: 'hair-beard', name: 'Hair + Beard Trim', price: 'RM 25–35', durationMins: 45 },
  { id: 'kids', name: 'Kids Haircut (0–12 yrs)', price: 'RM 12–18', durationMins: 30 },
  { id: 'head-shave', name: 'Head Shave', price: 'RM 20', durationMins: 30 },
  { id: 'beard-only', name: 'Beard Trim Only', price: 'RM 10–15', durationMins: 20 },
  { id: 'wash-blow', name: 'Hair Wash + Blow Dry', price: 'RM 15', durationMins: 30 },
  { id: 'coloring', name: 'Hair Coloring', price: 'From RM 60', durationMins: 90 },
];

const REVIEWS: Review[] = [
  {
    author: 'Amir R.',
    rating: 5,
    date: 'March 2025',
    text: 'Great clean cut, very friendly barber. Affordable and quick service.',
    source: 'Google',
  },
  {
    author: 'Harish K.',
    rating: 4,
    date: 'January 2025',
    text: 'Decent haircut for the price. A bit of a wait but worth it.',
    source: 'Google',
  },
  {
    author: 'Daniel T.',
    rating: 3,
    date: 'November 2024',
    text: 'Average experience, could be better at communication. Haircut turned out okay.',
    source: 'Google',
  },
  {
    author: 'Syafiq M.',
    rating: 5,
    date: 'February 2025',
    text: 'Best barbershop in Cyberjaya! Always consistent and stylish cuts.',
    source: 'BookOurSpot',
  },
  {
    author: 'Wei Liang',
    rating: 4,
    date: 'December 2024',
    text: 'Nice ambiance and clean tools. Would recommend to anyone in Cyberjaya.',
    source: 'BookOurSpot',
  },
];

const BOOKED_SLOTS: Record<string, string[]> = {
  '2026-04-15': ['11:00', '15:30'],
  '2026-04-16': ['14:00', '19:00'],
};

function pad(n: number) {
  return `${n}`.padStart(2, '0');
}

function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDisplayDate(date: Date) {
  return date.toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function to12h(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${pad(m)} ${suffix}`;
}

function generateRef() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `SKB-${code}`;
}

function buildTimeSlots() {
  const slots: string[] = [];
  for (let min = BUSINESS.openMinutes; min <= 21 * 60 + 30; min += 30) {
    slots.push(`${pad(Math.floor(min / 60))}:${pad(min % 60)}`);
  }
  return slots;
}

export default function SKBarberPage() {
  const [isLightMode, setIsLightMode] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+60');
  const [sameWhatsApp, setSameWhatsApp] = useState(true);
  const [whatsApp, setWhatsApp] = useState('+60');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successOpen, setSuccessOpen] = useState(false);
  const [bookingRef, setBookingRef] = useState('');

  const today = new Date();
  const currentMinute = today.getHours() * 60 + today.getMinutes();
  const isOpenNow = currentMinute >= BUSINESS.openMinutes && currentMinute < BUSINESS.closeMinutes;
  const dayName = today.toLocaleDateString('en-MY', { weekday: 'long' });
  const dayHours = '10:30 AM - 10:00 PM';

  const selectedService = SERVICES.find((s) => s.id === selectedServiceId);
  const slots = useMemo(() => buildTimeSlots(), []);
  const dateObj = selectedDate ? new Date(`${selectedDate}T00:00:00`) : null;
  const bookedToday = selectedDate ? BOOKED_SLOTS[selectedDate] || [] : [];

  const pageBg = isLightMode ? '#f8f5ee' : '#0f0e0c';
  const textPrimary = isLightMode ? '#1a1917' : '#f0ece4';
  const textMuted = isLightMode ? '#57544f' : '#9e9b94';
  const cardBg = isLightMode ? '#ffffff' : '#1a1917';
  const cardRaised = isLightMode ? '#f2ebe0' : '#242220';
  const border = isLightMode ? 'rgba(17,17,17,0.08)' : 'rgba(255,255,255,0.08)';

  const validateStep = () => {
    const nextErrors: Record<string, string> = {};
    if (step === 1 && !selectedServiceId) nextErrors.service = 'Please select a service.';
    if (step === 2) {
      if (!selectedDate) nextErrors.date = 'Please select a date.';
      if (!selectedTime) nextErrors.time = 'Please select a time slot.';
    }
    if (step === 3) {
      if (!fullName.trim()) nextErrors.fullName = 'Full name is required.';
      if (!phone.trim() || phone.trim().length < 5) nextErrors.phone = 'Enter a valid phone number.';
      if (!sameWhatsApp && (!whatsApp.trim() || whatsApp.trim().length < 5)) {
        nextErrors.whatsApp = 'Enter a valid WhatsApp number.';
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleConfirmBooking = () => {
    const finalErrors: Record<string, string> = {};
    if (!selectedServiceId) finalErrors.service = 'Please select a service.';
    if (!selectedDate) finalErrors.date = 'Please select a date.';
    if (!selectedTime) finalErrors.time = 'Please select a time slot.';
    if (!fullName.trim()) finalErrors.fullName = 'Full name is required.';
    if (!phone.trim() || phone.trim().length < 5) finalErrors.phone = 'Enter a valid phone number.';
    if (!sameWhatsApp && (!whatsApp.trim() || whatsApp.trim().length < 5)) finalErrors.whatsApp = 'Enter a valid WhatsApp.';
    setErrors(finalErrors);
    if (Object.keys(finalErrors).length > 0) return;

    const ref = generateRef();
    setBookingRef(ref);
    setSuccessOpen(true);

    const customerPhoneWithCountryCode = (sameWhatsApp ? phone : whatsApp).replace(/[^\d]/g, '');
    const ownerPhone = OWNER_WHATSAPP.replace(/[^\d]/g, '');
    const selectedDateText = selectedDate ? formatDisplayDate(new Date(`${selectedDate}T00:00:00`)) : '';
    const selectedTimeText = selectedTime ? to12h(selectedTime) : '';
    const serviceName = selectedService?.name || 'Service';

    const customerMsg =
      `✅ *Booking Confirmed!*\n\n` +
      `Hi ${fullName}, your appointment at *SK Barbershop* has been confirmed.\n\n` +
      `📋 *Booking Details:*\n` +
      `• Reference: ${ref}\n` +
      `• Service: ${serviceName}\n` +
      `• Date: ${selectedDateText}\n` +
      `• Time: ${selectedTimeText}\n` +
      `• Location: Cyberjaya, Selangor, Malaysia\n\n` +
      `Please arrive 5 minutes early. See you soon! 💈\n\n` +
      `— BookOurSpot | bookourspot.com/skbarber`;

    const ownerMsg =
      `📅 *New Appointment Booked!*\n\n` +
      `• Ref: ${ref}\n` +
      `• Customer: ${fullName}\n` +
      `• Phone: ${phone}\n` +
      `• Service: ${serviceName}\n` +
      `• Date: ${selectedDateText}\n` +
      `• Time: ${selectedTimeText}\n\n` +
      `Booked via BookOurSpot`;

    window.open(`https://wa.me/${customerPhoneWithCountryCode}?text=${encodeURIComponent(customerMsg)}`, '_blank', 'noopener,noreferrer');
    window.setTimeout(() => {
      window.open(`https://wa.me/${ownerPhone}?text=${encodeURIComponent(ownerMsg)}`, '_blank', 'noopener,noreferrer');
    }, 1000);
  };

  const getCalendarTimes = () => {
    if (!selectedDate || !selectedTime) return null;
    const [h, m] = selectedTime.split(':').map(Number);
    const start = new Date(`${selectedDate}T00:00:00`);
    start.setHours(h, m, 0, 0);
    const duration = selectedService?.durationMins || 30;
    const end = new Date(start.getTime() + duration * 60 * 1000);

    const asCal = (d: Date) =>
      `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

    return { start, end, gStart: asCal(start), gEnd: asCal(end), iStart: asCal(start), iEnd: asCal(end) };
  };

  const openGoogleCalendar = () => {
    if (!bookingRef) return;
    const times = getCalendarTimes();
    if (!times) return;
    const serviceName = selectedService?.name || 'Haircut';
    const gcalUrl =
      `https://calendar.google.com/calendar/render?action=TEMPLATE` +
      `&text=${encodeURIComponent(`${serviceName} at SK Barbershop`)}` +
      `&dates=${times.gStart}/${times.gEnd}` +
      `&details=${encodeURIComponent(`Booking Ref: ${bookingRef}\nService: ${serviceName}\nBookOurSpot: bookourspot.com/skbarber`)}` +
      `&location=${encodeURIComponent('SK Barbershop, Cyberjaya, Selangor, Malaysia')}`;

    window.open(gcalUrl, '_blank', 'noopener,noreferrer');
  };

  const downloadAppleCalendar = () => {
    if (!bookingRef) return;
    const times = getCalendarTimes();
    if (!times) return;
    const serviceName = selectedService?.name || 'Haircut';
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//BookOurSpot//SK Barbershop//EN',
      'BEGIN:VEVENT',
      `UID:${bookingRef}@bookourspot.com`,
      `DTSTART:${times.iStart}`,
      `DTEND:${times.iEnd}`,
      `SUMMARY:${serviceName} at SK Barbershop`,
      `DESCRIPTION:Booking Ref: ${bookingRef}\\nService: ${serviceName}\\nBooked via BookOurSpot`,
      'LOCATION:SK Barbershop, Cyberjaya, Selangor, Malaysia',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SK-Barbershop-${bookingRef}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={`${workSans.className} min-h-screen pb-24`}
      style={{ background: pageBg, color: textPrimary }}
    >
      <div className="max-w-4xl mx-auto">
        <header className="p-4 md:p-6">
          <div className="rounded-3xl overflow-hidden border" style={{ borderColor: border, background: cardBg }}>
            <Image
              src={BUSINESS.coverImage}
              alt="SK Barbershop cover"
              width={1400}
              height={720}
              className="w-full h-52 md:h-72 object-cover"
              priority={false}
            />
            <div className="p-5 md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full mb-3 border" style={{ borderColor: border, background: cardRaised }}>
                    <CheckCircle2 size={14} color="#c9a84c" /> BookOurSpot Verified Salon
                  </p>
                  <h1 className={`${playfair.className} text-3xl md:text-4xl`}>{BUSINESS.name}</h1>
                  <p className="mt-2 text-sm md:text-base" style={{ color: textMuted }}>{BUSINESS.tagline}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLightMode((v) => !v)}
                  aria-label="Toggle light and dark mode"
                  className="rounded-full p-2 border active:scale-95"
                  style={{ borderColor: border, background: cardRaised }}
                >
                  {isLightMode ? <Moon size={16} /> : <Sun size={16} />}
                </button>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border" style={{ borderColor: border }}>
                  <Star size={14} color="#c9a84c" fill="#c9a84c" /> {BUSINESS.googleRating} - {BUSINESS.googleReviewCount} reviews
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border" style={{ borderColor: border }}>
                  <Star size={14} color="#c9a84c" fill="#c9a84c" /> {BUSINESS.bookourspotRating} - {BUSINESS.bookourspotReviewCount} reviews
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: '#c9a84c', color: '#1a1917' }}>
                  {BUSINESS.category}
                </span>
              </div>

              <p className="mt-3 inline-flex items-center gap-2 text-sm" style={{ color: textMuted }}>
                <MapPin size={16} /> {BUSINESS.location}
              </p>
            </div>
          </div>
        </header>

        <section className="px-4 md:px-6">
          <div className="rounded-2xl p-4 border" style={{ borderColor: border, background: cardBg }}>
            <div className="grid sm:grid-cols-3 gap-3 text-sm">
              <div className="rounded-xl p-3 border" style={{ borderColor: border, background: cardRaised }}>
                <p className="inline-flex items-center gap-2 font-semibold"><Clock3 size={16} /> Hours ({dayName})</p>
                <p className="mt-2" style={{ color: textMuted }}>{dayHours}</p>
                <p className="mt-2 inline-flex items-center text-xs px-2 py-1 rounded-full" style={{ background: isOpenNow ? 'rgba(90,158,107,0.18)' : 'rgba(192,81,62,0.2)', color: isOpenNow ? '#5a9e6b' : '#c0513e' }}>
                  {isOpenNow ? 'Open Now' : 'Closed'}
                </p>
              </div>
              <div className="rounded-xl p-3 border" style={{ borderColor: border, background: cardRaised }}>
                <p className="inline-flex items-center gap-2 font-semibold"><MapPin size={16} /> Address</p>
                <p className="mt-2" style={{ color: textMuted }}>{BUSINESS.location}</p>
              </div>
              <div className="rounded-xl p-3 border" style={{ borderColor: border, background: cardRaised }}>
                <p className="inline-flex items-center gap-2 font-semibold"><Scissors size={16} /> Category</p>
                <p className="mt-2" style={{ color: textMuted }}>{BUSINESS.category}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 md:px-6 mt-6">
          <h2 className={`${playfair.className} text-2xl`}>Services Menu</h2>
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            {SERVICES.map((service) => (
              <article key={service.id} className="rounded-2xl p-4 border" style={{ borderColor: border, background: cardBg }}>
                <p className="font-semibold">{service.name}</p>
                <p className="text-sm mt-1" style={{ color: textMuted }}>{service.price}</p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedServiceId(service.id);
                    setStep(1);
                    document.getElementById('booking-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="mt-3 px-3 py-2 rounded-lg text-sm font-semibold active:scale-95"
                  style={{ background: '#c9a84c', color: '#1a1917' }}
                >
                  Book This
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="px-4 md:px-6 mt-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className={`${playfair.className} text-2xl`}>Reviews</h2>
            <button
              type="button"
              aria-label="Write a review"
              className="px-3 py-2 text-sm rounded-lg border active:scale-95"
              style={{ borderColor: border, background: cardBg }}
            >
              Give a BookOurSpot Review
            </button>
          </div>

          <div className="rounded-2xl p-4 border mt-3" style={{ borderColor: border, background: cardBg }}>
            <p className="text-sm" style={{ color: textMuted }}>
              Google: <span style={{ color: textPrimary }}>{BUSINESS.googleRating}/5 ({BUSINESS.googleReviewCount} reviews)</span>
            </p>
            <p className="text-sm mt-1" style={{ color: textMuted }}>
              BookOurSpot: <span style={{ color: textPrimary }}>{BUSINESS.bookourspotRating}/5 ({BUSINESS.bookourspotReviewCount} reviews)</span>
            </p>
            <p className="text-xs mt-2" style={{ color: textMuted }}>Reviews sourced from Google and BookOurSpot.</p>
          </div>

          <div className="grid gap-3 mt-3">
            {REVIEWS.map((review) => (
              <article key={`${review.author}-${review.date}`} className="rounded-2xl p-4 border" style={{ borderColor: border, background: cardBg }}>
                <div className="flex justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: '#c9a84c', color: '#1a1917' }}>
                      {review.author.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold">{review.author}</p>
                      <p className="text-xs" style={{ color: textMuted }}>{review.date}</p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full border h-fit" style={{ borderColor: border }}>{review.source}</span>
                </div>
                <div className="mt-3 flex gap-1" aria-label={`${review.rating} star rating`}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} size={14} color="#c9a84c" fill={i <= review.rating ? '#c9a84c' : 'transparent'} />
                  ))}
                </div>
                <p className="mt-2 text-sm" style={{ color: textMuted }}>{review.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="booking-form" className="px-4 md:px-6 mt-6">
          <h2 className={`${playfair.className} text-2xl`}>Book Appointment</h2>

          <div className="rounded-2xl p-4 border mt-3" style={{ borderColor: border, background: cardBg }}>
            <div className="flex items-center gap-2 text-xs sm:text-sm mb-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full flex items-center justify-center font-semibold" style={{ background: step === n ? '#c9a84c' : cardRaised, color: step === n ? '#1a1917' : textMuted }}>
                    {n}
                  </span>
                  {n < 4 && <span style={{ color: textMuted }}>→</span>}
                </div>
              ))}
            </div>

            {step === 1 && (
              <div>
                <label htmlFor="service" className="text-sm font-medium">Select Service</label>
                <select
                  id="service"
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="mt-2 w-full rounded-xl px-3 py-3 border outline-none"
                  style={{ borderColor: errors.service ? '#c0513e' : border, background: cardRaised, color: textPrimary }}
                >
                  <option value="">Choose a service</option>
                  {SERVICES.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} ({service.price})
                    </option>
                  ))}
                </select>
                {errors.service && <p className="text-xs mt-1" style={{ color: '#c0513e' }}>{errors.service}</p>}
              </div>
            )}

            {step === 2 && (
              <div>
                <label htmlFor="date" className="text-sm font-medium">Select Date</label>
                <input
                  id="date"
                  type="date"
                  min={formatDateKey(new Date())}
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedTime('');
                  }}
                  className="mt-2 w-full rounded-xl px-3 py-3 border outline-none"
                  style={{ borderColor: errors.date ? '#c0513e' : border, background: cardRaised, color: textPrimary }}
                />
                {errors.date && <p className="text-xs mt-1" style={{ color: '#c0513e' }}>{errors.date}</p>}

                <p className="text-sm mt-4 font-medium">Select Time</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                  {slots.map((slot) => {
                    const disabled = bookedToday.includes(slot);
                    const active = selectedTime === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={disabled}
                        onClick={() => setSelectedTime(slot)}
                        className="rounded-lg py-2 px-2 text-xs border active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                          borderColor: active ? '#c9a84c' : border,
                          background: active ? '#c9a84c' : cardRaised,
                          color: active ? '#1a1917' : textPrimary,
                        }}
                      >
                        {to12h(slot)}
                      </button>
                    );
                  })}
                </div>
                {errors.time && <p className="text-xs mt-1" style={{ color: '#c0513e' }}>{errors.time}</p>}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <div>
                  <label htmlFor="fullName" className="text-sm font-medium">Full Name</label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-1 w-full rounded-xl px-3 py-3 border outline-none"
                    style={{ borderColor: errors.fullName ? '#c0513e' : border, background: cardRaised, color: textPrimary }}
                  />
                  {errors.fullName && <p className="text-xs mt-1" style={{ color: '#c0513e' }}>{errors.fullName}</p>}
                </div>
                <div>
                  <label htmlFor="phone" className="text-sm font-medium">Phone Number</label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 w-full rounded-xl px-3 py-3 border outline-none"
                    style={{ borderColor: errors.phone ? '#c0513e' : border, background: cardRaised, color: textPrimary }}
                  />
                  {errors.phone && <p className="text-xs mt-1" style={{ color: '#c0513e' }}>{errors.phone}</p>}
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={sameWhatsApp}
                    onChange={(e) => setSameWhatsApp(e.target.checked)}
                    aria-label="WhatsApp same as phone number"
                  />
                  Same as phone number (WhatsApp)
                </label>
                {!sameWhatsApp && (
                  <div>
                    <label htmlFor="whatsapp" className="text-sm font-medium">WhatsApp Number</label>
                    <input
                      id="whatsapp"
                      type="tel"
                      value={whatsApp}
                      onChange={(e) => setWhatsApp(e.target.value)}
                      className="mt-1 w-full rounded-xl px-3 py-3 border outline-none"
                      style={{ borderColor: errors.whatsApp ? '#c0513e' : border, background: cardRaised, color: textPrimary }}
                    />
                    {errors.whatsApp && <p className="text-xs mt-1" style={{ color: '#c0513e' }}>{errors.whatsApp}</p>}
                  </div>
                )}
                <div>
                  <label htmlFor="notes" className="text-sm font-medium">Notes (Optional)</label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special requests?"
                    className="mt-1 w-full rounded-xl px-3 py-3 border outline-none min-h-24"
                    style={{ borderColor: border, background: cardRaised, color: textPrimary }}
                  />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="rounded-xl p-3 border" style={{ borderColor: border, background: cardRaised }}>
                <h3 className="font-semibold">Confirm Your Booking</h3>
                <p className="text-sm mt-2" style={{ color: textMuted }}>Service: {selectedService?.name || '-'}</p>
                <p className="text-sm" style={{ color: textMuted }}>Date: {dateObj ? formatDisplayDate(dateObj) : '-'}</p>
                <p className="text-sm" style={{ color: textMuted }}>Time: {selectedTime ? to12h(selectedTime) : '-'}</p>
                <p className="text-sm" style={{ color: textMuted }}>Name: {fullName || '-'}</p>
                <p className="text-sm" style={{ color: textMuted }}>Phone: {phone || '-'}</p>
                {notes && <p className="text-sm mt-1" style={{ color: textMuted }}>Notes: {notes}</p>}
                <button
                  type="button"
                  onClick={handleConfirmBooking}
                  className="mt-4 w-full rounded-xl py-3 font-semibold active:scale-95"
                  style={{ background: '#c9a84c', color: '#1a1917' }}
                >
                  Confirm Booking
                </button>
              </div>
            )}

            <div className="flex items-center justify-between mt-4 gap-2">
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1}
                className="px-4 py-2 rounded-lg border disabled:opacity-40 active:scale-95"
                style={{ borderColor: border }}
              >
                Back
              </button>
              {step < 4 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!validateStep()) return;
                    setStep((s) => Math.min(4, s + 1));
                  }}
                  className="px-4 py-2 rounded-lg font-semibold active:scale-95"
                  style={{ background: '#c9a84c', color: '#1a1917' }}
                >
                  Continue
                </button>
              ) : null}
            </div>
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-3 md:hidden" style={{ background: isLightMode ? 'rgba(248,245,238,0.94)' : 'rgba(15,14,12,0.94)' }}>
        <div className="max-w-lg mx-auto">
          <button
            type="button"
            aria-label="Book appointment"
            onClick={() => document.getElementById('booking-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="w-full rounded-xl py-3 font-semibold active:scale-95"
            style={{ background: '#c9a84c', color: '#1a1917' }}
          >
            Book Appointment
          </button>
        </div>
      </div>

      {successOpen && (
        <div className="fixed inset-0 z-50 p-4 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div className="w-full max-w-md rounded-2xl p-5 border" style={{ borderColor: border, background: cardBg }}>
            <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center" style={{ background: 'rgba(90,158,107,0.2)' }}>
              <CheckCircle2 size={32} color="#5a9e6b" />
            </div>
            <h3 className={`${playfair.className} text-2xl text-center mt-3`}>Booking Confirmed</h3>
            <p className="text-center text-sm mt-1" style={{ color: textMuted }}>
              Reference: <span className="font-mono" style={{ color: textPrimary }}>{bookingRef}</span>
            </p>
            <p className="text-xs mt-3 text-center" style={{ color: textMuted }}>
              We&apos;ve opened WhatsApp to confirm your booking. Please send the pre-filled message.
            </p>

            <div className="grid gap-2 mt-4">
              <button
                type="button"
                onClick={openGoogleCalendar}
                className="rounded-xl py-3 px-3 text-sm font-semibold active:scale-95"
                style={{ background: '#c9a84c', color: '#1a1917' }}
              >
                📅 Add to Google Calendar
              </button>
              <button
                type="button"
                onClick={downloadAppleCalendar}
                className="rounded-xl py-3 px-3 text-sm font-semibold border active:scale-95"
                style={{ borderColor: border, background: cardRaised }}
              >
                🍎 Add to Apple Calendar
              </button>
              <button
                type="button"
                onClick={() => setSuccessOpen(false)}
                className="rounded-xl py-3 px-3 text-sm border active:scale-95"
                style={{ borderColor: border }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
