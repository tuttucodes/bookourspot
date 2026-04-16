'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Phone, Mail, MessageCircle, UserPlus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getMyBusiness, getBusinessCustomers } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { Button } from '@/components/ui/Button';

type CustomerRow = {
  user: { id: string; name: string; email: string; phone: string | null }[] | null;
  date: string;
  status: string;
  service?: { name?: string; price?: number }[] | null;
};

type ClientCard = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  totalVisits: number;
  lastVisit: string;
  totalSpent: number;
  tier: string;
};

export default function MerchantClientsPage() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!profile || profile.role !== 'merchant') {
      router.push('/');
      return;
    }

    const load = async () => {
      try {
        const biz = await getMyBusiness();
        if (!biz) {
          router.push('/dashboard/onboarding');
          return;
        }
        const customerRows = await getBusinessCustomers(biz.id);
        setRows((customerRows as CustomerRow[]) || []);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [authLoading, profile, router]);

  const clients = useMemo<ClientCard[]>(() => {
    const map = new Map<string, ClientCard>();

    for (const row of rows) {
      const user = row.user?.[0];
      const service = row.service?.[0];
      if (!user?.id) continue;
      const prev = map.get(user.id);
      const spent = Number(service?.price || 0);
      if (!prev) {
        map.set(user.id, {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          totalVisits: 1,
          lastVisit: row.date,
          totalSpent: spent,
          tier: spent >= 2000 ? 'Platinum' : spent >= 1000 ? 'Gold' : spent >= 500 ? 'Silver' : 'New',
        });
      } else {
        const totalSpent = prev.totalSpent + spent;
        const totalVisits = prev.totalVisits + 1;
        map.set(user.id, {
          ...prev,
          totalVisits,
          totalSpent,
          lastVisit: row.date > prev.lastVisit ? row.date : prev.lastVisit,
          tier: totalSpent >= 2000 ? 'Platinum' : totalSpent >= 1000 ? 'Gold' : totalSpent >= 500 ? 'Silver' : 'New',
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [rows]);

  const filteredClients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((client) =>
      `${client.name} ${client.email} ${client.phone || ''}`.toLowerCase().includes(q)
    );
  }, [clients, query]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#fcf9f8]">
        <Header title="Client Database" showBack />
        <main className="app-content-compact pb-24 pt-6">
          <div className="space-y-4 animate-pulse">
            <div className="h-12 rounded-2xl bg-white" />
            <div className="h-40 rounded-3xl bg-white" />
            <div className="h-40 rounded-3xl bg-white" />
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcf9f8]">
      <Header title="Client Database" showBack />

      <main className="app-content pb-24 pt-6">
        <section className="mb-6 flex items-end justify-between gap-3">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-gray-500">Management</p>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Client Database</h2>
          </div>
          <Button className="bg-gradient-to-r from-[#006273] to-[#107c91] hover:opacity-95">
            <UserPlus size={16} className="mr-1.5" />
            Add
          </Button>
        </section>

        <section className="mb-6">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email or phone..."
              className="w-full rounded-2xl border border-transparent bg-[#f0eded] py-3 pl-11 pr-4 text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#107c91]/20"
            />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredClients.map((client) => (
            <div key={client.id} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-gray-900">{client.name}</h3>
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#843ab4]">
                    {client.tier} Tier
                  </span>
                </div>
                <div className="flex gap-2">
                  {client.phone && (
                    <a href={`tel:${client.phone}`} className="rounded-full bg-[#f6f3f2] p-2 text-[#006273]">
                      <Phone size={16} />
                    </a>
                  )}
                  {client.email && (
                    <a href={`mailto:${client.email}`} className="rounded-full bg-[#f6f3f2] p-2 text-[#006273]">
                      <Mail size={16} />
                    </a>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#f6f3f2] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-gray-500">Last Visit</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{client.lastVisit}</p>
                </div>
                <div className="rounded-2xl bg-[#f6f3f2] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-gray-500">Total Spent</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">RM {client.totalSpent.toFixed(2)}</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-gray-500">{client.totalVisits} visits</p>
                {client.phone && (
                  <a href={`https://wa.me/${client.phone.replace(/\D/g, '')}`} className="text-xs font-bold text-[#006273]">
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle size={12} />
                      Message
                    </span>
                  </a>
                )}
              </div>
            </div>
          ))}

          {!filteredClients.length && (
            <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
              <p className="font-medium text-gray-500">No clients found.</p>
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
