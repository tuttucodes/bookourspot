'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkles, Gift, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';

type CompletedStat = {
  count: number;
  lifetimeSpend: number;
  uniqueBusinesses: number;
};

type Tier = {
  name: string;
  minVisits: number;
  perk: string;
  color: string;
};

const TIERS: Tier[] = [
  { name: 'Explorer', minVisits: 0, perk: 'Welcome to BookOurSpot', color: 'bg-[#f0eded] text-[#1c1b1b]' },
  { name: 'Regular', minVisits: 3, perk: 'Early access to new merchants', color: 'bg-[#f4d9ff] text-[#580087]' },
  { name: 'Insider', minVisits: 8, perk: 'Priority booking slots', color: 'bg-[#cc80fd] text-white' },
  { name: 'VIP', minVisits: 15, perk: 'Surprise treatments from partner spots', color: 'bg-brand-gradient text-white' },
];

function computeTier(count: number): { current: Tier; next: Tier | undefined } {
  let current = TIERS[0];
  for (const tier of TIERS) {
    if (count >= tier.minVisits) current = tier;
  }
  const nextIdx = TIERS.indexOf(current) + 1;
  const next = TIERS[nextIdx];
  return { current, next };
}

export default function LoyaltyPage() {
  const router = useRouter();
  const { authUser, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<CompletedStat>({ count: 0, lifetimeSpend: 0, uniqueBusinesses: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      router.replace('/login?redirect=/loyalty');
      return;
    }
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('appointments')
        .select('business_id, service:services(price)')
        .eq('user_id', authUser.id)
        .eq('status', 'completed');
      const rows = (data ?? []) as unknown as Array<{
        business_id: string;
        service: { price: number | null } | { price: number | null }[] | null;
      }>;
      const lifetime = rows.reduce((acc, r) => {
        const svc = Array.isArray(r.service) ? r.service[0] : r.service;
        return acc + Number(svc?.price ?? 0);
      }, 0);
      const unique = new Set(rows.map((r) => r.business_id)).size;
      setStats({ count: rows.length, lifetimeSpend: lifetime, uniqueBusinesses: unique });
      setLoading(false);
    })();
  }, [authUser, authLoading, router]);

  const { current, next } = useMemo(() => computeTier(stats.count), [stats.count]);
  const progressPct = next
    ? Math.min(100, Math.round(((stats.count - current.minVisits) / (next.minVisits - current.minVisits)) * 100))
    : 100;

  if (authLoading || !authUser || loading) {
    return (
      <div className="min-h-screen bg-[#fcf9f8] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-[#006273] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcf9f8] pb-28">
      <Header title="Loyalty" showBack />

      <main className="app-content-compact pt-4 space-y-5">
        <section className="relative overflow-hidden rounded-3xl bg-brand-gradient p-6 text-white shadow-ambient">
          <Sparkles className="absolute -right-4 -top-4 h-24 w-24 text-white/10" strokeWidth={1} />
          <p className="type-label text-white/80">Current tier</p>
          <h1 className="mt-2 type-display">{current.name}</h1>
          <p className="mt-2 text-sm text-white/85">{current.perk}</p>
          {next ? (
            <div className="mt-5">
              <div className="flex items-center justify-between text-[11px] text-white/80 mb-1.5">
                <span>{stats.count} of {next.minVisits} visits</span>
                <span>Next: {next.name}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full rounded-full bg-white transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="mt-5 text-xs text-white/80">You have unlocked the top tier. Enjoy.</p>
          )}
        </section>

        <section className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-white p-4 text-center">
            <TrendingUp className="mx-auto mb-1 text-[#006273]" size={18} />
            <p className="text-2xl font-bold text-[#1c1b1b]">{stats.count}</p>
            <p className="type-label text-[#3e484c]">Visits</p>
          </div>
          <div className="rounded-2xl bg-white p-4 text-center">
            <Gift className="mx-auto mb-1 text-[#006273]" size={18} />
            <p className="text-2xl font-bold text-[#1c1b1b]">{stats.uniqueBusinesses}</p>
            <p className="type-label text-[#3e484c]">Spots</p>
          </div>
          <div className="rounded-2xl bg-white p-4 text-center">
            <Sparkles className="mx-auto mb-1 text-[#006273]" size={18} />
            <p className="text-2xl font-bold text-[#1c1b1b]">RM {stats.lifetimeSpend.toFixed(0)}</p>
            <p className="type-label text-[#3e484c]">Spent</p>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="type-label text-[#3e484c] px-1">Tiers</h2>
          <ul className="space-y-2">
            {TIERS.map((tier) => {
              const unlocked = stats.count >= tier.minVisits;
              return (
                <li
                  key={tier.name}
                  className={`rounded-2xl border p-4 flex items-center justify-between gap-3 ${
                    current.name === tier.name
                      ? 'border-[#006273] bg-white'
                      : unlocked
                        ? 'border-transparent bg-white'
                        : 'border-[#e5e2e1] bg-[#f6f3f2]'
                  }`}
                >
                  <div>
                    <p className={`font-semibold ${unlocked ? 'text-[#1c1b1b]' : 'text-[#6e797c]'}`}>
                      {tier.name}
                    </p>
                    <p className="text-xs text-[#3e484c] mt-0.5">{tier.perk}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${tier.color}`}
                  >
                    {tier.minVisits}+
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-2xl bg-white p-5">
          <h2 className="font-semibold text-[#1c1b1b]">Rebook your favourites</h2>
          <p className="text-sm text-[#3e484c] mt-1">
            Your completed appointments have a rebook shortcut — visit bookings to find them.
          </p>
          <Link
            href="/bookings"
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-gradient px-4 py-2 text-sm font-semibold text-white"
          >
            Open my bookings <ArrowRight size={14} />
          </Link>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
