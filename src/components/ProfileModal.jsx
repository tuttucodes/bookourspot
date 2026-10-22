import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, Check, CircleHelp, LogOut, Mail, Pencil, Phone, UserRound, X } from 'lucide-react';
import { signOutUser, updateAccountName } from '../utils/authService';

export default function ProfileModal({ isOpen, onClose, currentUser, onOpenPasses, onSignOut, onProfileUpdate, ticketCount = 0 }) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4" onClick={onClose}>
      <section className="relative w-full max-w-lg min-h-screen sm:min-h-0 sm:max-h-[90vh] overflow-y-auto rounded-none sm:rounded-3xl border border-violet-200/15 bg-[linear-gradient(155deg,rgba(34,25,49,.98),rgba(15,14,20,.98))] p-5 sm:p-7 text-white shadow-[0_24px_90px_rgba(0,0,0,.55)]" onClick={(event) => event.stopPropagation()}>
        <header className="mb-7 flex items-center gap-3">
          <button onClick={onClose} aria-label="Back" className="grid h-10 w-10 place-items-center rounded-full bg-white/7 hover:bg-white/12"><ArrowLeft size={19} /></button>
          <h1 className="text-xl font-semibold">Your account</h1>
        </header>

        <div className="mb-6 rounded-3xl border border-violet-200/15 bg-white/[0.045] p-4 shadow-inner backdrop-blur-xl sm:p-5">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 shrink-0 overflow-hidden place-items-center rounded-full border-2 border-violet-300/70 bg-violet-200 text-xl font-semibold text-[#241a39] shadow-[0_0_25px_rgba(168,136,255,.2)]">
              {currentUser?.photoURL ? <img src={currentUser.photoURL} alt="" className="h-full w-full object-cover" /> : currentUser?.name?.[0]?.toUpperCase() || <UserRound size={24} />}
            </div>
            <div className="min-w-0 flex-1">
              {editingName ? <form onSubmit={handleSaveName} className="flex gap-2">
                <input autoFocus aria-label="Your name" maxLength={80} value={name} onChange={(event) => setName(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-violet-200/25 bg-black/25 px-3 py-2 text-sm text-white outline-none focus:border-violet-200/70" />
                <button disabled={busy} aria-label="Save name" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-200 text-violet-950 disabled:opacity-50">{busy ? '…' : <Check size={18} />}</button>
                <button type="button" aria-label="Cancel editing" onClick={() => { setEditingName(false); setName(currentUser?.name || ''); setError(''); }} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-white"><X size={18} /></button>
              </form> : <div className="flex items-center gap-2">
                <h2 className="truncate text-lg font-semibold">{currentUser?.name || 'BookOutSpot member'}</h2>
                <button aria-label="Edit your name" onClick={() => { setEditingName(true); setError(''); }} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-violet-200 hover:bg-white/10"><Pencil size={15} /></button>
              </div>}
              <p className="mt-1 truncate text-xs text-zinc-400">{currentUser?.email || currentUser?.phone || 'Add account details'}</p>
            </div>
          </div>
          {error && <p role="alert" className="mt-3 rounded-xl border border-rose-300/20 bg-rose-300/10 px-3 py-2 text-xs text-rose-100">{error}</p>}
          {saved && <p role="status" className="mt-3 text-xs text-violet-200">Profile updated.</p>}
        </div>

        <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[1.5px] text-zinc-500">Your plans</p>
        <button onClick={() => { onClose(); onOpenPasses?.(); }} className="flex min-h-[72px] w-full items-center justify-between rounded-2xl border border-violet-200/15 bg-white/[0.045] p-4 text-left transition hover:border-violet-200/35 hover:bg-white/[0.075]">
          <span className="flex items-center gap-3"><CalendarDays size={19} className="text-violet-200" /><span><strong className="block text-sm font-medium">Bookings & tickets</strong><small className="mt-1 block text-xs text-zinc-400">Your passes and booking history</small></span></span><span className="flex items-center gap-3"><span className="rounded-full bg-violet-200/10 px-2.5 py-1 text-xs text-violet-100">{ticketCount}</span><ArrowRight size={17} className="text-zinc-400" /></span>
        </button>

        <p className="mb-2 mt-7 px-1 text-[10px] font-semibold uppercase tracking-[1.5px] text-zinc-500">Account details</p>
        <div className="divide-y divide-white/8 rounded-2xl border border-violet-200/10 bg-white/[0.035] px-4">
          <div className="flex items-center gap-3 py-4"><Mail size={17} className="text-zinc-500" /><span className="text-xs text-zinc-300">{currentUser?.email || 'Email not added'}</span></div>
          <div className="flex items-center gap-3 py-4"><Phone size={17} className="text-zinc-500" /><span className="text-xs text-zinc-300">{currentUser?.phone || 'Phone not added'}</span></div>
        </div>

        <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <span className="flex items-center gap-2 text-sm font-medium"><CircleHelp size={17} className="text-zinc-400" /> About BookOutSpot</span>
          <p className="mt-2 text-xs leading-relaxed text-zinc-400">Good plans, found. Discover events, food pop-ups and experiences around Chennai.</p>
        </div>

        <button onClick={handleLogout} className="mt-7 flex w-full items-center justify-center gap-2 rounded-full border border-white/15 py-3 text-sm font-medium text-zinc-200 hover:bg-white/5"><LogOut size={17} /> Sign out</button>
        <p className="mt-5 text-center text-[10px] text-zinc-600">BookOutSpot · bookourspot.com</p>
      </section>
    </div>
  );
}
