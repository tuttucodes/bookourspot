import React from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, CircleHelp, LogOut, Mail, Phone, UserRound } from 'lucide-react';
import { signOutUser } from '../utils/authService';

export default function ProfileModal({ isOpen, onClose, currentUser, onOpenPasses, onSignOut }) {
  if (!isOpen) return null;

  const handleLogout = async () => {
    await signOutUser();
    onSignOut?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4" onClick={onClose}>
      <section className="relative w-full max-w-lg min-h-screen sm:min-h-0 sm:max-h-[90vh] overflow-y-auto rounded-none sm:rounded-3xl border border-white/10 bg-[#141415] p-5 sm:p-7 text-white" onClick={(event) => event.stopPropagation()}>
        <header className="mb-7 flex items-center gap-3">
          <button onClick={onClose} aria-label="Back" className="grid h-10 w-10 place-items-center rounded-full bg-white/7 hover:bg-white/12"><ArrowLeft size={19} /></button>
          <h1 className="text-xl font-semibold">Your account</h1>
        </header>

        <div className="mb-7 flex items-center gap-4 rounded-2xl border border-white/10 bg-[#202021] p-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#d7e99a] text-[#202313] text-lg font-semibold">{currentUser?.name?.[0]?.toUpperCase() || <UserRound size={22} />}</div>
          <div className="min-w-0 flex-1"><h2 className="truncate text-base font-semibold">{currentUser?.name || 'BookOutSpot member'}</h2><p className="mt-1 truncate text-xs text-zinc-400">{currentUser?.email || 'Email not added'}</p></div>
        </div>

        <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[1.5px] text-zinc-500">Your plans</p>
        <button onClick={() => { onClose(); onOpenPasses?.(); }} className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-[#202021] p-4 text-left hover:bg-[#272728]">
          <span className="flex items-center gap-3"><CalendarDays size={19} className="text-zinc-400" /><span><strong className="block text-sm font-medium">Bookings & tickets</strong><small className="mt-1 block text-xs text-zinc-500">View your passes and booking history</small></span></span><ArrowRight size={17} className="text-zinc-500" />
        </button>

        <p className="mb-2 mt-7 px-1 text-[10px] font-semibold uppercase tracking-[1.5px] text-zinc-500">Account details</p>
        <div className="divide-y divide-white/8 rounded-2xl border border-white/10 bg-[#202021] px-4">
          <div className="flex items-center gap-3 py-4"><Mail size={17} className="text-zinc-500" /><span className="text-xs text-zinc-300">{currentUser?.email || 'Email not added'}</span></div>
          <div className="flex items-center gap-3 py-4"><Phone size={17} className="text-zinc-500" /><span className="text-xs text-zinc-300">{currentUser?.phone || 'Phone not added'}</span></div>
        </div>

        <div className="mt-7 rounded-2xl border border-white/10 bg-[#202021] p-4">
          <span className="flex items-center gap-2 text-sm font-medium"><CircleHelp size={17} className="text-zinc-400" /> About BookOutSpot</span>
          <p className="mt-2 text-xs leading-relaxed text-zinc-400">Good plans, found. Discover events, food pop-ups and experiences around Chennai.</p>
        </div>

        <button onClick={handleLogout} className="mt-7 flex w-full items-center justify-center gap-2 rounded-full border border-white/15 py-3 text-sm font-medium text-zinc-200 hover:bg-white/5"><LogOut size={17} /> Sign out</button>
        <p className="mt-5 text-center text-[10px] text-zinc-600">BookOutSpot · bookourspot.com</p>
      </section>
    </div>
  );
}
