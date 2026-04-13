'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, MapPin, Star, Scissors, Car, Sparkles, ChevronRight } from 'lucide-react';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { getBusinesses } from '@/lib/api';
import type { Business } from '@/lib/types';

const CATEGORIES = [
  { key: 'salon', label: 'Salon', icon: Scissors, color: 'bg-pink-100 text-pink-600' },
  { key: 'barbershop', label: 'Barber', icon: Scissors, color: 'bg-blue-100 text-blue-600' },
  { key: 'car_wash', label: 'Car Wash', icon: Car, color: 'bg-green-100 text-green-600' },
  { key: 'spa', label: 'Spa', icon: Sparkles, color: 'bg-purple-100 text-purple-600' },
];

export default function HomePage() {
  const { profile, loading } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);

  useEffect(() => {
    getBusinesses().then(setBusinesses).catch(() => {});
  }, []);

  return (
    <div className="pb-20">
      {/* Hero */}
      <div className="bg-gradient-to-br from-violet-600 to-violet-800 text-white px-5 pt-12 pb-8 rounded-b-3xl">
        <div className="mb-6">
          <p className="text-violet-200 text-sm">
            {loading ? '' : profile ? `Hi, ${profile.name}` : 'Welcome to'}
          </p>
          <h1 className="text-2xl font-bold mt-1">BookOurSpot</h1>
          <p className="text-violet-200 text-sm mt-1">Book appointments in seconds</p>
        </div>
        <Link href="/explore" className="flex items-center gap-3 bg-white/15 backdrop-blur rounded-xl px-4 py-3">
          <Search size={18} className="text-violet-200" />
          <span className="text-violet-200 text-sm">Search salons, barbershops...</span>
        </Link>
      </div>

      {/* Categories */}
      <div className="px-5 mt-6">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Categories</h2>
        <div className="grid grid-cols-4 gap-3">
          {CATEGORIES.map(({ key, label, icon: Icon, color }) => (
            <Link
              key={key}
              href={`/explore?category=${key}`}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon size={20} />
              </div>
              <span className="text-xs font-medium text-gray-700">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured Businesses */}
      <div className="px-5 mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">Popular Near You</h2>
          <Link href="/explore" className="text-sm text-violet-600 font-medium flex items-center gap-0.5">
            See all <ChevronRight size={14} />
          </Link>
        </div>
        <div className="space-y-3">
          {businesses.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-400">
              <Sparkles size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No businesses yet. Be the first!</p>
              <Link href="/login" className="text-sm text-violet-600 font-medium mt-2 inline-block">
                Register as a merchant &rarr;
              </Link>
            </div>
          )}
          {businesses.slice(0, 5).map(biz => (
            <Link
              key={biz.id}
              href={`/business/${biz.id}`}
              className="flex gap-4 p-3 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all"
            >
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-violet-100 to-violet-200 flex items-center justify-center shrink-0">
                <Scissors size={24} className="text-violet-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{biz.name}</h3>
                {biz.location && (
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <MapPin size={12} /> {biz.location}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{biz.description}</p>
                <div className="flex items-center gap-1 mt-2">
                  <Star size={12} className="text-amber-400 fill-amber-400" />
                  <span className="text-xs font-medium text-gray-600">New</span>
                  <span className="text-xs text-gray-300 ml-2 capitalize">{biz.category.replace('_', ' ')}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* CTA */}
      {!loading && !profile && (
        <div className="px-5 mt-8">
          <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl p-5 border border-violet-100">
            <h3 className="font-semibold text-gray-900">Own a business?</h3>
            <p className="text-sm text-gray-600 mt-1">List your salon, barbershop or car wash and get bookings instantly.</p>
            <Link
              href="/login?role=merchant"
              className="inline-block mt-3 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-700 transition-colors"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
