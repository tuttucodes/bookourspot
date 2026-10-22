import React, { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Clock3, LockKeyhole, Smartphone, X } from 'lucide-react';
import QRCode from 'qrcode';
import { firebaseAuth } from '../utils/firebaseClient';

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

export default function BookOutSpotPaymentModal({
  isOpen, onClose, totalAmount, totalGuests, tierLabel, eventTitle = 'A little Halloween affair', tierType = 'SOLO', primaryName, primaryPhone,
  onConfirmSuccess, eventId = 'halloween-affair', quantity = 1, attendees = [], items = []
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stage, setStage] = useState('ready');
  const [order, setOrder] = useState(null);
  const [qrImage, setQrImage] = useState('');
  const [utr, setUtr] = useState('');

  useEffect(() => {
    if (!order?.upiUri) return;
    QRCode.toDataURL(order.upiUri, { width: 280, margin: 1, color: { dark: '#100d18', light: '#ffffff' } })
      .then(setQrImage).catch(() => setQrImage(''));
  }, [order?.upiUri]);

  useEffect(() => {
    if (!isOpen || stage !== 'pending' || !order?.bookingId) return undefined;
    let alive = true;
    const check = async () => {
      try {
        const user = firebaseAuth?.currentUser;
        if (!user) return;
        const token = await user.getIdToken();
        const response = await fetch(`/api/youpi/status?bookingId=${encodeURIComponent(order.bookingId)}`, {
          headers: { Authorization: `Bearer ${token}` }, cache: 'no-store'
        });
        const result = await response.json().catch(() => ({}));
        if (alive && response.ok && result.status === 'PAID' && Array.isArray(result.tickets)) {
          setStage('success');
          onConfirmSuccess?.(order.bookingId, result.tickets);
        }
      } catch { /* Keep the booking pending; the status is checked again. */ }
    };
    const timer = window.setInterval(check, 12000);
    check();
    return () => { alive = false; window.clearInterval(timer); };
  }, [isOpen, stage, order?.bookingId, onConfirmSuccess]);

  if (!isOpen) return null;

  const prepareOrder = async () => {
    setLoading(true); setError('');
    try {
      const user = firebaseAuth?.currentUser;
      if (!user) throw new Error('Sign in before booking this event.');
      const token = await user.getIdToken();
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ eventId, items, totalAmount, attendees, tierType, quantity, totalGuests })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.bookingId || !result.upiUri) {
        throw new Error(result.error || 'UPI checkout is unavailable right now.');
      }
      setOrder(result);
      setStage('pay');
    } catch (err) { setError(err.message || 'We could not prepare your UPI payment.'); }
    finally { setLoading(false); }
  };

  const reportPayment = async (event) => {
    event.preventDefault();
    const cleanUtr = utr.replace(/\D/g, '');
    if (!/^\d{12}$/.test(cleanUtr)) {
      setError('Enter the 12-digit UTR / UPI reference number from your payment app.');
      return;
    }
    setLoading(true); setError('');
    try {
      const user = firebaseAuth?.currentUser;
      if (!user) throw new Error('Your session expired. Sign in again to report this payment.');
      const token = await user.getIdToken();
      const response = await fetch('/api/payments/report', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bookingId: order.bookingId, utr: cleanUtr })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'We could not submit the payment reference.');
      setUtr(cleanUtr); setStage('pending');
    } catch (err) { setError(err.message || 'Please try again.'); }
    finally { setLoading(false); }
  };

  const upiQuery = order?.upiUri?.split('?')[1] || '';
  const upiApps = [
    { label: 'Google Pay', href: `gpay://upi/pay?${upiQuery}` },
    { label: 'PhonePe', href: `phonepe://upi/pay?${upiQuery}` },
    { label: 'Paytm', href: `paytm://upi/pay?${upiQuery}` },
  ];

  return (
    <div className="bos-checkout-overlay" onClick={onClose}>
      <section className="bos-payment-sheet max-h-[min(92dvh,850px)] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="bos-payment-title" onClick={(event) => event.stopPropagation()}>
        <div className="bos-payment-header sticky top-0 z-10 bg-[#17141e]/95 backdrop-blur-xl">
          <div className="flex items-center gap-3"><span className="bos-payment-mark">b</span><div><p id="bos-payment-title" className="text-base font-semibold">BookOutSpot checkout</p><p className="text-xs text-zinc-400">{tierLabel} · {totalGuests} {totalGuests === 1 ? 'guest' : 'guests'}</p></div></div>
          <button type="button" onClick={onClose} aria-label="Close checkout" className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-300"><X size={18} /></button>
        </div>
        <div className="bos-payment-content !grid-cols-1 sm:!grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="bos-payment-summary">
            <p className="bos-payment-eyebrow">BOOKING SUMMARY</p>
            <p className="mt-3 text-lg font-semibold text-white">{eventTitle}</p>
            <p className="mt-1 text-sm text-zinc-400">{totalGuests} {totalGuests === 1 ? 'guest' : 'guests'} · {quantity} {quantity === 1 ? 'pass' : 'passes'}</p>
            <div className="my-5 border-t border-white/10" />
            <div className="flex items-end justify-between gap-3"><div><p className="text-sm text-zinc-300">Total to pay</p><p className="mt-1 text-xs text-zinc-500">UPI · INR</p></div><p className="font-mono text-3xl font-semibold tracking-tight text-white">{money(totalAmount)}</p></div>
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2.5 text-xs text-zinc-400"><LockKeyhole size={14} className="shrink-0 text-violet-200" /> Passes are issued after we verify payment</div>
          </div>
          <div className="bos-payment-action">
            {stage === 'ready' && <>
              <div className="rounded-2xl border border-violet-200/15 bg-violet-200/[0.05] p-4"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-200/10 text-violet-100"><Smartphone size={19} /></span><div><p className="text-sm font-semibold text-white">Pay with any UPI app</p><p className="mt-0.5 text-xs text-zinc-400">Google Pay · PhonePe · Paytm</p></div></div><p className="mt-4 text-xs leading-relaxed text-zinc-400">We’ll create a payment request for the exact amount. After paying, enter the UTR shown by your UPI app.</p></div>
              <button type="button" disabled={loading} onClick={prepareOrder} className="bos-payment-button">{loading ? 'Preparing payment…' : <>Continue to UPI <ArrowRight size={17} /></>}</button>
            </>}
            {stage === 'pay' && order && <>
              <div className="text-center">
                <p className="bos-payment-eyebrow">SCAN OR OPEN YOUR UPI APP</p>
                <div className="mx-auto mt-4 grid h-52 w-52 place-items-center overflow-hidden rounded-2xl bg-white p-2 shadow-[0_16px_50px_rgba(147,117,255,.2)]">
                  {qrImage ? <img src={qrImage} alt="UPI payment QR code" className="h-full w-full" /> : <span className="text-xs text-zinc-500">Preparing QR…</span>}
                </div>
                <p className="mt-4 text-sm text-zinc-300">Scan to pay <strong className="text-white">{money(order.amount || totalAmount)}</strong></p>
                <p className="mt-1 text-xs text-zinc-500">Open your preferred UPI app and scan this QR code.</p>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {upiApps.map((app) => <a key={app.label} href={app.href} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] px-2 text-xs font-semibold text-white active:bg-white/10">{app.label}</a>)}
                </div>
                <a href={order.upiUri} className="mt-2 inline-flex min-h-10 items-center justify-center gap-2 text-xs text-zinc-400 underline underline-offset-4">Open another UPI app <ArrowRight size={14} /></a>
              </div>
              <form onSubmit={reportPayment} className="mt-6 border-t border-white/10 pt-5">
                <label htmlFor="bos-utr" className="block text-sm font-semibold text-white">Already paid? Enter your UTR</label>
                <p className="mt-1 text-xs leading-relaxed text-zinc-400">Find the 12-digit UPI reference in your payment details. We’ll check it against the bank credit.</p>
                <input id="bos-utr" name="utr" inputMode="numeric" autoComplete="off" maxLength={12} value={utr} onChange={(event) => setUtr(event.target.value.replace(/\D/g, '').slice(0, 12))} placeholder="12-digit UTR" className="mt-3 h-12 w-full rounded-xl border border-white/15 bg-black/30 px-4 font-mono tracking-widest text-white outline-none focus:border-violet-300" />
                <button type="submit" disabled={loading || utr.length !== 12} className="bos-payment-button mt-3">{loading ? 'Sending for review…' : <>I’ve paid · Submit reference <ArrowRight size={17} /></>}</button>
              </form>
            </>}
            {stage === 'pending' && <div className="rounded-2xl border border-amber-200/20 bg-amber-100/[0.06] p-5" role="status">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-amber-200/10 text-amber-100"><Clock3 size={21} /></span>
              <h3 className="mt-4 text-lg font-semibold text-white">Payment reported</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">Your UTR <span className="font-mono text-white">{utr}</span> is waiting for a bank statement check. Your booking stays pending; passes appear here as soon as we confirm the payment.</p>
              <p className="mt-3 text-xs leading-relaxed text-amber-100/80">Please don’t pay again while this booking is pending. You can close this window; we’ll keep your booking on your account.</p>
            </div>}
            {stage === 'success' && <div className="rounded-2xl border border-emerald-200/20 bg-emerald-100/[0.06] p-5" role="status"><CheckCircle2 size={24} className="text-emerald-200" /><h3 className="mt-3 text-lg font-semibold text-white">Payment verified</h3><p className="mt-1 text-sm text-zinc-300">Your passes are ready in Tickets.</p></div>}
            {error && <p role="alert" className="mt-4 rounded-xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm leading-relaxed text-rose-100">{error}</p>}
            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-zinc-500"><LockKeyhole size={13} /> Payments by BookOurSpot</p>
            <p className="mt-2 text-center text-[11px] leading-relaxed text-zinc-600">We never issue a pass from a screenshot or browser callback.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
