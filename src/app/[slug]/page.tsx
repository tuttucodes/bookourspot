'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  BadgeCheck,
  Car,
  ChevronRight,
  Clock,
  MapPin,
  Phone,
  Scissors,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Star,
} from 'lucide-react';
import { getBusinessBySlug, getServices } from '@/lib/api';
import type { Business, Service, WorkingHours } from '@/lib/types';
import { SK_BARBERSHOP_IMAGES } from '@/lib/sk-barbershop';

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const CATEGORY_ICON: Record<string, React.ReactNode> = {
  salon: <Scissors size={14} />,
  barbershop: <Scissors size={14} />,
  car_wash: <Car size={14} />,
  spa: <Sparkles size={14} />,
  other: <SlidersHorizontal size={14} />,
};

function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
}

// Reserved top-level paths that should never be resolved as business slugs.
const RESERVED_SLUGS = new Set([
  'support', 'loyalty', 'stories', 'explore', 'bookings', 'profile',
  'login', 'signup', 'logout', 'dashboard', 'admin', 'api', 'auth',
  'merchant-apply', 'pending-review', 'for-business', 'business', 'booking',
]);

/**
 * Safely serialize structured-data JSON into an inline <script> tag.
 * Escapes the `<` character to prevent breaking out of the script context
 * (the standard Next.js-recommended pattern for JSON-LD).
 */
function safeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export default function BusinessSlugPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    if (RESERVED_SLUGS.has(slug.toLowerCase())) {
      router.replace(`/${slug.toLowerCase()}`);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const biz = await getBusinessBySlug(slug);
        const svcs = await getServices(biz.id);
        if (cancelled) return;
        setBusiness(biz);
        setServices(svcs);
      } catch {
        if (cancelled) return;
        setBusiness(null);
        setServices([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, router]);

  async function handleShare() {
    if (!business) return;
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const data = {
      title: business.name,
      text: `Check out ${business.name} on BookOurSpot`,
      url,
    };
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share(data); } catch { /* cancelled */ }
    } else if (typeof navigator !== 'undefined') {
      try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcf9f8]">
        <div className="animate-pulse">
          <div className="h-[300px] w-full bg-[#e5e2e1]" />
          <div className="app-content-compact space-y-4 pt-6">
            <div className="h-7 w-2/3 rounded-lg bg-[#e5e2e1]" />
            <div className="h-4 w-1/3 rounded-lg bg-[#eae7e7]" />
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 rounded-2xl bg-white" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-[#fcf9f8] flex items-center justify-center p-6">
        <div className="text-center space-y-3 max-w-sm">
          <h1 className="type-headline text-[#1c1b1b]">Spot not found</h1>
          <p className="text-sm text-[#3e484c]">
            We couldn&apos;t find that business. It may have moved, or the link is out of date.
          </p>
          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white"
          >
            Explore other spots
          </Link>
        </div>
      </div>
    );
  }

  const workingHours = business.working_hours as WorkingHours | null;
  const isSkBarbershop = ['skbarbershop', 'sk-barbershop'].includes(business.slug);
  const icon = CATEGORY_ICON[business.category] || CATEGORY_ICON.other;
  const heroImage = isSkBarbershop
    ? SK_BARBERSHOP_IMAGES.hero
    : business.image_url || null;

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: business.name,
    description: business.description || undefined,
    telephone: business.phone || undefined,
    address: business.address || business.location || undefined,
    areaServed: business.location || 'Malaysia',
    url: `https://bookourspot.com/${business.slug}`,
  };

  return (
    <div className="min-h-screen bg-[#fcf9f8] pb-28">
      <script type="application/ld+json">{safeJsonLd(localBusinessSchema)}</script>

      {/* Floating back + share — glass on top of hero */}
      <header className="sticky top-0 z-30 bg-surface-glass">
        <div className="flex items-center justify-between gap-3 px-4 py-3 max-w-6xl mx-auto">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-[#1c1b1b] shadow-ambient backdrop-blur-sm"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-[#1c1b1b] shadow-ambient backdrop-blur-sm"
            aria-label="Share"
          >
            <Share2 size={18} />
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="-mt-16 relative">
        <div className="relative h-[360px] w-full overflow-hidden sm:h-[440px]">
          {heroImage ? (
            <Image
              src={heroImage}
              alt={`${business.name} interior`}
              fill
              className="object-cover"
              sizes="100vw"
              priority
              unoptimized={typeof heroImage === 'string' && !heroImage.startsWith('/')}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#006273] via-[#107c91] to-[#00687a]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1c1b1b]/80 via-[#1c1b1b]/10 to-transparent" />
        </div>

        {/* Editorial overlap card */}
        <div className="app-content -mt-24 relative z-10">
          <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-ambient">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#f4d9ff] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#580087]">
                {icon}
                {business.category.replace('_', ' ')}
              </span>
              {business.verification_status === 'approved' ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#eff6ff] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#1e40af]">
                  <BadgeCheck size={12} /> Verified
                </span>
              ) : null}
            </div>
            <h1 className="mt-3 type-headline text-[28px] sm:text-[32px] text-[#1c1b1b]">
              {business.name}
            </h1>
            {business.description ? (
              <p className="mt-2 text-sm leading-relaxed text-[#3e484c] max-w-2xl">
                {business.description}
              </p>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#3e484c]">
              {business.location ? (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={14} className="text-[#006273]" /> {business.location}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5">
                <Star size={14} className="text-[#f59e0b] fill-[#f59e0b]" /> 4.8
                <span className="text-[#6e797c]">(new)</span>
              </span>
            </div>

            <div className="mt-5 flex gap-2 flex-wrap">
              <Link
                href={`/${slug}/book`}
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-ambient"
              >
                Book a visit
              </Link>
              {business.phone ? (
                <a
                  href={`tel:${business.phone}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#f0eded] px-4 py-2.5 text-sm font-semibold text-[#006273]"
                >
                  <Phone size={14} /> Call
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div className="app-content space-y-6 mt-6">
        {/* Services */}
        <section>
          <div className="flex items-end justify-between mb-3 px-1">
            <div>
              <p className="type-label text-[#006273]">Menu</p>
              <h2 className="mt-0.5 text-xl font-bold text-[#1c1b1b]">Services &amp; prices</h2>
            </div>
            <span className="type-label text-[#3e484c]">
              {services.length} {services.length === 1 ? 'option' : 'options'}
            </span>
          </div>

          {services.length === 0 ? (
            <div className="rounded-3xl bg-white py-14 text-center">
              <p className="type-label text-[#3e484c]">No services listed yet</p>
              <p className="mt-1 text-sm text-[#6e797c]">
                Check back soon or contact the shop directly.
              </p>
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {services.map((service) => (
                <li key={service.id}>
                  <Link
                    href={`/${slug}/book?service=${service.id}`}
                    className="group flex h-full flex-col rounded-3xl bg-white p-5 hover:shadow-ambient transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-[#1c1b1b] text-[15px]">{service.name}</h3>
                        {service.description ? (
                          <p className="mt-1 line-clamp-2 text-xs text-[#3e484c]">{service.description}</p>
                        ) : null}
                        <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-[#f6f3f2] px-2.5 py-1 text-[11px] font-medium text-[#3e484c]">
                          <Clock size={11} /> {service.duration_minutes} min
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-[#006273] leading-none">
                          RM {Number(service.price).toFixed(0)}
                        </p>
                        <p className="mt-0.5 type-label text-[#3e484c]">
                          {Number(service.price) % 1 === 0 ? 'flat' : 'from'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between pt-3 border-t border-[#f0eded]">
                      <span className="text-xs text-[#3e484c]">Tap to pick a time</span>
                      <ChevronRight
                        size={14}
                        className="text-[#006273] transition-transform group-hover:translate-x-0.5"
                      />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Gallery (SK only, for now) */}
        {isSkBarbershop && (
          <section>
            <div className="flex items-end justify-between mb-3 px-1">
              <div>
                <p className="type-label text-[#006273]">Gallery</p>
                <h2 className="mt-0.5 text-xl font-bold text-[#1c1b1b]">Inside the shop</h2>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1.2fr_1fr] lg:grid-cols-[1.4fr_0.9fr]">
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-[#e5e2e1]">
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
                  <div
                    key={photo.src}
                    className="relative aspect-square sm:aspect-[4/3] overflow-hidden rounded-3xl bg-[#e5e2e1]"
                  >
                    <Image
                      src={photo.src}
                      alt={photo.alt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Address + Hours */}
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl bg-white p-5">
            <p className="type-label text-[#006273]">Visit</p>
            <h3 className="mt-1 font-bold text-[#1c1b1b]">How to get there</h3>
            <div className="mt-4 space-y-3 text-sm text-[#1c1b1b]">
              {business.address ? (
                <div className="flex gap-2">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-[#006273]" />
                  <span>{business.address}</span>
                </div>
              ) : business.location ? (
                <div className="flex gap-2">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-[#006273]" />
                  <span>{business.location}</span>
                </div>
              ) : null}
              {business.phone ? (
                <a
                  href={`tel:${business.phone}`}
                  className="flex items-center gap-2 hover:text-[#006273]"
                >
                  <Phone size={16} className="shrink-0 text-[#006273]" />
                  {business.phone}
                </a>
              ) : null}
            </div>
          </div>

          {workingHours && Object.keys(workingHours).length > 0 ? (
            <div className="rounded-3xl bg-white p-5">
              <p className="type-label text-[#006273]">Hours</p>
              <h3 className="mt-1 font-bold text-[#1c1b1b]">When we&apos;re open</h3>
              <ul className="mt-4 space-y-2 text-sm">
                {DAY_ORDER.filter((day) => workingHours[day]).map((day) => {
                  const hours = workingHours[day];
                  return (
                    <li key={day} className="flex justify-between gap-3">
                      <span className="capitalize text-[#3e484c]">{day}</span>
                      {hours.closed ? (
                        <span className="font-medium text-[#ba1a1a]">Closed</span>
                      ) : (
                        <span className="font-medium text-[#1c1b1b] tabular-nums">
                          {formatTime(hours.open)} – {formatTime(hours.close)}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </section>
      </div>

      {/* Sticky bottom CTA — thumb-friendly on mobile */}
      <div className="fixed bottom-4 left-0 right-0 z-20 px-4 sm:hidden">
        <Link
          href={`/${slug}/book`}
          className="flex w-full items-center justify-center rounded-full bg-brand-gradient py-3.5 text-sm font-semibold text-white shadow-ambient"
        >
          Book a visit at {business.name.split(' ').slice(0, 2).join(' ')}
        </Link>
      </div>
    </div>
  );
}
