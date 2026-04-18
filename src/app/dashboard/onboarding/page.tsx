'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronRight, ChevronLeft, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createBusiness, createService } from '@/lib/api';
import { DEFAULT_WORKING_HOURS, BUSINESS_CATEGORIES, DAYS_OF_WEEK } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { WorkingHours, BusinessCategory } from '@/lib/types';
import { goToCustomerHome } from '@/lib/navigation';

interface ServiceEntry {
  name: string;
  price: string;
  duration_minutes: string;
}

const STEPS = ['Business Info', 'Working Hours', 'Add Services'];

export default function OnboardingPage() {
  const router = useRouter();
  const { profile, authUser, loading: authLoading } = useAuth();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Business Info
  const [bizName, setBizName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<BusinessCategory>('salon');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  // Step 2: Working Hours
  const [workingHours, setWorkingHours] = useState<WorkingHours>(
    JSON.parse(JSON.stringify(DEFAULT_WORKING_HOURS))
  );

  // Step 3: Services
  const [serviceEntries, setServiceEntries] = useState<ServiceEntry[]>([
    { name: '', price: '', duration_minutes: '30' },
  ]);

  useEffect(() => {
    if (authLoading) return;
    if (!profile || profile.role !== 'merchant') {
      goToCustomerHome();
      return;
    }
  }, [profile, authLoading, router]);

  const updateWorkingHour = (day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    setWorkingHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const addServiceEntry = () => {
    setServiceEntries((prev) => [...prev, { name: '', price: '', duration_minutes: '30' }]);
  };

  const removeServiceEntry = (index: number) => {
    if (serviceEntries.length <= 1) return;
    setServiceEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const updateServiceEntry = (index: number, field: keyof ServiceEntry, value: string) => {
    setServiceEntries((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry))
    );
  };

  const canProceed = () => {
    if (step === 0) return bizName.trim() && category && phone.trim();
    if (step === 1) return true;
    if (step === 2) return serviceEntries.some((s) => s.name.trim() && s.price);
    return false;
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    if (!authUser) return;

    setSubmitting(true);
    try {
      // Create business
      const business = await createBusiness({
        owner_id: authUser.id,
        name: bizName.trim(),
        description: description.trim() || null,
        category,
        location: location.trim() || null,
        address: address.trim() || null,
        phone: phone.trim(),
        working_hours: workingHours,
        is_active: true,
      });

      // Create services
      const validServices = serviceEntries.filter((s) => s.name.trim() && s.price);
      await Promise.all(
        validServices.map((s) =>
          createService({
            business_id: business.id,
            name: s.name.trim(),
            price: parseFloat(s.price),
            duration_minutes: parseInt(s.duration_minutes) || 30,
          })
        )
      );

      router.push('/dashboard');
    } catch (err) {
      console.error('Onboarding failed:', err);
      alert('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-violet-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="app-content-compact py-4">
          <h1 className="text-lg font-semibold text-gray-900">Set Up Your Business</h1>
          <p className="text-sm text-gray-500 mt-0.5">Step {step + 1} of {STEPS.length}</p>
        </div>
      </header>

      <main className="app-content-compact pt-6 pb-32">
        {/* Progress Indicator */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1 flex flex-col items-center">
              <div className="flex items-center w-full">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                    ${i < step
                      ? 'bg-violet-600 text-white'
                      : i === step
                        ? 'bg-violet-600 text-white ring-4 ring-violet-100'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                >
                  {i < step ? <Check size={16} /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-1 transition-all ${
                      i < step ? 'bg-violet-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
              <span className={`text-[10px] mt-1.5 font-medium ${
                i <= step ? 'text-violet-600' : 'text-gray-400'
              }`}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Step 1: Business Info */}
        {step === 0 && (
          <div className="space-y-4">
            <Input
              label="Business Name *"
              placeholder="e.g. Ali's Barbershop"
              value={bizName}
              onChange={(e) => setBizName(e.target.value)}
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                placeholder="Tell customers about your business..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-150 resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as BusinessCategory)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              >
                {BUSINESS_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <Input
              label="Location"
              placeholder="e.g. Kuala Lumpur"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <Input
              label="Address"
              placeholder="Full business address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <Input
              label="Phone Number *"
              placeholder="e.g. 012-345-6789"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        )}

        {/* Step 2: Working Hours */}
        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 mb-4">
              Set your operating hours for each day. Toggle off days you are closed.
            </p>
            {DAYS_OF_WEEK.map((day) => {
              const hours = workingHours[day];
              return (
                <div
                  key={day}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 capitalize">{day}</span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-xs text-gray-500">
                        {hours.closed ? 'Closed' : 'Open'}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateWorkingHour(day, 'closed', !hours.closed)}
                        className={`relative w-10 h-5.5 rounded-full transition-colors ${
                          hours.closed ? 'bg-gray-300' : 'bg-violet-600'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${
                            hours.closed ? 'left-0.5' : 'left-5'
                          }`}
                          style={{ width: '18px', height: '18px' }}
                        />
                      </button>
                    </label>
                  </div>

                  {!hours.closed && (
                    <div className="flex items-center gap-3">
                      <input
                        type="time"
                        value={hours.open}
                        onChange={(e) => updateWorkingHour(day, 'open', e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                      <span className="text-gray-400 text-sm">to</span>
                      <input
                        type="time"
                        value={hours.close}
                        onChange={(e) => updateWorkingHour(day, 'close', e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Step 3: Add Services */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 mb-2">
              Add at least one service that customers can book.
            </p>

            {serviceEntries.map((entry, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Service {index + 1}</span>
                  {serviceEntries.length > 1 && (
                    <button
                      onClick={() => removeServiceEntry(index)}
                      className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  <Input
                    label="Service Name *"
                    placeholder="e.g. Haircut, Full Detail Wash"
                    value={entry.name}
                    onChange={(e) => updateServiceEntry(index, 'name', e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Price (RM) *"
                      type="number"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      value={entry.price}
                      onChange={(e) => updateServiceEntry(index, 'price', e.target.value)}
                    />
                    <Input
                      label="Duration (min)"
                      type="number"
                      placeholder="30"
                      min="5"
                      step="5"
                      value={entry.duration_minutes}
                      onChange={(e) => updateServiceEntry(index, 'duration_minutes', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={addServiceEntry}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-violet-400 hover:text-violet-600 transition-colors"
            >
              <Plus size={18} />
              <span className="text-sm font-medium">Add Another Service</span>
            </button>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 safe-area-bottom">
        <div className="app-content-compact flex items-center gap-3 py-4">
          {step > 0 && (
            <Button variant="outline" size="lg" onClick={handleBack} className="flex-1">
              <ChevronLeft size={18} className="mr-1" />
              Back
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button
              variant="primary"
              size="lg"
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex-1"
            >
              Next
              <ChevronRight size={18} className="ml-1" />
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              onClick={handleComplete}
              loading={submitting}
              disabled={!canProceed()}
              className="flex-1"
            >
              Complete Setup
              <Check size={18} className="ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
