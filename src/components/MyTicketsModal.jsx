import React, { useState, useEffect, lazy, Suspense, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Ticket, 
  Printer, 
  WhatsappLogo, 
  CheckCircle, 
  WarningCircle, 
  ArrowRight, 
  DownloadSimple
} from '@phosphor-icons/react';
const TicketStub = lazy(() => import('./TicketStub'));
import { firebaseAuth } from '../utils/firebaseClient';
import { playTap, playSuccessChime } from '../utils/audioTheme';
import { ALL_EVENTS } from '../data/eventsData';
import useModalAccessibility from '../hooks/useModalAccessibility';

export default function MyTicketsModal({ isOpen, onClose, onBookNewPass }) {
  const [passes, setPasses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const dialogRef = useRef(null);

  const loadPasses = async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const user = firebaseAuth?.currentUser;
      if (!user) throw new Error('Sign in to view your bookings.');
      const idToken = await user.getIdToken();
      const response = await fetch('/api/bookings', { headers: { Authorization: `Bearer ${idToken}` } });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Booking history could not be loaded.');
      setPasses((result.bookings || []).flatMap((booking) => {
        const event = ALL_EVENTS.find((item) => item.id === booking.eventId);
        return (booking.tickets || []).map((ticket) => ({
          ...ticket,
          eventId: booking.eventId,
          eventTitle: event?.title || 'BookOutSpot event',
          phone: ticket.guestPhone,
          selectedDate: event?.dates || 'Date to be confirmed',
          selectedTiming: event?.time || 'See event details',
          price: Number(ticket.price),
          issuedAt: ticket.issuedAt
        }));
      }));
    } catch (error) {
      setPasses([]);
      setLoadError(error.message || 'Booking history could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadPasses();
    }
  }, [isOpen]);

  useModalAccessibility(isOpen, dialogRef, onClose);

  const handlePrintAll = () => {
    playTap();
    window.print();
  };

  const handleDownloadAllPdf = async () => {
    playTap();
    setIsDownloadingAll(true);
    try {
      for (const p of passes) {
        const { downloadPassPdf } = await import('../utils/pdfGenerator');
        await downloadPassPdf(p);
      }
      playSuccessChime();
    } catch (err) {
      console.error(err);
    }
    setIsDownloadingAll(false);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="bos-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={dialogRef} tabIndex={-1} className="bos-sheet bos-tickets-sheet" role="dialog" aria-modal="true" aria-labelledby="bos-tickets-title">
        
        {/* Masthead */}
        <div className="bg-[#171624] border-b border-white/10 p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#431CB8] flex items-center justify-center text-white">
              <Ticket size={22} weight="fill" />
            </div>
            <div className="text-left">
              <h3 id="bos-tickets-title" className="text-base sm:text-lg font-bold text-white tracking-tight">
                BookOutSpot tickets
              </h3>
              <p className="text-xs text-zinc-400">
                {passes.length} {passes.length === 1 ? 'ticket' : 'tickets'} in your account
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close my passes"
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={18} weight="bold" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {loadError && <p role="alert" className="rounded-xl border border-amber-300/20 bg-amber-300/5 px-4 py-3 text-xs text-amber-100">{loadError}</p>}
          {isLoading ? <div role="status" className="py-16 text-center text-sm text-zinc-400">Loading your tickets…</div> : passes.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <Ticket size={48} className="mx-auto text-zinc-600 stroke-[1]" />
              <div className="space-y-1">
                <p className="text-xl font-bold text-white">No passes allocated yet</p>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  No paid bookings found yet. Your passes will appear here as soon as a payment is confirmed.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onBookNewPass) onBookNewPass();
                }}
                className="inline-flex items-center gap-2 py-3 px-6 rounded-full bg-white hover:bg-zinc-200 text-black text-xs font-bold uppercase tracking-wider transition-transform active:scale-95 cursor-pointer shadow-xl"
              >
                <span>Explore events</span>
                <ArrowRight size={14} weight="bold" />
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Quick Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-xs text-left">
                <span className="text-zinc-300">Your paid bookings</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isDownloadingAll}
                    onClick={handleDownloadAllPdf}
                    className="py-1.5 px-3.5 rounded-full bg-white text-black font-semibold flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
                  >
                    <DownloadSimple size={14} weight="bold" />
                    <span>{isDownloadingAll ? 'Downloading…' : 'Save PDF All'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintAll}
                    className="py-1.5 px-3.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Printer size={15} />
                    <span>Print</span>
                  </button>
                </div>
              </div>

              {/* Render Stubs */}
              <div className="space-y-4">
                {passes.map((pass, idx) => (
                  <Suspense key={pass.id || idx} fallback={<div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center text-xs text-zinc-400">Preparing your ticket…</div>}>
                    <TicketStub pass={pass} passNumber={idx + 1} totalPasses={passes.length} />
                  </Suspense>
                ))}
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#171624] border-t border-white/10 px-5 py-3 flex items-center justify-between text-[11px] text-zinc-500 shrink-0">
          <span>BookOutSpot · bookourspot.com</span>
          <span className="text-zinc-400">Your nights out, sorted</span>
        </div>

      </div>
    </div>, document.body
  );
}
