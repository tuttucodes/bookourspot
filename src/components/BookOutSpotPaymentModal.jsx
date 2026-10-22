import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, LockKeyhole, Smartphone, X } from 'lucide-react';
import { firebaseAuth } from '../utils/firebaseClient';

let scriptPromise;

function loadYoupiCheckout(scriptUrl, merchantKey) {
  if (window.Youpi?.pay) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = scriptUrl;
    script.async = true;
    script.dataset.youpiKey = merchantKey;
    script.dataset.currency = 'INR';
    script.onload = () => resolve(Boolean(window.Youpi?.pay));
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  }).then((loaded) => {
    if (!loaded) scriptPromise = null;
    return loaded;
  });
  return scriptPromise;
}

export default function BookOutSpotPaymentModal({
  isOpen, onClose, totalAmount, totalGuests, tierLabel, tierType = 'SOLO', primaryName, primaryPhone,
  onConfirmSuccess, eventId = 'halloween-affair', quantity = 1, attendees = []
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('ready');
  const [pendingCheck, setPendingCheck] = useState(null);
  if (!isOpen) return null;

  const confirmFromServer = async (bookingId, idToken) => {
    setStatus('verifying');
    const deadline = Date.now() + 90000;
    while (Date.now() < deadline) {
      const response = await fetch(`/api/youpi/status?bookingId=${encodeURIComponent(bookingId)}`, {
        headers: { Authorization: `Bearer ${idToken}` },
        cache: 'no-store'
      });
      const booking = await response.json().catch(() => ({}));
      if (response.ok && booking.status === 'PAID' && Array.isArray(booking.tickets) && booking.tickets.length === totalGuests) {
        setStatus('success');
        onConfirmSuccess(bookingId, booking.tickets);
        return;
      }
      if (!response.ok && response.status !== 503) throw new Error(booking.error || 'We could not confirm this booking.');
      await new Promise((resolve) => window.setTimeout(resolve, 2200));
    }
    setStatus('pending');
    setError('Payment is still being confirmed. Keep this page open; your pass will appear after BookOutSpot verifies the transfer. If you already paid, don’t pay again.');
  };

  const startPayment = async () => {
    setIsLoading(true);
    setError('');
    setStatus('ready');
    try {
      const user = firebaseAuth?.currentUser;
      if (!user) throw new Error('Sign in before booking this event.');
      const idToken = await user.getIdToken();
      const orderResponse = await fetch('/api/youpi/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ eventId, tierType, quantity, totalGuests, totalAmount, attendees })
      });
      const order = await orderResponse.json().catch(() => ({}));
      if (!orderResponse.ok || !order.orderId || !order.checkoutScriptUrl || !order.merchantKey) {
        throw new Error(order.error || 'BookOutSpot UPI checkout is unavailable right now.');
      }
      if (!await loadYoupiCheckout(order.checkoutScriptUrl, order.merchantKey)) {
        throw new Error('BookOutSpot UPI checkout could not load. Please try again.');
      }
      setIsLoading(false);
      setPendingCheck({ bookingId: order.bookingId, idToken });
      setStatus('awaiting');
      window.Youpi.pay({
        order_id: order.orderId,
        amount: order.amount,
        currency: 'INR',
        name: 'BookOutSpot',
        description: `${tierLabel} · ${totalGuests} ${totalGuests === 1 ? 'guest' : 'guests'}`,
        handler: async (gatewayResponse) => {
          setPendingCheck({ bookingId: order.bookingId, idToken });
          if (gatewayResponse?.status !== 'SUCCESS') {
            setStatus('pending');
            setError('Payment is not confirmed yet. If you paid, don’t retry; check its status here in a moment.');
            return;
          }
          try {
            await confirmFromServer(order.bookingId, idToken);
          } catch (verificationError) {
            setStatus('pending');
            setError(verificationError.message || 'Payment confirmation is still pending. Please do not pay again.');
          }
        },
        onClose: () => {
          setStatus((current) => current === 'success' ? current : current === 'verifying' || current === 'awaiting' ? 'pending' : current);
        }
      });
    } catch (checkoutError) {
      setError(checkoutError.message || 'BookOutSpot UPI checkout is unavailable right now.');
      setIsLoading(false);
      setStatus('ready');
    }
  };

  const checkPendingPayment = async () => {
    if (!pendingCheck) {
      setStatus('ready');
      setError('Open your bookings to check whether this payment was confirmed.');
      return;
    }
    setError('');
    try {
      await confirmFromServer(pendingCheck.bookingId, pendingCheck.idToken);
    } catch (verificationError) {
      setStatus('pending');
      setError(verificationError.message || 'Payment confirmation is still pending. Please do not pay again.');
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <section className="w-full max-w-md overflow-hidden rounded-t-[28px] border border-violet-200/15 bg-[linear-gradient(155deg,#21192f,#121116)] text-white shadow-2xl sm:rounded-3xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-200 text-lg font-black text-violet-950">b</span><div><p className="text-sm font-bold">BookOutSpot checkout</p><p className="text-[11px] text-zinc-400">{tierLabel} · {totalGuests} {totalGuests === 1 ? 'guest' : 'guests'}</p></div></div>
          <button type="button" onClick={onClose} aria-label="Close checkout" className="grid h-10 w-10 place-items-center rounded-full bg-white/5 hover:bg-white/10"><X size={18} /></button>
        </div>
        <div className="space-y-5 p-5">
          <div className="flex items-end justify-between"><div><p className="text-xs text-zinc-300">A little Halloween affair</p><p className="mt-1 text-[11px] text-zinc-500">UPI transfer · INR</p></div><p className="text-2xl font-semibold tracking-tight">₹{Number(totalAmount).toLocaleString('en-IN')}</p></div>
          <div className="space-y-3 rounded-2xl border border-violet-200/10 bg-white/[0.04] p-4">
            <p className="text-xs font-semibold text-zinc-100">Pay with any UPI app</p>
            <div className="flex items-center gap-2 text-xs text-zinc-400"><Smartphone size={16} className="text-violet-200" /> Google Pay, PhonePe, Paytm and other UPI apps</div>
            <p className="text-[11px] leading-relaxed text-zinc-500">Your pass is issued after BookOutSpot receives and verifies the payment confirmation.</p>
          </div>
          {error && <p role="alert" className="rounded-xl border border-amber-300/20 bg-amber-300/10 px-3 py-2.5 text-xs leading-relaxed text-amber-100">{error}</p>}
          {status === 'verifying' && <p role="status" className="flex items-center gap-2 text-xs text-violet-200"><span className="h-2 w-2 animate-pulse rounded-full bg-violet-300" /> Confirming payment with BookOutSpot…</p>}
          {status === 'pending' && !error && <p role="status" className="text-xs leading-relaxed text-amber-100">If you completed a UPI transfer, check its status here before trying again. Do not pay twice.</p>}
          {status === 'success' && <p role="status" className="flex items-center gap-2 text-xs text-emerald-300"><CheckCircle2 size={16} /> Payment verified. Your pass is ready.</p>}
          <button type="button" disabled={isLoading || status === 'verifying' || status === 'awaiting'} onClick={status === 'pending' ? checkPendingPayment : startPayment} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#dfceff] to-[#a987ff] py-3.5 text-sm font-bold text-[#171020] hover:brightness-110 disabled:opacity-60">
            {isLoading ? 'Preparing secure UPI checkout…' : status === 'awaiting' ? 'Waiting for UPI checkout…' : status === 'pending' ? <>Check payment status <ArrowRight size={17} /></> : <>Pay ₹{Number(totalAmount).toLocaleString('en-IN')} with UPI <ArrowRight size={17} /></>}
          </button>
          <p className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-500"><LockKeyhole size={12} /> Payments by BookOutSpot</p>
          <p className="text-center text-[10px] leading-relaxed text-zinc-600">We never issue a ticket from a browser callback or payment screenshot.</p>
        </div>
      </section>
    </div>
  );
}
