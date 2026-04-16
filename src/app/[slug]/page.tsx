'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Phone, Clock, BadgeCheck, Scissors, Car, Sparkles, SlidersHorizontal } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { getBusinessBySlug, getServices } from '@/lib/api';
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

export default function BusinessSlugPage() {
  const { slug } = useParams<{ slug: string }>();
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    let isCancelled = false;

    async function loadBusinessDetails() {
      setLoading(true);
      try {
        const biz = await getBusinessBySlug(slug);
        const svcs = await getServices(biz.id);
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
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="" showBack />
        <div className="mx-auto max-w-lg animate-pulse space-y-4 px-4 pt-6">
          <div className="h-8 w-2/3 rounded-lg bg-gray-200" />
          <div className="h-4 w-1/3 rounded-lg bg-gray-100" />
          <div className="h-4 w-1/2 rounded-lg bg-gray-100" />
          <div className="mt-6 h-5 w-1/4 rounded-lg bg-gray-200" />
          <div className="mt-2 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl border border-gray-100 bg-white" />
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
        <div className="py-20 text-center">
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
    url: `https://bookourspot.com/${business.slug}`,
    sameAs: [],
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <Header title={business.name} showBack />

      <div className="mx-auto max-w-lg px-4 pt-5">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-gray-900">{business.name}</h1>
              <span className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${catConfig.color}`}>
                {catConfig.icon}
                {business.category.replace('_', ' ')}
              </span>
            </div>
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-violet-200">
              <BadgeCheck size={28} className="text-violet-500" />
            </div>
          </div>

          {business.description && (
            <p className="mt-3 text-sm leading-relaxed text-gray-600">{business.description}</p>
          )}

          <div className="mt-4 space-y-2">
            {business.location && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin size={16} className="shrink-0 text-violet-500" />
                <span>{business.location}</span>
              </div>
            )}
            {business.phone && (
              <a href={`tel:${business.phone}`} className="flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-violet-600">
                <Phone size={16} className="shrink-0 text-violet-500" />
                <span>{business.phone}</span>
              </a>
            )}
          </div>
        </div>

        {workingHours && Object.keys(workingHours).length > 0 && (
          <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-900">
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
                      <span className="capitalize font-medium text-gray-600">{day}</span>
                      {hours.closed ? (
                        <span className="text-xs font-medium text-red-400">Closed</span>
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

        <div className="mt-4">
          <h2 className="mb-3 text-base font-semibold text-gray-900">Services</h2>

          {services.length === 0 && (
            <div className="rounded-2xl border border-gray-100 bg-white py-10 text-center">
              <p className="text-sm text-gray-400">No services available yet.</p>
            </div>
          )}

          <div className="space-y-3">
            {services.map((service) => (
              <div
                key={service.id}
                className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:border-violet-100"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900">{service.name}</h3>
                    {service.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-gray-500">{service.description}</p>
                    )}
                    <div className="mt-2 flex items-center gap-3">
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
                    href={`/business/${business.id}/book?service=${service.id}`}
                    className="shrink-0 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-violet-200 transition-all hover:bg-violet-700 active:scale-95"
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
