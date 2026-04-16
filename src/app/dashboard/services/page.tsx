'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Clock, DollarSign, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  getMyBusiness,
  getServices,
  createService,
  updateService,
  deleteService,
} from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import type { Business, Service } from '@/lib/types';

interface ServiceForm {
  name: string;
  description: string;
  price: string;
  duration_minutes: string;
}

const emptyForm: ServiceForm = {
  name: '',
  description: '',
  price: '',
  duration_minutes: '30',
};

export default function MerchantServicesPage() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServicesState] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!profile || profile.role !== 'merchant') {
      router.push('/');
      return;
    }

    const fetchData = async () => {
      try {
        const biz = await getMyBusiness();
        if (!biz) {
          router.push('/dashboard/onboarding');
          return;
        }
        setBusiness(biz);
        const svcs = await getServices(biz.id);
        setServicesState(svcs);
      } catch (err) {
        console.error('Failed to load services:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile, authLoading, router]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const handleOpenEdit = (service: Service) => {
    setEditingId(service.id);
    setForm({
      name: service.name,
      description: service.description || '',
      price: service.price.toString(),
      duration_minutes: service.duration_minutes.toString(),
    });
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async () => {
    if (!business || !form.name || !form.price || !form.duration_minutes) return;

    setSubmitting(true);
    try {
      if (editingId) {
        const updated = await updateService(editingId, {
          name: form.name,
          description: form.description || null,
          price: parseFloat(form.price),
          duration_minutes: parseInt(form.duration_minutes),
        });
        setServicesState((prev) =>
          prev.map((s) => (s.id === editingId ? updated : s))
        );
      } else {
        const created = await createService({
          business_id: business.id,
          name: form.name,
          description: form.description || null,
          price: parseFloat(form.price),
          duration_minutes: parseInt(form.duration_minutes),
        });
        setServicesState((prev) => [...prev, created]);
      }
      handleCloseForm();
    } catch (err) {
      console.error('Failed to save service:', err);
      alert('Failed to save service. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this service?');
    if (!confirmed) return;

    setDeletingId(id);
    try {
      await deleteService(id);
      setServicesState((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error('Failed to delete service:', err);
      alert('Failed to delete service. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Services" showBack />
        <main className="app-content-compact pt-6 pb-24">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 mb-3 shadow-sm border border-gray-100 animate-pulse">
              <div className="h-5 w-40 bg-gray-200 rounded mb-3" />
              <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-32 bg-gray-200 rounded" />
            </div>
          ))}
        </main>
        <BottomNav />
      </div>
    );
  }

  const featuredService = services[0];

  return (
    <div className="min-h-screen bg-[#fcf9f8]">
      <Header
        title="Services"
        showBack
        rightAction={
          <Button variant="ghost" size="sm" className="text-[#006273]" onClick={handleOpenAdd}>
            <Plus size={18} className="mr-1" />
            Add
          </Button>
        }
      />

      <main className="app-content pb-24 pt-6">
        <div className="mb-6">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Service Menu</h2>
          <p className="mt-1 text-sm text-gray-500">Refine your salon offerings and pricing structures.</p>
        </div>

        {/* Inline Form */}
        {showForm && (
          <div className="bg-white rounded-2xl p-5 mb-5 shadow-sm border border-[#acecff]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">
                {editingId ? 'Edit Service' : 'Add New Service'}
              </h3>
              <button
                onClick={handleCloseForm}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            <div className="space-y-3">
              <Input
                label="Service Name"
                placeholder="e.g. Haircut, Car Wash"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <Input
                label="Description (optional)"
                placeholder="Brief description of the service"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Price (RM)"
                  type="number"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
                <Input
                  label="Duration (min)"
                  type="number"
                  placeholder="30"
                  min="5"
                  step="5"
                  value={form.duration_minutes}
                  onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
                />
              </div>
              <Button
                variant="primary"
                size="md"
                className="w-full bg-gradient-to-r from-[#006273] to-[#107c91] hover:opacity-95"
                loading={submitting}
                disabled={!form.name || !form.price || !form.duration_minutes}
                onClick={handleSubmit}
              >
                {editingId ? 'Save Changes' : 'Add Service'}
              </Button>
            </div>
          </div>
        )}

        {!showForm && (
          <div className="mb-5 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <span className="rounded-full bg-[#006273] px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] text-white">
              All
            </span>
            <span className="rounded-full bg-[#f0eded] px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] text-gray-500">
              Active
            </span>
            <span className="rounded-full bg-[#f0eded] px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] text-gray-500">
              Featured
            </span>
          </div>
        )}

        {/* Services List */}
        {services.length === 0 && !showForm ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center mb-4">
              <DollarSign size={28} className="text-violet-500" />
            </div>
            <p className="text-gray-500 font-medium">No services yet</p>
            <p className="text-gray-400 text-sm mt-1">Add your first service to start receiving bookings.</p>
            <Button variant="primary" size="sm" className="mt-4" onClick={handleOpenAdd}>
              <Plus size={16} className="mr-1.5" />
              Add Service
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {!showForm && featuredService && (
              <div className="overflow-hidden rounded-3xl bg-[#eae7e7] shadow-sm">
                <div className="p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#006273]">Featured Service</p>
                  <div className="mt-2 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{featuredService.name}</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {featuredService.description || 'Your most visible service card for quick editing.'}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-[#006273]">
                      RM {featuredService.price.toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-3 text-xs text-gray-500">
                    <span className="rounded-full bg-white px-3 py-1 font-bold uppercase tracking-[0.08em]">
                      {featuredService.duration_minutes} mins
                    </span>
                    <button
                      onClick={() => handleOpenEdit(featuredService)}
                      className="font-bold text-[#006273] underline underline-offset-4"
                    >
                      Quick Edit
                    </button>
                  </div>
                </div>
              </div>
            )}

            {services.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{service.name}</h3>
                    {service.description && (
                      <p className="text-sm text-gray-500 mt-0.5">{service.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2.5">
                      <span className="flex items-center gap-1.5 text-sm font-medium text-[#006273]">
                        <DollarSign size={14} />
                        RM {service.price.toFixed(2)}
                      </span>
                      <span className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Clock size={14} />
                        {service.duration_minutes} min
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 ml-3">
                    <button
                      onClick={() => handleOpenEdit(service)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Pencil size={16} className="text-[#006273]" />
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      disabled={deletingId === service.id}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2
                        size={16}
                        className={deletingId === service.id ? 'text-gray-300' : 'text-red-500'}
                      />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
