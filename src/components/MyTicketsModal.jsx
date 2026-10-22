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
  const [pendingBookings, setPendingBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [checkingBookingId, setCheckingBookingId] = useState('');
  const [pendingCheckMessage, setPendingCheckMessage] = useState('');
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
      const bookings = result.bookings || [];
      setPendingBookings(bookings.filter((booking) => booking.status === 'PENDING'));
      setPasses(bookings.filter((booking) => booking.status === 'PAID').flatMap((booking) => {
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
      setPendingBookings([]);
      setLoadError(error.message || 'Booking history could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  };

  const checkPendingBooking = async (bookingId) => {
    setCheckingBookingId(bookingId);
    setPendingCheckMessage('Checking BookOutSpot payment confirmation…');
    try {
      const user = firebaseAuth?.currentUser;
      if (!user) throw new Error('Sign in to check this booking.');
      const idToken = await user.getIdToken();
      const response = await fetch(`/api/youpi/status?bookingId=${encodeURIComponent(bookingId)}`, {
        headers: { Authorization: `Bearer ${idToken}` },
        cache: 'no-store'
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Payment status is temporarily unavailable.');
      if (result.status === 'PAID') {
        setPendingCheckMessage('Payment confirmed. Loading your passes…');
        const event = ALL_EVENTS.find((item) => item.id === result.eventId);
        setPasses((current) => [
          ...(result.tickets || []).map((ticket) => ({
            ...ticket,
            eventId: result.eventId,
            eventTitle: event?.title || 'BookOutSpot event',
            phone: ticket.guestPhone,
            selectedDate: event?.dates || 'Date to be confirmed',
            selectedTiming: event?.time || 'See event details',
            price: Number(ticket.price),
            issuedAt: ticket.issuedAt
          })),
          ...current
        ]);
        setPendingBookings((current) => current.filter((booking) => booking.bookingId !== bookingId));
        setPendingCheckMessage('Your payment is confirmed and your passes are ready.');
      } else if (result.status === 'CANCELLED') {
        setPendingCheckMessage('This booking was cancelled. If money left your account, contact BookOutSpot support before paying again.');
      } else if (result.paymentReviewStatus === 'SUBMITTED') {
        setPendingCheckMessage('Your UTR is in the bank review queue. Don’t pay again; your passes will appear here after confirmation.');
      } else if (result.paymentReviewStatus === 'REJECTED') {
        setPendingCheckMessage('We could not match the submitted payment reference. Contact BookOutSpot support before making another payment.');
      } else {
        setPendingCheckMessage('No UTR has been submitted for this booking yet. If you already paid, contact BookOutSpot support with your booking reference.');
      }
    } catch (error) {
      setPendingCheckMessage(error.message || 'Payment status is temporarily unavailable.');
    } finally {
      setCheckingBookingId('');
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
      <div ref={dialogRef} tabIndex={-1} className="bos-sheet bos-tickets-sheet bos-passes-sheet" role="dialog" aria-modal="true" aria-labelledby="bos-tickets-title">
        
        {/* Masthead */}
        <div className="bos-passes-header bg-[#171624] border-b border-white/10 p-4 sm:p-5 flex items-center justify-between shrink-0">
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
        <div className="bos-passes-content p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {loadError && <p role="alert" className="rounded-xl border border-amber-300/20 bg-amber-300/5 px-4 py-3 text-xs text-amber-100">{loadError}</p>}
          {isLoading ? <div role="status" className="py-16 text-center text-sm text-zinc-400">Loading your tickets…</div> : passes.length === 0 && pendingBookings.length === 0 ? (
            <div className="bos-passes-empty">
              <span className="bos-passes-empty-icon"><Ticket size={24} weight="regular" /></span>
              <div className="bos-passes-empty-copy">
                <span className="bos-passes-eyebrow">YOUR NEXT NIGHT OUT</span>
                <p className="bos-passes-empty-title">Your passes will live here.</p>
                <p className="bos-passes-empty-description">Once a booking is paid and confirmed, its tickets and entry details will appear in this space.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onBookNewPass) onBookNewPass();
                }}
                className="bos-passes-empty-cta inline-flex items-center gap-2 py-3 px-6 rounded-full bg-white hover:bg-zinc-200 text-black text-xs font-bold uppercase tracking-wider transition-transform active:scale-95 cursor-pointer shadow-xl"
              >
                <span>Explore events</span>
                <ArrowRight size={14} weight="bold" />
              </button>
            </div>
          ) : (
            <div className="space-y-6">

              {pendingBookings.length > 0 && (
                <section className="space-y-3" aria-labelledby="bos-pending-bookings-title">
                  <div>
                    <h4 id="bos-pending-bookings-title" className="text-sm font-semibold text-white">Payment review</h4>
                    <p className="mt-1 text-xs text-zinc-400">We issue passes after matching your transfer in the bank statement. Please don’t pay twice.</p>
                  </div>
                  {pendingBookings.map((booking) => {
                    const event = ALL_EVENTS.find((item) => item.id === booking.eventId);
                    return (
                      <article key={booking.bookingId} className="rounded-2xl border border-amber-200/15 bg-amber-200/[0.04] p-4 text-left">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-white">{event?.title || 'BookOutSpot event'}</p>
                            <p className="mt-1 text-xs text-zinc-400">
                              {(booking.items || []).length > 1
                                ? booking.items.map((item) => `${item.tierType === 'DUO' ? 'Couple / Duo' : 'Entry'} × ${item.quantity}`).join(' · ')
                                : booking.tierType === 'DUO' ? 'Couple / Duo · 2 people' : 'Entry · 1 person'} · ₹{Number(booking.totalAmount).toLocaleString('en-IN')}
                            </p>
                            {booking.reportedUtr && <p className="mt-2 font-mono text-[11px] text-amber-100/80">UTR {booking.reportedUtr} · {booking.paymentReviewStatus === 'REJECTED' ? 'needs support' : 'awaiting bank check'}</p>}
                          </div>
                          <button
                            type="button"
                            disabled={checkingBookingId === booking.bookingId}
                            onClick={() => checkPendingBooking(booking.bookingId)}
                            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 text-xs font-semibold text-white hover:bg-white/15 disabled:opacity-60"
                          >
                            {checkingBookingId === booking.bookingId ? 'Checking…' : 'Check status'}
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      </article>
                    );
                  })}
                  {pendingCheckMessage && <p role="status" className="text-xs leading-relaxed text-amber-100">{pendingCheckMessage}</p>}
                </section>
              )}
              
              {/* Quick Action Toolbar */}
              {passes.length > 0 && <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-xs text-left">
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
              </div>}

              {/* Render Stubs */}
              {passes.length > 0 && <div className="space-y-4">
                {passes.map((pass, idx) => (
                  <Suspense key={pass.id || idx} fallback={<div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center text-xs text-zinc-400">Preparing your ticket…</div>}>
                    <TicketStub pass={pass} passNumber={idx + 1} totalPasses={passes.length} />
                  </Suspense>
                ))}
              </div>}

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bos-passes-footer bg-[#171624] border-t border-white/10 px-5 py-3 flex items-center justify-between text-[11px] text-zinc-500 shrink-0">
          <span>BookOutSpot · bookourspot.com</span>
          <span className="text-zinc-400">Your nights out, sorted</span>
        </div>

      </div>
    </div>, document.body
  );
}
