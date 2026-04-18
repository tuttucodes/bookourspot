'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type MyQuery = {
  id: string;
  subject: string;
  status: string;
  category: string;
  created_at: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  booking: 'Booking',
  payment: 'Payment',
  account: 'Account',
  merchant_onboarding: 'Merchant onboarding',
  bug: 'Bug report',
  other: 'Other',
};

export default function SupportPage() {
  const { authUser, profile, loading: authLoading } = useAuth();

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('general');

  // Guest fields
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  const [myQueries, setMyQueries] = useState<MyQuery[]>([]);

  useEffect(() => {
    if (!authUser) return;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('support_queries')
        .select('id, subject, status, category, created_at')
        .eq('submitter_id', authUser.id)
        .order('created_at', { ascending: false })
        .limit(20);
      setMyQueries((data ?? []) as MyQuery[]);
    })();
  }, [authUser, successId]);

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/support/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          message,
          category,
          ...(authUser
            ? {}
            : { guest_name: guestName, guest_email: guestEmail, guest_phone: guestPhone }),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not submit');
      setSuccessId(data.data?.id ?? 'ok');
      setSubject('');
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto space-y-5">
        <header>
          <p className="text-xs font-bold uppercase tracking-wide text-violet-700">
            Support
          </p>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">How can we help?</h1>
          <p className="text-sm text-gray-500 mt-1">
            {authUser
              ? 'Tell us what is going on — we usually reply within a few hours during business hours.'
              : 'Not signed in? No problem — leave your email or phone and our team will reach back.'}
          </p>
        </header>

        {successId ? (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800">
            Thanks — your query was received. Reference:{' '}
            <span className="font-mono">{successId.slice(0, 8)}</span>. We will reach back soon.
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
          <label className="text-sm">
            <span className="block mb-1.5 font-medium text-gray-700">Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2"
            >
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <Input
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Cannot complete checkout"
            required
          />
          <label className="text-sm">
            <span className="block mb-1.5 font-medium text-gray-700">Message</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 4000))}
              className="w-full min-h-[120px] rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="Details, screenshots (paste URL), steps to reproduce…"
              required
            />
          </label>

          {!authLoading && !authUser ? (
            <div className="pt-3 border-t border-gray-100 space-y-3">
              <p className="text-xs text-gray-500">
                Provide at least one way to reach you back.
              </p>
              <Input
                label="Name (optional)"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Email"
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                />
                <Input
                  label="Phone"
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                />
              </div>
            </div>
          ) : null}

          <Button
            onClick={submit}
            loading={loading}
            disabled={subject.trim().length < 3 || message.trim().length < 10}
            className="w-full mt-2"
          >
            Send
          </Button>

          {!authUser ? (
            <p className="text-xs text-gray-500 text-center">
              Have an account?{' '}
              <Link href="/login?redirect=/support" className="text-violet-700 hover:text-violet-800">
                Sign in
              </Link>{' '}
              to track replies in one place.
            </p>
          ) : null}
        </div>

        {authUser && myQueries.length > 0 ? (
          <section>
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Your recent queries</h2>
            <ul className="bg-white border border-gray-100 rounded-2xl divide-y divide-gray-100">
              {myQueries.map((q) => (
                <li key={q.id} className="p-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{q.subject}</p>
                    <p className="text-xs text-gray-500">
                      {CATEGORY_LABELS[q.category] ?? q.category} ·{' '}
                      {new Date(q.created_at).toLocaleDateString('en-MY', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </p>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 shrink-0">
                    {q.status.replace('_', ' ')}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {profile?.role === 'merchant' || profile?.role === 'pending_merchant' ? (
          <p className="text-xs text-gray-500 text-center">
            Merchant question?{' '}
            <Link href="/dashboard" className="text-violet-700 hover:text-violet-800">
              Go to dashboard
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  );
}
