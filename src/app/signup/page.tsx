'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signUp, signInWithGoogle } from '@/lib/api';
import { getPublicSiteUrl } from '@/lib/env';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authUser, loading: authLoading } = useAuth();

  const preselectedRole = searchParams.get('role');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'customer' | 'merchant'>(
    preselectedRole === 'merchant' ? 'merchant' : 'customer'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && authUser) {
      router.replace('/');
    }
  }, [authUser, authLoading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, name, role);
      router.replace(role === 'merchant' ? '/dashboard/onboarding' : '/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create account';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError('');
    try {
      const afterAuth = role === 'merchant' ? '/dashboard/onboarding' : '/';
      const site = getPublicSiteUrl() || window.location.origin;
      await signInWithGoogle(
        `${site}/auth/callback?redirect=${encodeURIComponent(afterAuth)}`,
        { role }
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to sign in with Google';
      setError(message);
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-8 w-8 border-4 border-violet-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        {/* Branding */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-violet-700 tracking-tight">
              Book<span className="text-gray-900">Our</span>Spot
            </h1>
          </Link>
          <p className="mt-2 text-gray-500 text-sm">Create your account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg shadow-violet-100/50 border border-gray-100 p-6 sm:p-8 transition-all duration-300">
          {/* Error */}
          {error && (
            <div className="mb-5 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700 transition-all duration-200">
              {error}
            </div>
          )}

          {/* Google OAuth */}
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full mb-6"
            onClick={handleGoogle}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-gray-400 uppercase tracking-wider">or</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={6}
            />

            {/* Role toggle */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">I want to</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('customer')}
                  className={`px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all duration-200 ${
                    role === 'customer'
                      ? 'border-violet-600 bg-violet-50 text-violet-700 shadow-sm'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <span className="block text-lg mb-0.5">🔍</span>
                  Book services
                </button>
                <button
                  type="button"
                  onClick={() => setRole('merchant')}
                  className={`px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all duration-200 ${
                    role === 'merchant'
                      ? 'border-violet-600 bg-violet-50 text-violet-700 shadow-sm'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <span className="block text-lg mb-0.5">🏪</span>
                  List my business
                </button>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full mt-2" loading={loading}>
              Create Account
            </Button>
          </form>
        </div>

        {/* Footer link */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-semibold text-violet-600 hover:text-violet-700 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin h-8 w-8 border-4 border-violet-600 border-t-transparent rounded-full" />
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
