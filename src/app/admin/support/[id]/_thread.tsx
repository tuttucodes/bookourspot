'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

type Message = {
  id: string;
  body: string;
  author_role: string | null;
  created_at: string;
  author?: { name: string | null; email: string | null; role: string | null } | null;
};

const STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const;
type Status = (typeof STATUSES)[number];

export function SupportThread({
  id,
  initialMessages,
  initialStatus,
}: {
  id: string;
  initialMessages: Message[];
  initialStatus: string;
}) {
  const router = useRouter();
  const [messages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState<Status>(initialStatus as Status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reply() {
    if (draft.trim().length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/support/${id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: draft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reply failed');
      setDraft('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reply failed');
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(newStatus: Status) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/support/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Status update failed');
      setStatus(newStatus);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Status update failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {messages.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-semibold text-gray-900">Thread</h2>
          {messages.map((m) => {
            const isAdmin = m.author_role === 'admin' || m.author_role === 'superadmin';
            return (
              <div
                key={m.id}
                className={`rounded-2xl p-4 text-sm border ${
                  isAdmin
                    ? 'bg-violet-50 border-violet-100 ml-6'
                    : 'bg-white border-gray-100 mr-6'
                }`}
              >
                <p className="text-xs text-gray-500 mb-1">
                  {m.author?.name ?? m.author?.email ?? m.author_role ?? 'System'} ·{' '}
                  {new Date(m.created_at).toLocaleString('en-MY')}
                </p>
                <p className="text-gray-900 whitespace-pre-wrap">{m.body}</p>
              </div>
            );
          })}
        </section>
      )}

      <section className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
        <h2 className="font-semibold text-gray-900">Reply</h2>
        {error ? (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">
            {error}
          </p>
        ) : null}
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, 4000))}
          placeholder="Type your reply to the user…"
          className="w-full min-h-[100px] rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div className="flex gap-1 text-xs">
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => updateStatus(s)}
                disabled={loading}
                className={`px-2.5 py-1 rounded-full border font-medium ${
                  status === s
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
          <Button onClick={reply} loading={loading} disabled={draft.trim().length < 2}>
            Send reply
          </Button>
        </div>
      </section>
    </div>
  );
}
