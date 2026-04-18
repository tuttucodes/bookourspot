'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  MapPin,
  Star,
  Scissors,
  Car,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Clock3,
  Smartphone,
  ArrowRight,
  TrendingUp,
  SlidersHorizontal,
} from 'lucide-react';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { getBusinesses } from '@/lib/api';
import type { Business } from '@/lib/types';
import { SK_BARBERSHOP_IMAGES } from '@/lib/sk-barbershop';

const CATEGORIES = [
  { key: 'salon', label: 'Salon', icon: Scissors, color: 'bg-pink-50 text-pink-600 border-pink-100' },
  { key: 'barbershop', label: 'Barbershop', icon: Scissors, color: 'bg-blue-50 text-blue-600 border-blue-100' },
  { key: 'car_wash', label: 'Car Wash', icon: Car, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  { key: 'spa', label: 'Spa', icon: Sparkles, color: 'bg-violet-50 text-violet-600 border-violet-100' },
];

const TESTIMONIALS = [
  {
    name: 'Aina',
    city: 'Cyberjaya',
    text: 'Found a great hair studio in minutes. Booking and reminders were super smooth.',
  },
  {
    name: 'Kumar',
    city: 'Petaling Jaya',
    text: 'I use BookOurSpot every week for my trim. Fast, simple, and reliable.',
  },
  {
    name: 'Nadia',
    city: 'Kuala Lumpur',
    text: 'Love being able to compare ratings, prices, and available slots before booking.',
  },
];

const TRENDING_STORIES = [
  {
    title: 'Fresh fades in KL',
    description: 'Barbershops with clean fades, quick evening slots, and dependable walk-in energy.',
    href: '/stories/fresh-fades-kl',
  },
  {
    title: 'Weekend spa reset',
    description: 'Massage and facial spots that feel premium without making discovery feel hard.',
    href: '/stories/weekend-spa-reset',
  },
  {
    title: 'After-work glam',
    description: 'Salon picks with same-day availability for fast post-office appointments.',
    href: '/stories/after-work-glam',
  },
];

const PUBLIC_PROFILE_SHOPS = [
  {
    key: 'skbarbershop-public',
    name: 'SK Barbershop',
    category: 'barbershop',
    location: 'Cyberjaya, Selangor, Malaysia',
    description: 'Affordable grooming, clean fades, and quick service in Cyberjaya.',
    href: '/skbarbershop',
  },
];

export default function HomePageClient() {
  const { profile, loading } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    getBusinesses().then(setBusinesses).catch(() => {});
  }, []);

  const hasShopInDb = (shopName: string) =>
    businesses.some((biz) => biz.name.trim().toLowerCase() === shopName.trim().toLowerCase());

  const publicOnlyProfiles = PUBLIC_PROFILE_SHOPS.filter((shop) => !hasShopInDb(shop.name));
  const totalShopsCount = businesses.length + publicOnlyProfiles.length;
  const featuredBusinesses = useMemo(() => businesses.slice(0, 3), [businesses]);
  const nearbyBusinesses = useMemo(() => businesses.slice(0, 6), [businesses]);
  const searchHref = searchQuery.trim() ? `/explore?search=${encodeURIComponent(searchQuery.trim())}` : '/explore';

  return (
    <div className="bg-[#fcf9f8] pb-20 md:pb-8">
      <section className="rounded-b-[2rem] bg-[#fcf9f8] px-5 pt-6 pb-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-gray-500">
              {loading ? 'Loading...' : profile ? `Welcome back, ${profile.name}` : 'Discover nearby'}
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-gray-900">BookOurSpot</h1>
          </div>
          <button className="rounded-full bg-white p-3 text-[#006273] shadow-sm">
            <SlidersHorizontal size={18} />
          </button>
        </div>

        <div className="mb-5 flex items-center gap-2 text-sm text-gray-500">
          <MapPin size={16} className="text-[#006273]" />
          <span>Kuala Lumpur</span>
        </div>

        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#006273] to-[#107c91] p-6 text-white shadow-sm">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="relative z-10">
            <span className="inline-flex rounded-full bg-[#f4d9ff] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#580087]">
              Discovery first
            </span>
            <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight">
              Find your next salon, barber, spa, or wash spot in minutes.
            </h2>
            <p className="mt-3 max-w-md text-sm text-[#ebfaff]">
              Explore trusted businesses, compare services, and book slots without calling around.
            </p>

            <div className="mt-5 rounded-2xl bg-white p-2 text-gray-900 shadow-lg">
              <div className="flex items-center gap-3 rounded-xl px-3 py-2">
                <Search size={18} className="text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Treatments or locations in Malaysia..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                />
                <Link
                  href={searchHref}
                  className="rounded-full bg-[#006273] px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] text-white"
                >
                  Search
                </Link>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs text-white/90">
                <ShieldCheck size={12} /> Verified businesses
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs text-white/90">
                <Clock3 size={12} /> Live availability
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-2xl font-black text-gray-900">{totalShopsCount > 0 ? `${totalShopsCount}+` : '100+'}</p>
            <p className="mt-1 text-xs text-gray-500">Local businesses</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-2xl font-black text-gray-900">24/7</p>
            <p className="mt-1 text-xs text-gray-500">Online booking</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-2xl font-black text-gray-900">4.8★</p>
            <p className="mt-1 text-xs text-gray-500">Happy customers</p>
          </div>
        </div>
      </section>

      <section className="px-5 mt-6">
        <div className="overflow-hidden rounded-[2rem] bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#006273]">Featured promo</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-gray-900">Your first sanctuary visit is on us.</h3>
              <p className="mt-2 text-sm text-gray-500">
                Enjoy a discovery-first launch promo and explore premium spots with easier first-time booking.
              </p>
            </div>
            <Smartphone className="shrink-0 text-[#006273]" size={20} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/explore" className="inline-flex items-center gap-2 rounded-full bg-[#006273] px-4 py-2 text-sm font-semibold text-white">
              Explore now <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      <section className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-gray-900">Curation</h2>
            <p className="text-sm text-gray-500">Start from the service you want most.</p>
          </div>
          <Link href="/explore" className="text-sm font-medium text-[#006273] flex items-center gap-0.5">
            Explore all <ChevronRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CATEGORIES.map(({ key, label, icon: Icon, color }) => (
            <Link
              key={key}
              href={`/explore?category=${key}`}
              className={`aspect-square rounded-[1.5rem] border p-5 transition-transform active:scale-95 ${color}`}
            >
              <div className="flex h-full flex-col justify-between">
                <Icon size={22} />
                <p className="text-sm font-semibold">{label}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-5 mt-8">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-gray-900">Recommended</h2>
            <p className="text-sm text-gray-500">Personalized picks and popular local spots.</p>
          </div>
        </div>

        <div className="space-y-4">
          {featuredBusinesses.length === 0 && publicOnlyProfiles.length > 0 && publicOnlyProfiles.slice(0, 1).map((shop) => (
            <Link
              key={shop.key}
              href={shop.href}
              className="block overflow-hidden rounded-[2rem] bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#006273]">Featured</p>
                  <h3 className="mt-2 text-xl font-bold text-gray-900">{shop.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">{shop.location}</p>
                </div>
                <div className="rounded-full bg-[#ebfaff] px-3 py-1 text-xs font-semibold text-[#006273]">Book</div>
              </div>
            </Link>
          ))}

          {featuredBusinesses.map((biz) => (
            <Link
              key={biz.id}
              href={`/${biz.slug}`}
              className="block overflow-hidden rounded-[2rem] bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="inline-flex items-center gap-1 rounded-full bg-[#ebfaff] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#006273]">
                    <Sparkles size={11} /> Recommended
                  </div>
                  <h3 className="mt-3 text-xl font-bold tracking-tight text-gray-900">{biz.name}</h3>
                  <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                    <MapPin size={13} /> {biz.location || 'Malaysia'}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-gray-500">
                    {biz.description || 'Trusted local services with easy appointment booking and smooth checkout.'}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <span className="inline-flex items-center gap-1 font-semibold text-gray-800">
                      <Star size={14} className="fill-amber-400 text-amber-400" /> 4.8
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="font-semibold text-[#006273]">From RM 35+</span>
                  </div>
                </div>
                <ArrowRight size={18} className="mt-1 shrink-0 text-gray-400" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-5 mt-8">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-gray-900">Near you</h2>
            <p className="text-sm text-gray-500">Discovery cards inspired by what’s popular nearby.</p>
          </div>
          <Link href="/explore" className="text-sm text-[#006273] font-medium flex items-center gap-0.5">
            See all <ChevronRight size={14} />
          </Link>
        </div>

        <div className="space-y-3">
          {businesses.length === 0 && publicOnlyProfiles.length === 0 && !loading && (
            <div className="text-center py-10 text-gray-500 bg-white border border-gray-100 rounded-2xl">
              <Sparkles size={28} className="mx-auto mb-2 opacity-60" />
              <p className="text-sm">No businesses listed yet in this area.</p>
              <Link href="/login?role=merchant" className="text-sm text-[#006273] font-medium mt-2 inline-block">
                List your business →
              </Link>
            </div>
          )}

          {publicOnlyProfiles.map((shop) => (
            <Link
              key={shop.key}
              href={shop.href}
              className="block rounded-[1.75rem] border border-[#e5e2e1] bg-white p-4 shadow-sm hover:shadow-md hover:border-[#7cd3ea] transition-all"
            >
              <div className="flex gap-4">
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-[#ebfaff] to-[#acecff] shrink-0">
                  <Image
                    src={SK_BARBERSHOP_IMAGES.card}
                    alt="SK Barbershop storefront"
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 truncate">{shop.name}</h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-[#f4d9ff] text-[#580087] capitalize">
                      Featured
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <MapPin size={12} /> {shop.location}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{shop.description}</p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1">
                      <Star size={12} className="text-amber-400 fill-amber-400" />
                      <span className="text-xs font-medium text-gray-700">4.2</span>
                      <span className="text-xs text-gray-400">(13)</span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#006273]">
                      View <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {nearbyBusinesses.map((biz) => (
            <Link
              key={biz.id}
              href={`/${biz.slug}`}
              className="block rounded-[1.75rem] border border-[#e5e2e1] bg-white p-4 shadow-sm hover:shadow-md hover:border-[#7cd3ea] transition-all"
            >
              <div className="flex gap-4">
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-[#ebfaff] to-[#acecff] shrink-0">
                  {biz.slug === 'skbarbershop' ? (
                    <Image
                      src={SK_BARBERSHOP_IMAGES.card}
                      alt="SK Barbershop storefront"
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Scissors size={24} className="text-[#006273]" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 truncate">{biz.name}</h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-[#f4d9ff] text-[#580087] capitalize">
                      {biz.category.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <MapPin size={12} /> {biz.location || 'Malaysia'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                    {biz.description || 'Top-rated local services with easy booking.'}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1">
                      <Star size={12} className="text-amber-400 fill-amber-400" />
                      <span className="text-xs font-medium text-gray-700">4.7</span>
                      <span className="text-xs text-gray-400">(120+)</span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#006273]">
                      View <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-5 mt-8">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-gray-900">Trending in Malaysia</h2>
            <p className="text-sm text-gray-500">Editorial discovery blocks that drive browsing.</p>
          </div>
          <TrendingUp size={18} className="text-[#006273]" />
        </div>

        <div className="space-y-3">
          {TRENDING_STORIES.map((story, index) => (
            <Link
              key={story.title}
              href={story.href}
              className={`block rounded-[1.75rem] p-5 shadow-sm ${
                index === 0 ? 'bg-[#006273] text-white' : 'bg-white text-gray-900'
              }`}
            >
              <p className={`text-[10px] font-bold uppercase tracking-[0.08em] ${index === 0 ? 'text-[#acecff]' : 'text-[#006273]'}`}>
                {index === 0 ? 'Top pick' : index === 1 ? 'Rising' : 'Popular'}
              </p>
              <h3 className="mt-2 text-xl font-bold tracking-tight">{story.title}</h3>
              <p className={`mt-2 text-sm ${index === 0 ? 'text-white/80' : 'text-gray-500'}`}>{story.description}</p>
              <span className={`mt-4 inline-flex items-center gap-1 text-sm font-semibold ${index === 0 ? 'text-white' : 'text-[#006273]'}`}>
                Explore story <ArrowRight size={14} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-5 mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Loved by customers</h2>
        <div className="space-y-3">
          {TESTIMONIALS.map((t) => (
            <article key={t.name} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star key={idx} size={13} className="text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm text-gray-700 mt-2">{t.text}</p>
              <p className="text-xs text-gray-500 mt-2">
                {t.name} · {t.city}
              </p>
            </article>
          ))}
        </div>
      </section>

      {!loading && !profile && (
        <section className="px-5 mt-8">
          <div className="bg-gradient-to-r from-violet-600 to-violet-700 rounded-2xl p-5 text-white">
            <h3 className="font-semibold text-lg">Grow your business with BookOurSpot</h3>
            <p className="text-sm text-violet-100 mt-1">
              Accept online bookings, reduce no-shows, and reach more local customers.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <Link
                href="/for-business"
                className="inline-block px-4 py-2 bg-white text-violet-700 text-sm font-semibold rounded-xl active:scale-95"
              >
                Explore For Business
              </Link>
              <Link
                href="/login?role=merchant"
                className="inline-block px-4 py-2 bg-violet-800/60 border border-white/30 text-white text-sm font-medium rounded-xl active:scale-95"
              >
                Merchant Login
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="px-5 mt-8 mb-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm">
          <p className="text-sm text-gray-700">Ready for your next appointment?</p>
          <Link
            href="/explore"
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#006273] text-white text-sm font-medium"
          >
            <Search size={14} /> Start booking now
          </Link>
        </div>
      </section>

      <BottomNav />
    </div>
  );
}
