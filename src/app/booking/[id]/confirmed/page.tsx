'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { CalendarCheck, MessageCircle, ListChecks, Home } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { createClient } from '@/lib/supabase/client';
import { getCustomerWhatsAppUrl } from '@/lib/whatsapp';
import { formatTime } from '@/lib/slots';
import type { Appointment } from '@/lib/types';

export default function BookingConfirmedPage() {
  const { id } = useParams<{ id: string }>();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const supabase = createClient();

    const fetchAppointment = async () => {
      try {
        const { data } = await supabase
          .from('appointments')
          .select('*, service:services(*), business:businesses(*)')
          .eq('id', id)
          .single();
        setAppointment(data as Appointment | null);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchAppointment();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Booking Confirmed" showBack />
        <div className="max-w-lg mx-auto px-4 pt-10">
          <div className="animate-pulse space-y-4 flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-200 rounded-full" />
            <div className="h-5 bg-gray-200 rounded-lg w-2/3" />
            <div className="h-4 bg-gray-100 rounded-lg w-1/2" />
            <div className="h-40 bg-white rounded-2xl border border-gray-100 w-full mt-4" />
          </div>
        </div>
      </div>
    );
  }

  if (!appointment || !appointment.service || !appointment.business) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Booking Confirmed" showBack />
        <div className="text-center py-20">
          <p className="text-gray-500">Booking details not found.</p>
          <Link href="/" className="mt-4 inline-block text-violet-600 font-medium text-sm">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const { service, business } = appointment;
  const formattedDate = format(new Date(appointment.date + 'T00:00:00'), 'EEEE, d MMMM yyyy');

  // Build WhatsApp share URL if the user has a phone (use business phone as fallback target)
  const whatsAppUrl =
    business.phone
      ? getCustomerWhatsAppUrl(
          business.phone,
          'Customer',
          business,
          service,
          formattedDate,
          appointment.start_time
        )
      : null;

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <Header title="Booking Confirmed" showBack />

      <div className="max-w-lg mx-auto px-4 pt-8">
        {/* Success Animation */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center animate-[bounceIn_0.6s_ease-out]">
              <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-200">
                <CalendarCheck size={32} className="text-white" />
              </div>
            </div>
            {/* Decorative rings */}
            <div className="absolute inset-0 w-24 h-24 rounded-full border-4 border-green-200 animate-ping opacity-20" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mt-5">Booking Confirmed!</h1>
          <p className="text-sm text-gray-500 mt-1">Your appointment has been booked successfully.</p>
        </div>

        {/* Booking Details Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Business</span>
            <span className="text-sm font-medium text-gray-900">{business.name}</span>
          </div>
          <div className="border-t border-gray-50" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Service</span>
            <span className="text-sm font-medium text-gray-900">{service.name}</span>
          </div>
          <div className="border-t border-gray-50" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Date</span>
            <span className="text-sm font-medium text-gray-900">{formattedDate}</span>
          </div>
          <div className="border-t border-gray-50" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Time</span>
            <span className="text-sm font-medium text-gray-900">
              {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
            </span>
          </div>
          <div className="border-t border-gray-50" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Price</span>
            <span className="text-base font-bold text-violet-600">
              RM {service.price.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Payment & cancellation notes */}
        <div className="mt-4 space-y-3">
          <div className="rounded-xl bg-violet-50 px-4 py-3 text-center">
            <p className="text-sm font-medium text-violet-700">
              Pay after you arrive by cash or card &mdash; RM {service.price.toFixed(2)}
            </p>
          </div>
          <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-center">
            <p className="text-sm font-medium text-green-700">
              100% free cancellation policy
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-3">
          {whatsAppUrl && (
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-green-500 text-white font-semibold rounded-2xl hover:bg-green-600 active:scale-[0.98] transition-all shadow-md shadow-green-200"
            >
              <MessageCircle size={18} />
              Share via WhatsApp
            </a>
          )}

          <Link
            href="/bookings"
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-violet-600 text-white font-semibold rounded-2xl hover:bg-violet-700 active:scale-[0.98] transition-all shadow-md shadow-violet-200"
          >
            <ListChecks size={18} />
            View My Bookings
          </Link>

          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 py-3 text-gray-600 font-medium text-sm hover:text-gray-900 transition-colors"
          >
            <Home size={16} />
            Back to Home
          </Link>
        </div>
      </div>

      {/* Keyframe for bounce animation */}
      <style jsx>{`
        @keyframes bounceIn {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.95);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
