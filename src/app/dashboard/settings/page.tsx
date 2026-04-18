'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Clock, Settings2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getMyBusiness, updateBusiness } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Business, BusinessCategory, WorkingHours } from '@/lib/types';
import { goToCustomerHome } from '@/lib/navigation';

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

type FormState = {
  name: string;
  description: string;
  category: BusinessCategory;
  location: string;
  address: string;
  phone: string;
  owner_whatsapp: string;
};

export default function MerchantSettingsPage() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState<FormState>({
    name: '',
    description: '',
    category: 'salon',
    location: '',
    address: '',
    phone: '',
    owner_whatsapp: '',
  });

  useEffect(() => {
    if (authLoading) return;
    if (!profile || profile.role !== 'merchant') {
      goToCustomerHome();
      return;
    }

    const load = async () => {
      try {
        const biz = await getMyBusiness();
        if (!biz) {
          router.push('/dashboard/onboarding');
          return;
        }
        setBusiness(biz);
        setForm({
          name: biz.name,
          description: biz.description || '',
          category: biz.category,
          location: biz.location || '',
          address: biz.address || '',
          phone: biz.phone || '',
          owner_whatsapp: biz.owner_whatsapp || '',
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [authLoading, profile, router]);

  const workingHours = useMemo<WorkingHours>(() => business?.working_hours || {}, [business]);

  async function handleSave() {
    if (!business) return;
    setSaving(true);
    setMessage('');
    try {
      const updated = await updateBusiness(business.id, {
        name: form.name,
        description: form.description || null,
        category: form.category,
        location: form.location || null,
        address: form.address || null,
        phone: form.phone || null,
        owner_whatsapp: form.owner_whatsapp || null,
      });
      setBusiness(updated);
      setMessage('Settings saved.');
    } catch {
      setMessage('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#fcf9f8]">
        <Header title="Business Settings" showBack />
        <main className="app-content-compact pb-24 pt-6">
          <div className="space-y-4 animate-pulse">
            <div className="h-40 rounded-3xl bg-white" />
            <div className="h-56 rounded-3xl bg-white" />
            <div className="h-56 rounded-3xl bg-white" />
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcf9f8]">
      <Header title="Business Settings" showBack />

      <main className="app-content pb-24 pt-6">
        <section className="mb-6 grid grid-cols-1 gap-4 rounded-3xl bg-white p-5 shadow-sm md:grid-cols-[140px_1fr]">
          <div className="h-36 rounded-2xl bg-[#f0eded]" />
          <div className="flex flex-col justify-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#006273]">Establishment</p>
            <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-gray-900">{form.name || 'Business'}</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              {form.description || 'Update your public profile, location, and business details.'}
            </p>
            <div className="mt-4 flex gap-2">
              <span className="rounded-full bg-[#f4d9ff] px-3 py-1 text-xs font-semibold capitalize text-[#580087]">
                {form.category.replace('_', ' ')}
              </span>
              {business?.slug && (
                <Link
                  href={`/${business.slug}`}
                  className="rounded-full bg-[#ebfaff] px-3 py-1 text-xs font-semibold text-[#006273]"
                >
                  View Public Page
                </Link>
              )}
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-3xl bg-[#f6f3f2] p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Location & Contact</h3>
            <MapPin size={16} className="text-[#006273]" />
          </div>
          <div className="space-y-3">
            <Input label="Business Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as BusinessCategory })}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="salon">Salon</option>
                <option value="barbershop">Barbershop</option>
                <option value="spa">Spa</option>
                <option value="car_wash">Car Wash</option>
                <option value="other">Other</option>
              </select>
            </div>
            <Input label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input label="WhatsApp" value={form.owner_whatsapp} onChange={(e) => setForm({ ...form, owner_whatsapp: e.target.value })} />
          </div>
        </section>

        <section className="mb-6 rounded-3xl bg-[#f6f3f2] p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Operating Hours</h3>
            <Clock size={16} className="text-[#006273]" />
          </div>
          <div className="space-y-3">
            {DAY_ORDER.map((day) => {
              const entry = workingHours[day];
              return (
                <div key={day} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
                  <span className="text-sm font-medium capitalize text-gray-700">{day}</span>
                  {entry?.closed ? (
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-red-600">
                      Closed
                    </span>
                  ) : entry ? (
                    <span className="rounded-full bg-[#ebfaff] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#006273]">
                      {entry.open} - {entry.close}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">Not set</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="mb-6 rounded-3xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Payments</h3>
            <Settings2 size={16} className="text-[#006273]" />
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-[#f6f3f2] p-4">
              <p className="font-semibold text-gray-900">Cash</p>
              <p className="mt-1 text-xs text-gray-500">Accepted in person</p>
            </div>
            <div className="rounded-2xl bg-[#f6f3f2] p-4">
              <p className="font-semibold text-gray-900">Card</p>
              <p className="mt-1 text-xs text-gray-500">Accepted in person</p>
            </div>
          </div>
        </section>

        <div className="flex items-center justify-between gap-3 py-2">
          <p className="text-sm text-gray-500">{message}</p>
          <Button
            onClick={handleSave}
            loading={saving}
            className="bg-gradient-to-r from-[#006273] to-[#107c91] hover:opacity-95"
          >
            Save Settings
          </Button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
