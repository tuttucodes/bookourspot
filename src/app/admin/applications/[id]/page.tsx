import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ApplicationDecision } from './_decision';

export const dynamic = 'force-dynamic';

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: app } = await supabase
    .from('merchant_applications')
    .select('*, submitter:users!merchant_applications_user_id_fkey(email, name, created_at)')
    .eq('id', id)
    .maybeSingle();

  if (!app) notFound();

  const submitter = app.submitter as { email: string | null; name: string | null; created_at: string } | null;

  return (
    <div className="space-y-5 max-w-3xl">
      <Link
        href="/admin/applications"
        className="inline-flex items-center gap-1 text-sm text-violet-700 hover:text-violet-800"
      >
        <ArrowLeft size={14} /> Back to applications
      </Link>

      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {app.business_trading_name ?? app.business_legal_name}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {app.category} · {app.country} · submitted{' '}
            {new Date(app.submitted_at).toLocaleString('en-MY')}
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 border border-orange-200 text-orange-700">
          {String(app.status).replace('_', ' ')}
        </span>
      </header>

      <section className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
        <h2 className="font-semibold text-gray-900">Owner</h2>
        <dl className="grid grid-cols-2 gap-y-1.5 text-sm">
          <dt className="text-gray-500">Name</dt>
          <dd className="text-gray-900">{app.owner_name}</dd>
          <dt className="text-gray-500">ID type</dt>
          <dd className="text-gray-900 uppercase">{app.owner_id_type}</dd>
          <dt className="text-gray-500">ID (last 4)</dt>
          <dd className="text-gray-900 font-mono">···· {app.owner_id_last4}</dd>
          <dt className="text-gray-500">Phone</dt>
          <dd className="text-gray-900">{app.owner_phone}</dd>
          <dt className="text-gray-500">Account email</dt>
          <dd className="text-gray-900">{submitter?.email ?? '—'}</dd>
        </dl>
      </section>

      <section className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
        <h2 className="font-semibold text-gray-900">Business</h2>
        <dl className="grid grid-cols-2 gap-y-1.5 text-sm">
          <dt className="text-gray-500">Legal name</dt>
          <dd className="text-gray-900">{app.business_legal_name}</dd>
          <dt className="text-gray-500">Trading name</dt>
          <dd className="text-gray-900">{app.business_trading_name ?? '—'}</dd>
          <dt className="text-gray-500">Type</dt>
          <dd className="text-gray-900 uppercase">{app.business_type}</dd>
          <dt className="text-gray-500">SSM / Reg #</dt>
          <dd className="text-gray-900 font-mono">{app.primary_reg_number}</dd>
          <dt className="text-gray-500">SST #</dt>
          <dd className="text-gray-900 font-mono">{app.sst_number ?? '—'}</dd>
          <dt className="text-gray-500">Council licence</dt>
          <dd className="text-gray-900">
            {app.council_licence_number
              ? `${app.council_licence_authority ?? ''} · ${app.council_licence_number}`
              : '—'}
          </dd>
          <dt className="text-gray-500">Licence expiry</dt>
          <dd className="text-gray-900">{app.council_licence_expiry ?? '—'}</dd>
        </dl>
      </section>

      <section className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
        <h2 className="font-semibold text-gray-900">Location</h2>
        <p className="text-sm text-gray-900">{app.address}</p>
        <p className="text-sm text-gray-500">
          {[app.city, app.state, app.postcode, app.country].filter(Boolean).join(', ')}
        </p>
      </section>

      {app.reviewer_notes || app.rejection_reason ? (
        <section className="bg-white border border-gray-100 rounded-2xl p-5 space-y-2">
          <h2 className="font-semibold text-gray-900">Review notes</h2>
          {app.reviewer_notes ? (
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{app.reviewer_notes}</p>
          ) : null}
          {app.rejection_reason ? (
            <p className="text-sm text-red-700 whitespace-pre-wrap">
              <span className="font-medium">Rejected:</span> {app.rejection_reason}
            </p>
          ) : null}
        </section>
      ) : null}

      {app.status === 'submitted' || app.status === 'under_review' ? (
        <ApplicationDecision id={app.id} />
      ) : (
        <section className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm text-gray-600">
          Status: <strong>{app.status}</strong>. No further action available.
          {app.approved_business_id ? (
            <>
              {' '}
              Business id:{' '}
              <span className="font-mono text-xs">{app.approved_business_id}</span>.
            </>
          ) : null}
        </section>
      )}
    </div>
  );
}
