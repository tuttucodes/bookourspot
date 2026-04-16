'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Search, MapPin, Scissors, Car, Sparkles, X, SlidersHorizontal, Star, ArrowRight, Map } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { getBusinesses } from '@/lib/api';
import type { Business, BusinessCategory } from '@/lib/types';
import { SK_BARBERSHOP_IMAGES } from '@/lib/sk-barbershop';

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
  const initialSearch = searchParams.get('search') || '';

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
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
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    router.replace(`/explore${params.toString() ? `?${params}` : ''}`);
  };

  const handleSearchSubmit = (value: string) => {
    const next = value.trim();
    const params = new URLSearchParams();
    if (activeCategory !== 'all') params.set('category', activeCategory);
    if (next) params.set('search', next);
    router.replace(`/explore${params.toString() ? `?${params}` : ''}`);
  };

  const totalResults = businesses.length + publicOnlyProfiles.length;

  return (
    <div className="min-h-screen bg-[#fcf9f8] pb-24">
      <Header title="Discover" />

      <div className="app-content pt-4">
        <div className="mb-5">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Discover</h2>
          <p className="mt-1 text-sm text-gray-500">
            {loading ? 'Finding the best spots...' : `${totalResults} premium spots found in Kuala Lumpur`}
          </p>
        </div>

        <div className="relative rounded-[1.75rem] bg-white p-2 shadow-sm">
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearchSubmit(searchQuery);
            }}
            placeholder="Treatments or locations in Malaysia..."
            className="w-full rounded-2xl bg-transparent py-3 pl-10 pr-24 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                handleSearchSubmit('');
              }}
              className="absolute right-16 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={16} className="text-gray-400" />
            </button>
          )}
          <button
            onClick={() => handleSearchSubmit(searchQuery)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-[#006273] px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] text-white"
          >
            Go
          </button>
        </div>
      </div>

      <div className="app-content mt-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {CATEGORIES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleCategoryChange(key)}
              className={`shrink-0 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-[0.08em] transition-all
                ${activeCategory === key
                  ? 'bg-[#107c91] text-[#ebfaff] shadow-sm'
                  : 'bg-[#eae7e7] text-gray-600 hover:bg-[#e5e2e1]'
                }`}
            >
              {label}
            </button>
          ))}
          <button className="shrink-0 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-[0.08em] bg-[#eae7e7] text-gray-600 inline-flex items-center gap-1">
            <SlidersHorizontal size={12} /> Filters
          </button>
        </div>
      </div>

      <div className="app-content mt-4">
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 rounded-[1.75rem] bg-white border border-[#e5e2e1] shadow-sm animate-pulse">
                <div className="h-44 rounded-2xl bg-gray-200" />
                <div className="flex-1 space-y-2.5 py-1">
                  <div className="mt-4 h-4 bg-gray-200 rounded-lg w-3/4" />
                  <div className="h-3 bg-gray-100 rounded-lg w-1/2" />
                  <div className="h-3 bg-gray-100 rounded-lg w-full" />
                </div>
              </div>
            ))}
          </div>
        )}

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

        {!loading && (businesses.length > 0 || publicOnlyProfiles.length > 0) && (
          <div className="grid gap-4 md:grid-cols-2">
            {publicOnlyProfiles.map((shop) => (
              <Link
                key={shop.key}
                href={shop.href}
                className="block rounded-[1.75rem] bg-white p-4 shadow-sm hover:shadow-md transition-all"
              >
                <div className="rounded-2xl bg-gradient-to-br from-[#ebfaff] to-[#acecff] p-5">
                  <div className="flex items-center justify-between">
                    <div className="relative h-12 w-12 overflow-hidden rounded-2xl bg-white/80">
                      <Image
                        src={SK_BARBERSHOP_IMAGES.card}
                        alt="SK Barbershop storefront"
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#006273]">
                      <Star size={10} className="fill-[#006273] text-[#006273]" /> Featured
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-xl font-bold tracking-tight text-gray-900">{shop.name}</h3>
                      <p className="mt-1 text-sm text-gray-500 flex items-center gap-1">
                        <MapPin size={13} className="shrink-0" /> <span className="truncate">{shop.location}</span>
                      </p>
                    </div>
                    <ArrowRight size={18} className="text-gray-400 shrink-0" />
                  </div>
                  <p className="mt-3 text-sm text-gray-500">{shop.description}</p>
                </div>
              </Link>
            ))}
            {businesses.map((biz) => (
              <Link
                key={biz.id}
                href={`/${biz.slug}`}
                className="block rounded-[1.75rem] bg-white p-4 shadow-sm hover:shadow-md transition-all"
              >
                <div className="rounded-2xl bg-[#f6f3f2] p-5">
                  <div className="flex items-center justify-between">
                    <div className="relative h-12 w-12 overflow-hidden rounded-2xl bg-white">
                      {biz.slug === 'skbarbershop' ? (
                        <Image
                          src={SK_BARBERSHOP_IMAGES.card}
                          alt="SK Barbershop storefront"
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          {CATEGORY_ICONS[biz.category] || CATEGORY_ICONS.other}
                        </div>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#006273]">
                      <Scissors size={10} /> Pro
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-xl font-bold tracking-tight text-gray-900">{biz.name}</h3>
                      {biz.location && (
                        <p className="mt-1 text-sm text-gray-500 flex items-center gap-1">
                          <MapPin size={13} className="shrink-0" /> <span className="truncate">{biz.location}</span>
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-gray-400">Starting from</p>
                      <p className="text-lg font-extrabold text-[#006273]">RM 35+</p>
                    </div>
                  </div>
                  {biz.description && (
                    <p className="mt-3 text-sm text-gray-500 line-clamp-2">{biz.description}</p>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <div className="inline-flex items-center gap-1 text-sm font-semibold text-gray-700">
                      <Star size={14} className="fill-amber-400 text-amber-400" />
                      4.8
                    </div>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#006273]">
                      View spot <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {!loading && totalResults > 0 && (
        <div className="fixed bottom-28 left-1/2 z-40 -translate-x-1/2 md:left-auto md:right-8 md:translate-x-0">
          <button className="inline-flex items-center gap-2 rounded-full bg-[#006273] px-6 py-3.5 text-sm font-bold uppercase tracking-[0.08em] text-white shadow-lg shadow-[#006273]/20">
            <Map size={16} />
            Show Map
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
