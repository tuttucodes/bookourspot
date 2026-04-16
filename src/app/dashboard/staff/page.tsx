'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Star, CalendarDays, X, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createStaffMember, deleteStaffMember, getBusinessStaff, getMyBusiness, updateStaffMember } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Business, StaffMember, StaffStatus } from '@/lib/types';

const STATUS_STYLES: Record<StaffStatus, string> = {
  available: 'bg-green-50 text-green-600',
  busy: 'bg-amber-50 text-amber-600',
  off_duty: 'bg-gray-100 text-gray-500',
};

type StaffForm = {
  name: string;
  role: string;
  avatar_url: string;
  status: StaffStatus;
  rating: string;
  monthly_bookings: string;
};

const EMPTY_FORM: StaffForm = {
  name: '',
  role: '',
  avatar_url: '',
  status: 'available',
  rating: '5.0',
  monthly_bookings: '0',
};

export default function MerchantStaffPage() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<StaffForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
        setBusiness(biz);
        const staffRows = await getBusinessStaff(biz.id);
        setStaff(staffRows);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [authLoading, profile, router]);

  const filteredStaff = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return staff;
    return staff.filter((member) =>
      `${member.name} ${member.role}`.toLowerCase().includes(q)
    );
  }, [staff, query]);

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(member: StaffMember) {
    setEditingId(member.id);
    setForm({
      name: member.name,
      role: member.role,
      avatar_url: member.avatar_url || '',
      status: member.status,
      rating: String(member.rating),
      monthly_bookings: String(member.monthly_bookings),
    });
    setShowForm(true);
  }

  function closeForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(false);
  }

  async function handleSubmit() {
    if (!business || !form.name.trim() || !form.role.trim()) return;
    setSubmitting(true);
    try {
      if (editingId) {
        const updated = await updateStaffMember(editingId, {
          name: form.name.trim(),
          role: form.role.trim(),
          avatar_url: form.avatar_url.trim() || null,
          status: form.status,
          rating: Number(form.rating),
          monthly_bookings: Number(form.monthly_bookings),
        });
        setStaff((prev) => prev.map((item) => (item.id === editingId ? updated : item)));
      } else {
        const created = await createStaffMember({
          business_id: business.id,
          name: form.name.trim(),
          role: form.role.trim(),
          avatar_url: form.avatar_url.trim() || null,
          status: form.status,
          rating: Number(form.rating),
          monthly_bookings: Number(form.monthly_bookings),
          is_active: true,
        });
        setStaff((prev) => [created, ...prev]);
      }
      closeForm();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm('Delete this staff member?');
    if (!confirmed) return;
    setDeletingId(id);
    try {
      await deleteStaffMember(id);
      setStaff((prev) => prev.filter((item) => item.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#fcf9f8]">
        <Header title="Staff" showBack />
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
      <Header title="Staff" showBack />

      <main className="app-content pb-24 pt-6">
        <section className="mt-2 space-y-4">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search staff members..."
              className="w-full rounded-2xl bg-[#f0eded] py-3 pl-11 pr-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#107c91]/20"
            />
          </div>
          <button
            onClick={openAdd}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#006273] to-[#107c91] py-4 font-semibold text-white shadow-sm transition-transform active:scale-95"
          >
            <Plus size={18} />
            Add New Staff
          </button>
        </section>

        {showForm && (
          <section className="mt-6 rounded-3xl border border-[#acecff] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{editingId ? 'Edit Staff' : 'Add Staff'}</h3>
              <button onClick={closeForm} className="rounded-lg p-2 hover:bg-gray-100">
                <X size={18} className="text-gray-400" />
              </button>
            </div>
            <div className="space-y-3">
              <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
              <Input label="Avatar URL" value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} />
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as StaffStatus })}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="available">Available</option>
                    <option value="busy">Busy</option>
                    <option value="off_duty">Off-duty</option>
                  </select>
                </div>
                <Input label="Rating" type="number" step="0.1" min="0" max="5" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} />
                <Input label="Monthly Bookings" type="number" min="0" value={form.monthly_bookings} onChange={(e) => setForm({ ...form, monthly_bookings: e.target.value })} />
              </div>
              <Button
                onClick={handleSubmit}
                loading={submitting}
                className="w-full bg-gradient-to-r from-[#006273] to-[#107c91] hover:opacity-95"
              >
                {editingId ? 'Save Staff Member' : 'Create Staff Member'}
              </Button>
            </div>
          </section>
        )}

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          {filteredStaff.map((member) => (
            <div key={member.id} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex gap-4">
                <div className="relative">
                  {member.avatar_url ? (
                    <Image
                      src={member.avatar_url}
                      alt={member.name}
                      width={80}
                      height={80}
                      className="h-20 w-20 rounded-2xl object-cover bg-[#f0eded]"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#f0eded] text-lg font-bold text-[#006273]">
                      {member.name.slice(0, 1)}
                    </div>
                  )}
                  <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${
                    member.status === 'available' ? 'bg-green-500' : member.status === 'busy' ? 'bg-amber-500' : 'bg-gray-400'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{member.name}</h3>
                      <p className="text-sm text-gray-500">{member.role}</p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${STATUS_STYLES[member.status]}`}>
                      {member.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Star size={14} className="fill-[#006273] text-[#006273]" />
                      <span className="text-sm font-semibold">{member.rating.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CalendarDays size={14} className="text-gray-400" />
                      <span className="text-sm font-semibold">
                        {member.monthly_bookings}{' '}
                        <span className="text-xs font-normal text-gray-500">this month</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => openEdit(member)}
                  className="flex-1 rounded-full bg-[#e5e2e1] py-2.5 text-sm font-semibold text-[#006273] transition-colors hover:bg-[#dcd9d9]"
                >
                  <span className="inline-flex items-center gap-1">
                    <Pencil size={14} />
                    Edit Staff
                  </span>
                </button>
                <button
                  onClick={() => handleDelete(member.id)}
                  disabled={deletingId === member.id}
                  className="flex-1 rounded-full bg-[#e5e2e1] py-2.5 text-sm font-semibold text-[#006273] transition-colors hover:bg-[#dcd9d9] disabled:opacity-50"
                >
                  <span className="inline-flex items-center gap-1">
                    <Trash2 size={14} />
                    Archive
                  </span>
                </button>
              </div>
            </div>
          ))}

          {!filteredStaff.length && (
            <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
              <p className="font-medium text-gray-500">No staff members yet.</p>
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
