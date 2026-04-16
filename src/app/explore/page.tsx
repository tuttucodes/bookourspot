'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, MapPin, Scissors, Car, Sparkles, X, SlidersHorizontal } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { getBusinesses } from '@/lib/api';
import type { Business, BusinessCategory } from '@/lib/types';

const CATEGORIES: { key: 'all' | BusinessCategory; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'salon', label: 'Salon' },
  { key: 'barbershop', label: 'Barbershop' },
  { key: 'car_wash', label: 'Car Wash' },
  { key: 'spa', label: 'Spa' },
];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  salon: <Scissors size={18} className="text-pink-500" />,
  barbershop: <Scissors size={18} className="text-blue-500" />,
  car_wash: <Car size={18} className="text-green-500" />,
  spa: <Sparkles size={18} className="text-purple-500" />,
  other: <SlidersHorizontal size={18} className="text-gray-400" />,
};

const PUBLIC_PROFILE_SHOPS = [
  {
    key: 'skbarbershop-public',
    name: 'SK Barbershop',
    category: 'barbershop' as BusinessCategory,
    location: 'Cyberjaya, Selangor, Malaysia',
    description:
      'Affordable grooming, clean fades, and quick service in Cyberjaya.',
    href: '/skbarbershop',
  },
];

export default function ExplorePage() {
  return <Suspense fallback={<div className="min-h-screen bg-white" />}><ExploreContent /></Suspense>;
}

function ExploreContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialCategory = searchParams.get('category') || 'all';

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(initialCategory);

  const fetchBusinesses = useCallback(async (category: string, search: string) => {
    setLoading(true);
    try {
      const data = await getBusinesses(
        category === 'all' ? undefined : category,
        search || undefined
      );
      setBusinesses(data);
    } catch {
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBusinesses(activeCategory, searchQuery);
  }, [activeCategory, searchQuery, fetchBusinesses]);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const matchingPublicProfiles = PUBLIC_PROFILE_SHOPS.filter((shop) => {
    const matchesCategory = activeCategory === 'all' || shop.category === activeCategory;
    if (!matchesCategory) return false;
    if (!normalizedQuery) return true;
    const haystack = `${shop.name} ${shop.location} ${shop.description}`.toLowerCase();
    return haystack.includes(normalizedQuery);
  });

  const hasShopInDb = (shopName: string) =>
    businesses.some((biz) => biz.name.trim().toLowerCase() === shopName.trim().toLowerCase());

  const publicOnlyProfiles = matchingPublicProfiles.filter((shop) => !hasShopInDb(shop.name));

  const handleCategoryChange = (key: string) => {
    setActiveCategory(key);
    const params = new URLSearchParams();
    if (key !== 'all') params.set('category', key);
    router.replace(`/explore${params.toString() ? `?${params}` : ''}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header title="Explore" />

      {/* Search Bar */}
      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search businesses..."
            className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 shadow-sm transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={16} className="text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="max-w-lg mx-auto mt-3 px-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {CATEGORIES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleCategoryChange(key)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all
                ${activeCategory === key
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-200'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-violet-300 hover:text-violet-600'
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-lg mx-auto px-4 mt-4">
        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white border border-[#e5e2e1] shadow-sm animate-pulse">
                <div className="w-20 h-20 rounded-xl bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-2.5 py-1">
                  <div className="h-4 bg-gray-200 rounded-lg w-3/4" />
                  <div className="h-3 bg-gray-100 rounded-lg w-1/2" />
                  <div className="h-3 bg-gray-100 rounded-lg w-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && businesses.length === 0 && publicOnlyProfiles.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-4">
              <Search size={28} className="text-violet-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">No businesses found</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-[260px] mx-auto">
              {searchQuery
                ? `No results for "${searchQuery}". Try a different search.`
                : 'No businesses in this category yet.'}
            </p>
            {(searchQuery || activeCategory !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  handleCategoryChange('all');
                }}
                className="mt-4 text-sm text-violet-600 font-medium hover:text-violet-700 transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Business Cards */}
        {!loading && (businesses.length > 0 || publicOnlyProfiles.length > 0) && (
          <div className="space-y-3">
            {publicOnlyProfiles.map((shop) => (
              <Link
                key={shop.key}
                href={shop.href}
                className="flex gap-4 p-4 rounded-2xl bg-white border border-[#e5e2e1] shadow-sm hover:shadow-md hover:border-[#7cd3ea] transition-all"
              >
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#ebfaff] to-[#acecff] flex items-center justify-center shrink-0">
                  {CATEGORY_ICONS[shop.category] || CATEGORY_ICONS.other}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 truncate">{shop.name}</h3>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#006273]">
                      <Search size={10} /> Featured
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <MapPin size={12} className="shrink-0" /> <span className="truncate">{shop.location}</span>
                  </p>
                  <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-medium rounded-full bg-[#f4d9ff] text-[#580087] capitalize">
                    {shop.category.replace('_', ' ')}
                  </span>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{shop.description}</p>
                </div>
              </Link>
            ))}
            {businesses.map((biz) => (
              <Link
                key={biz.id}
                href={`/${biz.slug}`}
                className="flex gap-4 p-4 rounded-2xl bg-white border border-[#e5e2e1] shadow-sm hover:shadow-md hover:border-[#7cd3ea] transition-all"
              >
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#ebfaff] to-[#acecff] flex items-center justify-center shrink-0">
                  {CATEGORY_ICONS[biz.category] || CATEGORY_ICONS.other}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 truncate">{biz.name}</h3>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#006273]">
                      <Scissors size={10} /> Pro
                    </span>
                  </div>
                  {biz.location && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin size={12} className="shrink-0" /> <span className="truncate">{biz.location}</span>
                    </p>
                  )}
                  <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-medium rounded-full bg-[#f4d9ff] text-[#580087] capitalize">
                    {biz.category.replace('_', ' ')}
                  </span>
                  {biz.description && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{biz.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
