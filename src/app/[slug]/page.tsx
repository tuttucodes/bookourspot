'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Phone, Clock, BadgeCheck, Scissors, Car, Sparkles, SlidersHorizontal } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { getBusinessBySlug, getServices } from '@/lib/api';
import type { Business, Service, WorkingHours } from '@/lib/types';
import { SK_BARBERSHOP_IMAGES } from '@/lib/sk-barbershop';

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
        <div className="app-content-compact animate-pulse space-y-4 pt-6">
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
  const isSkBarbershop = business.slug === 'skbarbershop';
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

      <div className="app-content space-y-5 pt-5">
        <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <div className="relative min-h-[200px] w-full md:min-h-[240px]">
            {isSkBarbershop ? (
              <Image
                src={SK_BARBERSHOP_IMAGES.hero}
                alt={`${business.name} interior`}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 72rem"
                priority
              />
            ) : business.image_url ? (
              <Image
                src={business.image_url}
                alt={business.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 72rem"
                priority
                unoptimized={!business.image_url.startsWith('/')}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-violet-500 to-fuchsia-500" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="min-w-0 text-white">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${catConfig.color} ring-1 ring-white/30`}
                  >
                    {catConfig.icon}
                    {business.category.replace('_', ' ')}
                  </span>
                  <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-4xl">{business.name}</h1>
                  {business.description ? (
                    <p className="mt-2 max-w-2xl text-sm text-white/90 line-clamp-3 sm:line-clamp-none">
                      {business.description}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-2 rounded-2xl bg-white/10 p-1 backdrop-blur">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                    <BadgeCheck size={26} className="text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {isSkBarbershop && (
          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Inside the shop</h2>
                <p className="mt-1 text-sm text-gray-500">Real photos so you know what to expect.</p>
              </div>
              <span className="rounded-full bg-violet-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-violet-700">
                Gallery
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1.2fr_1fr] lg:grid-cols-[1.4fr_0.9fr]">
              <div className="relative min-h-[220px] overflow-hidden rounded-2xl bg-gray-100 sm:min-h-[280px]">
                <Image
                  src={SK_BARBERSHOP_IMAGES.gallery[0].src}
                  alt={SK_BARBERSHOP_IMAGES.gallery[0].alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-1 sm:grid-rows-2">
                {SK_BARBERSHOP_IMAGES.gallery.slice(1, 3).map((photo) => (
                  <div key={photo.src} className="relative min-h-[104px] overflow-hidden rounded-2xl bg-gray-100 sm:min-h-0">
                    <Image src={photo.src} alt={photo.alt} fill className="object-cover" sizes="(max-width: 640px) 50vw, 25vw" />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_min(22rem,100%)] lg:items-start">
          <div className="min-w-0 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Services &amp; prices</h2>
              <p className="mt-1 text-sm text-gray-500">Choose a service, then pick a time on the next step.</p>
            </div>

            {services.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-white py-12 text-center shadow-sm">
                <p className="text-sm text-gray-400">No services available yet.</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="flex flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-violet-200"
                  >
                    <h3 className="font-semibold text-gray-900">{service.name}</h3>
                    {service.description ? (
                      <p className="mt-1 line-clamp-2 text-xs text-gray-500">{service.description}</p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} className="text-violet-400" />
                        {service.duration_minutes} min
                      </span>
                      <span className="text-sm font-semibold text-violet-600">RM {service.price.toFixed(2)}</span>
                    </div>
                    <Link
                      href={`/${slug}/book?service=${service.id}`}
                      className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
                    >
                      Book now
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          <aside className="min-w-0 space-y-4 lg:sticky lg:top-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="text-base font-bold text-gray-900">Visit &amp; contact</h2>
              <Link
                href={`/${slug}/book`}
                className="mt-4 flex w-full items-center justify-center rounded-full bg-violet-600 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-violet-700"
              >
                Book a visit
              </Link>
              <div className="mt-5 space-y-3 text-sm text-gray-600">
                {business.location ? (
                  <div className="flex gap-2">
                    <MapPin size={18} className="mt-0.5 shrink-0 text-violet-500" />
                    <span>{business.location}</span>
                  </div>
                ) : null}
                {business.address ? (
                  <div className="flex gap-2">
                    <MapPin size={18} className="mt-0.5 shrink-0 text-violet-400" />
                    <span>{business.address}</span>
                  </div>
                ) : null}
                {business.phone ? (
                  <a href={`tel:${business.phone}`} className="flex items-center gap-2 transition hover:text-violet-600">
                    <Phone size={18} className="shrink-0 text-violet-500" />
                    {business.phone}
                  </a>
                ) : null}
              </div>
            </div>

            {workingHours && Object.keys(workingHours).length > 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-gray-900">
                  <Clock size={18} className="text-violet-500" />
                  Hours
                </h2>
                <ul className="space-y-2 text-sm">
                  {DAY_ORDER.filter((day) => workingHours[day]).map((day) => {
                    const hours = workingHours[day];
                    return (
                      <li key={day} className="flex justify-between gap-3 border-b border-gray-50 pb-2 last:border-0">
                        <span className="capitalize text-gray-500">{day}</span>
                        {hours.closed ? (
                          <span className="font-medium text-red-400">Closed</span>
                        ) : (
                          <span className="font-medium text-gray-900">
                            {formatTime(hours.open)} – {formatTime(hours.close)}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}
