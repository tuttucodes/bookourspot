'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export function ApplicationDecision({ id }: { id: string }) {
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(action: 'approve' | 'reject') {
    if (action === 'reject' && reason.trim().length < 10) {
      setError('Rejection reason must be at least 10 characters.');
      return;
    }
    setLoading(action);
    setError(null);
    try {
      const res = await fetch(`/api/admin/applications/${id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: action === 'reject' ? JSON.stringify({ reason }) : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `${action} failed`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
      <h2 className="font-semibold text-gray-900">Decision</h2>
      {error ? (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">
          {error}
        </p>
      ) : null}
      <label className="block text-sm font-medium text-gray-700">
        Rejection reason (required if rejecting)
      </label>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value.slice(0, 1000))}
        placeholder="e.g. SSM number format invalid, could not verify business address…"
        className="w-full min-h-[80px] rounded-lg border border-gray-200 px-3 py-2 text-sm"
      />
      <div className="flex gap-2">
        <Button
          onClick={() => decide('approve')}
          loading={loading === 'approve'}
          disabled={loading !== null}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          Approve · make live
        </Button>
        <Button
          onClick={() => decide('reject')}
          loading={loading === 'reject'}
          disabled={loading !== null}
          variant="outline"
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          Reject
        </Button>
      </div>
    </section>
  );
}
