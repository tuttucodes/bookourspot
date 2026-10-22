import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { Check, Clock3, LogOut, RefreshCw, ShieldCheck, X } from 'lucide-react';
import AuthModal from './AuthModal';
import { firebaseAuth } from '../utils/firebaseClient';
import { signOutUser } from '../utils/authService';
import AdminEventManager from './AdminEventManager';

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;
const displayDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
};

export default function AdminPaymentsPortal() {
  const [user, setUser] = useState(firebaseAuth?.currentUser || null);
  const [authOpen, setAuthOpen] = useState(!firebaseAuth?.currentUser);
  const [linkOpen, setLinkOpen] = useState(false);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [checkedIds, setCheckedIds] = useState({});
  const [busyId, setBusyId] = useState('');
  const [notes, setNotes] = useState({});
  const [section, setSection] = useState('PAYMENTS');

  useEffect(() => {
    if (!firebaseAuth) return undefined;
    return onAuthStateChanged(firebaseAuth, setUser);
  }, []);

  const loadQueue = async () => {
    const currentUser = firebaseAuth?.currentUser;
    if (!currentUser) { setPayments([]); return; }
    setLoading(true); setError('');
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch('/api/admin/payments', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(response.status === 403
        ? 'This account is not on the BookOutSpot admin allowlist. Sign in with the verified admin Google or email account.'
        : result.error || 'Could not load the payment review queue.');
      setPayments(Array.isArray(result.payments) ? result.payments : []);
    } catch (err) { setError(err.message || 'Could not load payments.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (user) loadQueue(); }, [user?.uid]);

  const review = async (payment, action) => {
    if (!checkedIds[payment.bookingId]) {
      setError('Confirm you matched the amount and UTR in your bank statement first.');
      return;
    }
    setBusyId(payment.bookingId); setError(''); setNotice('');
    try {
      const currentUser = firebaseAuth?.currentUser;
      if (!currentUser) throw new Error('Sign in again to review payments.');
      const token = await currentUser.getIdToken();
      const response = await fetch('/api/admin/payments', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bookingId: payment.bookingId, utr: payment.utr, action, note: notes[payment.bookingId] || '', bankChecked: true })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'The payment review could not be saved.');
      setNotice(action === 'APPROVE' ? 'Payment verified. Passes have been issued.' : 'Payment report rejected. The booking remains unpaid.');
      setCheckedIds((state) => ({ ...state, [payment.bookingId]: false }));
      await loadQueue();
    } catch (err) { setError(err.message || 'Review failed.'); }
    finally { setBusyId(''); }
  };

  const handleSignOut = async () => {
    await signOutUser(); setUser(null); setPayments([]); setAuthOpen(true);
  };

  const signedIn = Boolean(user?.phoneNumber);
  const hasLinkedVerifiedEmail = Boolean(user?.email && user?.emailVerified);

  return (
    <div className="min-h-[100dvh] bg-[#09080d] px-4 pb-12 pt-6 text-[#f6f3ff] sm:px-8 sm:pt-10">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-300 text-2xl font-black italic text-[#21143b]">b</span><div><p className="text-xs font-semibold uppercase tracking-[.22em] text-violet-200">BookOutSpot</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Admin console</h1></div></div>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-400">Review reported UPI transfers, issue passes after bank confirmation, and manage the public event catalogue.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {signedIn && hasLinkedVerifiedEmail && <a href="https://console.firebase.google.com/project/bookourspot-f311e/authentication/users" target="_blank" rel="noreferrer" className="inline-flex h-10 items-center rounded-full border border-white/15 px-4 text-sm text-zinc-200 hover:bg-white/5">View accounts in Firebase</a>}
            {signedIn && <button type="button" onClick={loadQueue} disabled={loading} className="inline-flex h-10 items-center gap-2 rounded-full border border-white/15 px-4 text-sm text-zinc-200 hover:bg-white/5"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh</button>}
            {signedIn && <button type="button" onClick={handleSignOut} className="inline-flex h-10 items-center gap-2 rounded-full border border-white/15 px-4 text-sm text-zinc-300 hover:bg-white/5"><LogOut size={15} /> Sign out</button>}
          </div>
        </header>

        {!user && <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8"><ShieldCheck className="text-violet-200" size={25} /><h2 className="mt-4 text-xl font-semibold">Admin sign in</h2><p className="mt-2 max-w-lg text-sm leading-relaxed text-zinc-400">Use your verified mobile number, then link the Google or email account on the admin allowlist.</p><button type="button" onClick={() => setAuthOpen(true)} className="mt-5 h-11 rounded-full bg-white px-5 text-sm font-semibold text-black">Sign in securely</button></section>}

        {user && (!signedIn || !hasLinkedVerifiedEmail) && <section className="mt-8 rounded-3xl border border-amber-200/15 bg-amber-100/[0.045] p-5 sm:p-6"><div className="flex gap-3"><ShieldCheck size={21} className="mt-0.5 shrink-0 text-amber-100" /><div><h2 className="font-semibold text-white">Finish admin verification</h2><p className="mt-1 text-sm leading-relaxed text-zinc-300">This portal requires a verified phone number and a verified admin email. {signedIn ? 'Link your admin Google account to this phone login.' : 'Verify your phone first.'}</p><button type="button" onClick={() => signedIn ? setLinkOpen(true) : setAuthOpen(true)} className="mt-4 h-10 rounded-full border border-amber-100/30 px-4 text-sm font-semibold text-amber-50">{signedIn ? 'Link admin email' : 'Verify mobile'}</button></div></div></section>}

        {user && signedIn && hasLinkedVerifiedEmail && <nav className="mt-7 flex gap-2 rounded-2xl border border-white/10 bg-white/[0.025] p-1.5" aria-label="Admin sections">
          {[['PAYMENTS', 'Payments'], ['EVENTS', 'Events']].map(([id, label]) => <button type="button" key={id} onClick={() => { setSection(id); setError(''); setNotice(''); }} aria-pressed={section === id} className={`min-h-10 flex-1 rounded-xl px-4 text-sm font-semibold transition ${section === id ? 'bg-violet-200 text-[#201331]' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}>{label}</button>)}
        </nav>}

        {user && signedIn && hasLinkedVerifiedEmail && section === 'EVENTS' && <AdminEventManager />}

        {user && signedIn && hasLinkedVerifiedEmail && section === 'PAYMENTS' && <>
          <section className="mt-7 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-4"><div><p className="text-xs uppercase tracking-[.18em] text-zinc-500">Signed in as</p><p className="mt-1 text-sm font-medium text-white">{user.email} <span className="text-zinc-500">· +{user.phoneNumber?.replace(/^\+/, '')}</span></p></div><div className="inline-flex items-center gap-2 rounded-full border border-amber-100/15 bg-amber-100/[0.04] px-3 py-1.5 text-xs text-amber-100"><Clock3 size={14} /> {payments.length} waiting</div></section>
          {notice && <div role="status" className="mt-5 rounded-xl border border-emerald-200/15 bg-emerald-100/[0.06] px-4 py-3 text-sm text-emerald-100">{notice}</div>}
          {error && <div role="alert" className="mt-5 rounded-xl border border-rose-200/15 bg-rose-100/[0.06] px-4 py-3 text-sm text-rose-100">{error}</div>}
          {loading && payments.length === 0 && <div className="mt-12 text-center text-sm text-zinc-400">Loading review queue…</div>}
          {!loading && payments.length === 0 && <section className="mt-8 rounded-3xl border border-dashed border-white/15 px-5 py-14 text-center"><Check className="mx-auto text-emerald-200" size={26} /><h2 className="mt-4 text-lg font-semibold">You’re all caught up</h2><p className="mt-2 text-sm text-zinc-400">New UPI payment reports will appear here.</p></section>}
          <div className="mt-5 space-y-4">
            {payments.map((payment) => {
              const guestList = Array.isArray(payment.attendees) ? payment.attendees : [];
              return <article key={payment.bookingId} className="overflow-hidden rounded-3xl border border-white/10 bg-[#121018] shadow-[0_16px_55px_rgba(0,0,0,.18)]">
                <div className="flex flex-col gap-4 border-b border-white/[0.07] p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
                  <div><p className="text-xs font-semibold uppercase tracking-[.16em] text-violet-200">{payment.eventTitle || 'Event booking'}</p><p className="mt-2 text-2xl font-semibold tracking-tight">{money(payment.amount)}</p><p className="mt-1 text-xs text-zinc-500">Booking {payment.bookingId}</p></div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 sm:min-w-52"><p className="text-[11px] uppercase tracking-[.16em] text-zinc-500">UPI reference / UTR</p><p className="mt-1 font-mono text-lg tracking-wider text-white">{payment.utr}</p><p className="mt-1 text-xs text-zinc-500">Submitted {displayDate(payment.submittedAt)}</p></div>
                </div>
                <div className="grid gap-5 p-5 sm:grid-cols-[1fr_1fr] sm:p-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[.16em] text-zinc-500">Customer</p>
                    <p className="mt-2 text-sm text-white">{payment.userEmail || 'Email not provided'}</p>
                    <p className="mt-1 text-sm text-zinc-400">{payment.userPhone || 'Phone not provided'}</p>
                    {guestList.length > 0 && <div className="mt-4 border-t border-white/[0.07] pt-4"><p className="text-xs font-semibold uppercase tracking-[.16em] text-zinc-500">Attendees · {guestList.length}</p><ul className="mt-2 space-y-2">{guestList.map((guest, index) => <li key={`${guest.name || guest.fullName || 'guest'}-${index}`} className="flex justify-between gap-3 text-sm"><span className="text-zinc-200">{guest.name || guest.fullName || `Guest ${index + 1}`}</span><span className="text-right text-zinc-500">{guest.phone || guest.mobile || ''}</span></li>)}</ul></div>}
                  </div>
                  <div className="rounded-2xl border border-white/[0.08] bg-black/15 p-4">
                    <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-zinc-200"><input type="checkbox" checked={Boolean(checkedIds[payment.bookingId])} onChange={(event) => setCheckedIds((state) => ({ ...state, [payment.bookingId]: event.target.checked }))} className="mt-1 h-4 w-4 accent-violet-300" /><span>I matched the amount and UTR in my bank statement.</span></label>
                    <label htmlFor={`review-note-${payment.bookingId}`} className="mt-4 block text-xs text-zinc-500">Review note <span className="text-zinc-600">(optional; rejection reason recommended)</span></label>
                    <input id={`review-note-${payment.bookingId}`} value={notes[payment.bookingId] || ''} onChange={(event) => setNotes((state) => ({ ...state, [payment.bookingId]: event.target.value }))} placeholder="Add a note" maxLength={300} className="mt-2 h-10 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white outline-none focus:border-violet-200/50" />
                    <div className="mt-4 grid grid-cols-2 gap-2"><button type="button" disabled={!checkedIds[payment.bookingId] || busyId === payment.bookingId} onClick={() => review(payment, 'REJECT')} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 text-sm font-semibold text-zinc-200 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-35"><X size={16} /> Reject</button><button type="button" disabled={!checkedIds[payment.bookingId] || busyId === payment.bookingId} onClick={() => review(payment, 'APPROVE')} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-300 text-sm font-semibold text-[#201331] transition hover:bg-violet-200 disabled:cursor-not-allowed disabled:opacity-35">{busyId === payment.bookingId ? 'Saving…' : <><Check size={16} /> Approve & issue passes</>}</button></div>
                    <p className="mt-3 text-[11px] leading-relaxed text-zinc-600">Approval is final and issues passes immediately. Only approve after confirming the actual bank credit.</p>
                  </div>
                </div>
              </article>;
            })}
          </div>
        </>}
      </div>
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} onAuthSuccess={(nextUser) => { setUser(firebaseAuth?.currentUser || nextUser); setAuthOpen(false); }} />
      <AuthModal isOpen={linkOpen} initialStep="LINK_METHODS" onClose={() => setLinkOpen(false)} onAuthSuccess={(nextUser) => { setUser(firebaseAuth?.currentUser || nextUser); setLinkOpen(false); }} />
    </div>
  );
}
