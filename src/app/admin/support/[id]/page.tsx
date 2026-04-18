import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SupportThread } from './_thread';

export const dynamic = 'force-dynamic';

export default async function SupportQueryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const [{ data: query }, { data: messages }] = await Promise.all([
    supabase
      .from('support_queries')
      .select('*, submitter:users(name, email, role)')
      .eq('id', id)
      .maybeSingle(),
    supabase
      .from('support_query_messages')
      .select('*, author:users(name, email, role)')
      .eq('query_id', id)
      .order('created_at', { ascending: true }),
  ]);

  if (!query) notFound();

  const who =
    (query.submitter as { name?: string } | null)?.name ??
    (query.submitter as { email?: string } | null)?.email ??
    query.guest_name ??
    query.guest_email ??
    'Guest';

  return (
    <div className="space-y-5 max-w-3xl">
      <Link
        href="/admin/support"
        className="inline-flex items-center gap-1 text-sm text-violet-700 hover:text-violet-800"
      >
        <ArrowLeft size={14} /> Back to inbox
      </Link>

      <header>
        <h1 className="text-2xl font-bold text-gray-900">{query.subject}</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {who} · {query.submitter_role ?? 'guest'} · category: {query.category} · status:{' '}
          <span className="font-medium">{String(query.status).replace('_', ' ')}</span>
        </p>
      </header>

      <section className="bg-white border border-gray-100 rounded-2xl p-5">
        <p className="text-xs text-gray-400 mb-2">
          Opened {new Date(query.created_at).toLocaleString('en-MY')}
        </p>
        <p className="text-sm text-gray-900 whitespace-pre-wrap">{query.message}</p>
      </section>

      <SupportThread id={id} initialMessages={messages ?? []} initialStatus={query.status} />
    </div>
  );
}
