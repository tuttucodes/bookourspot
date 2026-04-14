'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  MapPin,
  Star,
  Scissors,
  Car,
  Sparkles,
  ChevronRight,
  Download,
  ShieldCheck,
  Clock3,
  Smartphone,
} from 'lucide-react';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { getBusinesses } from '@/lib/api';
import type { Business } from '@/lib/types';

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

export default function HomePageClient() {
  const { profile, loading } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);

  useEffect(() => {
    getBusinesses().then(setBusinesses).catch(() => {});
  }, []);

  return (
    <div className="pb-20 bg-white">
      <section className="px-5 pt-7 pb-8 bg-gradient-to-b from-violet-950 via-violet-900 to-violet-800 text-white rounded-b-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-violet-200 text-xs">
              {loading ? 'Loading...' : profile ? `Welcome back, ${profile.name}` : 'Discover and book nearby'}
            </p>
            <h1 className="text-3xl font-bold mt-1 tracking-tight">BookOurSpot</h1>
          </div>
          <span className="text-[11px] px-3 py-1.5 rounded-full bg-white/15 border border-white/20">
            Malaysia
          </span>
        </div>

        <h2 className="text-2xl font-semibold leading-tight">
          Book local beauty and wellness services instantly
        </h2>
        <p className="text-violet-200 text-sm mt-2">
          Find trusted salons, barbershops, spas and car washes with real availability and ratings.
        </p>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="bg-white/10 border border-white/15 rounded-xl p-3">
            <p className="text-xl font-semibold">{businesses.length > 0 ? `${businesses.length}+` : '100+'}</p>
            <p className="text-violet-200 text-xs">Local businesses</p>
          </div>
          <div className="bg-white/10 border border-white/15 rounded-xl p-3">
            <p className="text-xl font-semibold">24/7</p>
            <p className="text-violet-200 text-xs">Online booking</p>
          </div>
          <div className="bg-white/10 border border-white/15 rounded-xl p-3">
            <p className="text-xl font-semibold">4.8★</p>
            <p className="text-violet-200 text-xs">Average user satisfaction</p>
          </div>
        </div>

        <Link
          href="/explore"
          className="mt-5 flex items-center gap-3 bg-white text-violet-900 rounded-2xl px-4 py-3 font-medium shadow-lg"
        >
          <Search size={18} />
          <span>Search salon, barbershop, spa...</span>
        </Link>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-xs bg-white/15 border border-white/20 px-3 py-1 rounded-full inline-flex items-center gap-1">
            <ShieldCheck size={12} /> Verified businesses
          </span>
          <span className="text-xs bg-white/15 border border-white/20 px-3 py-1 rounded-full inline-flex items-center gap-1">
            <Clock3 size={12} /> Live availability
          </span>
        </div>
      </section>

      <section className="px-5 mt-6">
        <div className="rounded-2xl bg-violet-50 border border-violet-100 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-violet-900">Get the BookOurSpot app</h3>
              <p className="text-sm text-violet-700 mt-1">
                Faster booking, smart reminders, and one-tap rebooking for your favorite spots.
              </p>
            </div>
            <Smartphone className="text-violet-600 shrink-0" size={20} />
          </div>
          <button className="mt-3 inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl bg-violet-600 text-white">
            <Download size={14} /> Download app
          </button>
        </div>
      </section>

      <section className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Browse categories</h2>
          <Link href="/explore" className="text-sm text-violet-600 font-medium flex items-center gap-0.5">
            Explore all <ChevronRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CATEGORIES.map(({ key, label, icon: Icon, color }) => (
            <Link
              key={key}
              href={`/explore?category=${key}`}
              className={`rounded-2xl border p-4 transition-transform active:scale-95 ${color}`}
            >
              <Icon size={20} />
              <p className="mt-2 text-sm font-semibold">{label}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-5 mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Top spots near you</h2>
          <Link href="/explore" className="text-sm text-violet-600 font-medium flex items-center gap-0.5">
            See all <ChevronRight size={14} />
          </Link>
        </div>

        <div className="space-y-3">
          {businesses.length === 0 && !loading && (
            <div className="text-center py-10 text-gray-500 bg-gray-50 border border-gray-100 rounded-2xl">
              <Sparkles size={28} className="mx-auto mb-2 opacity-60" />
              <p className="text-sm">No businesses listed yet in this area.</p>
              <Link href="/login?role=merchant" className="text-sm text-violet-600 font-medium mt-2 inline-block">
                List your business →
              </Link>
            </div>
          )}

          {businesses.slice(0, 6).map((biz) => (
            <Link
              key={biz.id}
              href={`/business/${biz.id}`}
              className="block rounded-2xl border border-gray-100 bg-white p-3 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-violet-100 to-violet-200 flex items-center justify-center shrink-0">
                  <Scissors size={24} className="text-violet-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 truncate">{biz.name}</h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-violet-50 text-violet-700 capitalize">
                      {biz.category.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <MapPin size={12} /> {biz.location || 'Malaysia'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{biz.description || 'Top-rated local services with easy booking.'}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Star size={12} className="text-amber-400 fill-amber-400" />
                    <span className="text-xs font-medium text-gray-700">4.7</span>
                    <span className="text-xs text-gray-400">(120+)</span>
                  </div>
                </div>
              </div>
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
            <Link
              href="/login?role=merchant"
              className="inline-block mt-4 px-4 py-2 bg-white text-violet-700 text-sm font-semibold rounded-xl active:scale-95"
            >
              Get Started Free
            </Link>
          </div>
        </section>
      )}

      <section className="px-5 mt-8 mb-3">
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center">
          <p className="text-sm text-gray-700">Ready for your next appointment?</p>
          <Link
            href="/explore"
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium"
          >
            <Search size={14} /> Start booking now
          </Link>
        </div>
      </section>

      <BottomNav />
    </div>
  );
}
