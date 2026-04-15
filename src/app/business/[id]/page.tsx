'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Phone, Clock, BadgeCheck, Scissors, Car, Sparkles, SlidersHorizontal } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { getBusiness, getServices } from '@/lib/api';
import type { Business, Service, WorkingHours } from '@/lib/types';

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const CATEGORY_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  salon: { icon: <Scissors size={16} />, color: 'bg-pink-100 text-pink-600' },
  barbershop: { icon: <Scissors size={16} />, color: 'bg-blue-100 text-blue-600' },
  car_wash: { icon: <Car size={16} />, color: 'bg-green-100 text-green-600' },
  spa: { icon: <Sparkles size={16} />, color: 'bg-purple-100 text-purple-600' },
  other: { icon: <SlidersHorizontal size={16} />, color: 'bg-gray-100 text-gray-600' },
};

function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
}

export default function BusinessPage() {
  const { id } = useParams<{ id: string }>();
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let isCancelled = false;

    async function loadBusinessDetails() {
      setLoading(true);
      try {
        const [biz, svcs] = await Promise.all([getBusiness(id), getServices(id)]);
        if (isCancelled) return;
        setBusiness(biz);
        setServices(svcs);
      } catch {
        if (isCancelled) return;
        setBusiness(null);
        setServices([]);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    loadBusinessDetails();
    return () => {
      isCancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="" showBack />
        <div className="max-w-lg mx-auto px-4 pt-6 animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded-lg w-2/3" />
          <div className="h-4 bg-gray-100 rounded-lg w-1/3" />
          <div className="h-4 bg-gray-100 rounded-lg w-1/2" />
          <div className="mt-6 h-5 bg-gray-200 rounded-lg w-1/4" />
          <div className="space-y-3 mt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100" />
            ))}
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

  const catConfig = CATEGORY_CONFIG[business.category] || CATEGORY_CONFIG.other;
  const workingHours = business.working_hours as WorkingHours | null;
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: business.name,
    description: business.description || undefined,
    telephone: business.phone || undefined,
    address: business.address || business.location || undefined,
    areaServed: business.location || 'Malaysia',
    url: `https://bookourspot.com/business/${id}`,
    sameAs: [],
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <Header title={business.name} showBack />

      <div className="max-w-lg mx-auto px-4 pt-5">
        {/* Hero Section */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900">{business.name}</h1>
              <span className={`inline-flex items-center gap-1 mt-2 px-2.5 py-1 text-xs font-medium rounded-full capitalize ${catConfig.color}`}>
                {catConfig.icon}
                {business.category.replace('_', ' ')}
              </span>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-violet-200 flex items-center justify-center shrink-0">
              <BadgeCheck size={28} className="text-violet-500" />
            </div>
          </div>

          {business.description && (
            <p className="text-sm text-gray-600 mt-3 leading-relaxed">{business.description}</p>
          )}

          <div className="mt-4 space-y-2">
            {business.location && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin size={16} className="text-violet-500 shrink-0" />
                <span>{business.location}</span>
              </div>
            )}
            {business.phone && (
              <a href={`tel:${business.phone}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-violet-600 transition-colors">
                <Phone size={16} className="text-violet-500 shrink-0" />
                <span>{business.phone}</span>
              </a>
            )}
          </div>
        </div>

        {/* Working Hours */}
        {workingHours && Object.keys(workingHours).length > 0 && (
          <div className="mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Clock size={18} className="text-violet-500" />
              Working Hours
            </h2>
            <div className="space-y-2">
              {DAY_ORDER
                .filter((day) => workingHours[day])
                .map((day) => {
                  const hours = workingHours[day];
                  return (
                    <div key={day} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 capitalize font-medium">{day}</span>
                      {hours.closed ? (
                        <span className="text-red-400 text-xs font-medium">Closed</span>
                      ) : (
                        <span className="text-gray-900">
                          {formatTime(hours.open)} - {formatTime(hours.close)}
                        </span>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Services */}
        <div className="mt-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Services</h2>

          {services.length === 0 && (
            <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
              <p className="text-sm text-gray-400">No services available yet.</p>
            </div>
          )}

          <div className="space-y-3">
            {services.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-violet-100 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{service.name}</h3>
                    {service.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{service.description}</p>
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
                  <Link
                    href={`/business/${id}/book?service=${service.id}`}
                    className="shrink-0 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-700 active:scale-95 transition-all shadow-sm shadow-violet-200"
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
