import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, BadgeCheck, CalendarDays, Check, CircleHelp, LogOut, Mail, Pencil, Phone, UserRound, X } from 'lucide-react';
import { signOutUser, updateAccountName } from '../utils/authService';

export default function ProfileModal({ isOpen, onClose, currentUser, onOpenPasses, onSignOut, onProfileUpdate, onAddSignInMethod, ticketCount = 0 }) {
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(currentUser?.name || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) setName(currentUser?.name || '');
  }, [isOpen, currentUser?.name]);

  if (!isOpen) return null;

  const handleSaveName = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSaved(false);
    const result = await updateAccountName(name);
    setBusy(false);
    if (!result.success) {
      setError(result.error || 'Your profile could not be updated.');
      return;
    }
    setName(result.user.name);
    onProfileUpdate?.(result.user);
    setEditingName(false);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2400);
  };

  const handleLogout = async () => {
    await signOutUser();
    onSignOut?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 backdrop-blur-xl sm:items-center sm:p-5" onClick={onClose}>
      <section aria-label="Your account" className="relative flex max-h-[94dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-[30px] border border-white/10 bg-[#100e16]/95 text-white shadow-[0_30px_120px_rgba(0,0,0,.72)] sm:max-h-[88vh] sm:rounded-[30px]" onClick={(event) => event.stopPropagation()}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_0%,rgba(137,82,255,.19),transparent_48%),radial-gradient(ellipse_at_100%_100%,rgba(255,124,36,.06),transparent_42%)]" />
        <header className="relative flex shrink-0 items-center justify-between border-b border-white/[0.07] px-5 py-4 sm:px-8 sm:py-5">
          <div className="flex items-center gap-3">
            <button onClick={onClose} aria-label="Back" className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.06] transition hover:bg-white/10"><ArrowLeft size={19} /></button>
            <div><p className="text-[10px] font-semibold uppercase tracking-[.22em] text-violet-200/70">BookOutSpot</p><h1 className="mt-0.5 text-lg font-semibold sm:text-xl">Your account</h1></div>
          </div>
          <button onClick={onClose} aria-label="Close account" className="grid h-10 w-10 place-items-center rounded-full text-zinc-400 transition hover:bg-white/10 hover:text-white"><X size={19} /></button>
        </header>

        <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-7">
          <div className="grid gap-5 lg:grid-cols-[1.08fr_.92fr] lg:gap-6">
          <div className="rounded-3xl border border-violet-200/15 bg-[linear-gradient(135deg,rgba(125,75,210,.15),rgba(255,255,255,.035)_58%)] p-4 shadow-inner backdrop-blur-xl sm:p-6">
          <div className="flex items-center gap-4">
            <div className="grid h-[72px] w-[72px] shrink-0 overflow-hidden place-items-center rounded-full border-2 border-violet-300/80 bg-[#e4ddff] text-xl font-semibold text-[#241a39] shadow-[0_0_30px_rgba(168,136,255,.2)] sm:h-20 sm:w-20">
              {currentUser?.photoURL ? <img src={currentUser.photoURL} alt="" className="h-full w-full object-cover" /> : currentUser?.name?.[0]?.toUpperCase() || <UserRound size={24} />}
            </div>
            <div className="min-w-0 flex-1">
              {editingName ? <form onSubmit={handleSaveName} className="flex gap-2">
                <input autoFocus aria-label="Your name" maxLength={80} value={name} onChange={(event) => setName(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-violet-200/25 bg-black/25 px-3 py-2 text-sm text-white outline-none focus:border-violet-200/70" />
                <button disabled={busy} aria-label="Save name" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-200 text-violet-950 disabled:opacity-50">{busy ? '…' : <Check size={18} />}</button>
                <button type="button" aria-label="Cancel editing" onClick={() => { setEditingName(false); setName(currentUser?.name || ''); setError(''); }} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-white"><X size={18} /></button>
              </form> : <div className="flex items-center gap-2">
                <h2 className="truncate text-lg font-semibold sm:text-xl">{currentUser?.name || 'BookOutSpot member'}</h2>
                <button aria-label="Edit your name" onClick={() => { setEditingName(true); setError(''); }} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-violet-200 transition hover:bg-white/10"><Pencil size={15} /></button>
              </div>}
              <p className="mt-1 truncate text-sm text-zinc-400">{currentUser?.email || currentUser?.phone || 'Add account details'}</p>
            </div>
          </div>
          {error && <p role="alert" className="mt-3 rounded-xl border border-rose-300/20 bg-rose-300/10 px-3 py-2 text-xs text-rose-100">{error}</p>}
          {saved && <p role="status" className="mt-3 text-xs text-violet-200">Profile updated.</p>}
        </div>

          <div>
            <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[.2em] text-zinc-500">Your plans</p>
            <button onClick={() => { onClose(); onOpenPasses?.(); }} className="group flex min-h-[84px] w-full items-center justify-between rounded-2xl border border-violet-200/15 bg-white/[0.045] p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-violet-200/35 hover:bg-white/[0.075]">
              <span className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-violet-300/10"><CalendarDays size={20} className="text-violet-200" /></span><span><strong className="block text-sm font-medium">Bookings & tickets</strong><small className="mt-1 block text-xs text-zinc-400">Your passes and booking history</small></span></span><span className="flex items-center gap-3"><span className="min-w-8 rounded-full bg-violet-200/10 px-2.5 py-1 text-center text-xs text-violet-100">{ticketCount}</span><ArrowRight size={18} className="text-zinc-500 transition group-hover:translate-x-0.5 group-hover:text-white" /></span>
            </button>

            <p className="mb-2 mt-6 px-1 text-[10px] font-semibold uppercase tracking-[.2em] text-zinc-500">Account details</p>
            <div className="divide-y divide-white/[0.07] rounded-2xl border border-white/10 bg-white/[0.035] px-4">
              <div className="flex min-w-0 items-center gap-3 py-4"><Mail size={17} className="shrink-0 text-zinc-500" /><span className="truncate text-sm text-zinc-300">{currentUser?.email || 'Email not added'}</span></div>
              <div className="flex min-w-0 items-center gap-3 py-4"><Phone size={17} className="shrink-0 text-zinc-500" /><span className="min-w-0 flex-1"><span className={`block truncate text-sm ${currentUser?.phone ? 'text-zinc-300' : 'text-amber-100'}`}>{currentUser?.phone || 'Phone not added'}</span>{!currentUser?.phone && <small className="mt-1 block text-[11px] text-zinc-500">A verified mobile number is required for bookings.</small>}</span>{currentUser?.phoneVerified && <span className="flex shrink-0 items-center gap-1 text-[10px] text-emerald-200"><BadgeCheck size={15} /> Verified</span>}</div>
            </div>
            <button type="button" onClick={onAddSignInMethod} className="mt-3 min-h-11 w-full rounded-xl border border-white/10 px-4 text-left text-sm text-violet-100 transition hover:bg-white/[0.04]">Add Google or email sign-in</button>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <span className="flex items-center gap-2 text-sm font-medium"><CircleHelp size={17} className="text-zinc-400" /> About BookOutSpot</span>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">Good plans, found. Discover events, food pop-ups and experiences around Chennai.</p>
            </div>
          </div>
          </div>

          <div className="mt-5 flex flex-col-reverse items-center justify-between gap-3 border-t border-white/[0.07] pt-4 sm:flex-row sm:px-1">
            <p className="text-[10px] text-zinc-600">BookOutSpot · bookourspot.com</p>
            <button onClick={handleLogout} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-white/15 px-6 text-sm font-medium text-zinc-200 transition hover:border-rose-200/30 hover:bg-rose-200/[0.06] hover:text-rose-100 sm:w-auto"><LogOut size={17} /> Sign out</button>
          </div>
        </div>
      </section>
    </div>
  );
}
