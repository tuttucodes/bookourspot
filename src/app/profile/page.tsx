'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User as UserIcon,
  Mail,
  Phone,
  Shield,
  LogOut,
  ChevronRight,
  LayoutDashboard,
  Calendar,
  Pencil,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { signOut, updateUserProfile } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';

export default function ProfilePage() {
  const router = useRouter();
  const { profile, loading, refetchProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const startEditing = () => {
    setName(profile?.name || '');
    setPhone(profile?.phone || '');
    setEditing(true);
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      await updateUserProfile(profile.id, { name, phone: phone || null });
      await refetchProfile();
      setEditing(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      router.push('/');
    } catch (err) {
      console.error('Failed to sign out:', err);
      setSigningOut(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Profile" />
        <main className="app-content-compact pt-6 pb-24">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gray-200" />
              <div className="space-y-2">
                <div className="h-5 w-32 bg-gray-200 rounded" />
                <div className="h-4 w-44 bg-gray-200 rounded" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-12 bg-gray-200 rounded-xl" />
              <div className="h-12 bg-gray-200 rounded-xl" />
              <div className="h-12 bg-gray-200 rounded-xl" />
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Profile" />
        <main className="app-content-compact pt-6 pb-24">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center mb-4">
              <UserIcon size={28} className="text-violet-500" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Not logged in
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Sign in to view and manage your profile.
            </p>
            <Button onClick={() => router.push('/login')}>Sign In</Button>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Profile"
        rightAction={
          !editing ? (
            <button
              onClick={startEditing}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-violet-600"
            >
              <Pencil size={18} />
            </button>
          ) : undefined
        }
      />

      <main className="app-content-compact space-y-4 pt-6 pb-24">
        {/* User Info Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          {/* Avatar and name header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-violet-600">
                {profile.name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 truncate">
                {profile.name}
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700 capitalize">
                {profile.role}
              </span>
            </div>
          </div>

          {editing ? (
            /* Edit Mode */
            <div className="space-y-4">
              <Input
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
              <Input
                label="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +60123456789"
                type="tel"
              />
              <div className="flex gap-3 pt-2">
                <Button
                  variant="primary"
                  size="md"
                  loading={saving}
                  onClick={handleSave}
                  className="flex-1"
                >
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setEditing(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            /* View Mode */
            <div className="space-y-0 divide-y divide-gray-100">
              <div className="flex items-center gap-3 py-3">
                <UserIcon size={18} className="text-gray-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">Name</p>
                  <p className="text-sm text-gray-900 truncate">{profile.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 py-3">
                <Mail size={18} className="text-gray-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="text-sm text-gray-900 truncate">{profile.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 py-3">
                <Phone size={18} className="text-gray-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">Phone</p>
                  <p className="text-sm text-gray-900">
                    {profile.phone || 'Not set'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 py-3">
                <Shield size={18} className="text-gray-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">Role</p>
                  <p className="text-sm text-gray-900 capitalize">{profile.role}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mode switcher — user can jump between customer and merchant views */}
        {profile.role === 'merchant' ? (
          <div className="rounded-3xl bg-brand-gradient p-5 text-white shadow-ambient">
            <p className="type-label text-white/80">You are on</p>
            <p className="mt-1 text-lg font-bold">Customer mode</p>
            <p className="mt-1 text-sm text-white/85">
              Switch to your business dashboard to manage bookings, services and POS.
            </p>
            <a
              href="https://merchant.bookourspot.com/dashboard"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#006273]"
            >
              <LayoutDashboard size={14} /> Open merchant mode
              <ChevronRight size={14} />
            </a>
          </div>
        ) : profile.role === 'pending_merchant' ? (
          <div className="rounded-3xl bg-[#fef3c7] p-5 text-[#92400e]">
            <p className="type-label">Application in review</p>
            <p className="mt-1 text-lg font-bold">Merchant mode pending</p>
            <p className="mt-1 text-sm">
              Your merchant application is with our team. You will get an email when it is approved.
            </p>
            <Link
              href="/pending-review"
              className="mt-3 inline-flex items-center gap-1 text-sm font-semibold underline underline-offset-2"
            >
              View application status
              <ChevronRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="rounded-3xl bg-white p-5">
            <p className="type-label text-[#006273]">Own a business?</p>
            <p className="mt-1 text-lg font-bold text-[#1c1b1b]">List your spot</p>
            <p className="mt-1 text-sm text-[#3e484c]">
              Accept online bookings, manage staff, run POS and track revenue.
            </p>
            <a
              href="https://merchant.bookourspot.com/signup?role=merchant"
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-gradient px-4 py-2 text-sm font-semibold text-white"
            >
              Apply to list <ChevronRight size={14} />
            </a>
          </div>
        )}

        {/* Quick links */}
        <div className="bg-white rounded-2xl overflow-hidden divide-y divide-[#f0eded]">
          <Link
            href="/bookings"
            className="flex items-center justify-between px-4 py-3.5 hover:bg-[#f6f3f2] transition-colors"
          >
            <div className="flex items-center gap-3">
              <Calendar size={18} className="text-[#006273]" />
              <span className="text-sm font-medium text-[#1c1b1b]">My bookings</span>
            </div>
            <ChevronRight size={18} className="text-[#6e797c]" />
          </Link>
          <Link
            href="/loyalty"
            className="flex items-center justify-between px-4 py-3.5 hover:bg-[#f6f3f2] transition-colors"
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard size={18} className="text-[#006273]" />
              <span className="text-sm font-medium text-[#1c1b1b]">Loyalty &amp; perks</span>
            </div>
            <ChevronRight size={18} className="text-[#6e797c]" />
          </Link>
          <Link
            href="/support"
            className="flex items-center justify-between px-4 py-3.5 hover:bg-[#f6f3f2] transition-colors"
          >
            <div className="flex items-center gap-3">
              <Calendar size={18} className="text-[#006273]" />
              <span className="text-sm font-medium text-[#1c1b1b]">Support</span>
            </div>
            <ChevronRight size={18} className="text-[#6e797c]" />
          </Link>
        </div>

        {/* Sign Out */}
        <div className="pt-2">
          <Button
            variant="outline"
            size="md"
            className="w-full text-red-600 border-red-200 hover:bg-red-50"
            loading={signingOut}
            onClick={handleSignOut}
          >
            <LogOut size={16} className="mr-2" />
            Sign Out
          </Button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
