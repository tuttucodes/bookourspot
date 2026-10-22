import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, CreditCard, LockKeyhole, ShieldCheck, Smartphone, X } from 'lucide-react';
import { firebaseAuth } from '../utils/firebaseClient';

const ORDER_ENDPOINT = import.meta.env.VITE_RAZORPAY_ORDER_ENDPOINT || '/api/razorpay/create-order';
const VERIFY_ENDPOINT = import.meta.env.VITE_RAZORPAY_VERIFY_ENDPOINT || '/api/razorpay/verify-payment';

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function RazorpayModal({
  isOpen, onClose, totalAmount, totalGuests, tierLabel, primaryName, primaryPhone,
  onConfirmSuccess, tierType = 'SOLO', eventId = 'halloween-affair', quantity = 1,
  attendees = []
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('ready');
  if (!isOpen) return null;

  const startPayment = async () => {
    setIsLoading(true);
    setError('');
    try {
      const user = firebaseAuth?.currentUser;
      if (!user) throw new Error('Sign in before booking this event.');
      const idToken = await user.getIdToken();
      const orderResponse = await fetch(ORDER_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ eventId, tierType, quantity, totalGuests, totalAmount, attendees })
      });
      const order = await orderResponse.json().catch(() => ({}));
      if (!orderResponse.ok || !order.orderId || !order.keyId) {
        throw new Error(order.error || 'Secure checkout is not available right now. Please try again later.');
      }

      if (!await loadRazorpay()) throw new Error('The payment window could not load. Check your connection and try again.');

      const checkout = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'BookOutSpot',
        description: `${tierLabel} · ${totalGuests} ${totalGuests === 1 ? 'guest' : 'guests'}`,
        image: `${window.location.origin}/favicon.svg`,
        prefill: { name: primaryName || '', contact: primaryPhone || '' },
        theme: { color: '#c6e35b' },
        handler: async (payment) => {
          setStatus('verifying');
          try {
            const verificationResponse = await fetch(VERIFY_ENDPOINT, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
              body: JSON.stringify(payment)
            });
            const verification = await verificationResponse.json().catch(() => ({}));
            if (!verificationResponse.ok || verification.verified !== true) {
              throw new Error(verification.error || 'We could not verify this payment yet. No ticket has been issued.');
            }
            setStatus('success');
            onConfirmSuccess(payment.razorpay_payment_id, verification.tickets || []);
          } catch (verificationError) {
            setStatus('ready');
            setError(verificationError.message || 'Payment verification failed. Please contact support before retrying.');
          } finally {
            setIsLoading(false);
          }
        },
        modal: { ondismiss: () => setIsLoading(false) }
      });

      checkout.on('payment.failed', (failure) => {
        setError(failure.error?.description || 'Payment did not complete. You have not been charged.');
        setIsLoading(false);
      });
      checkout.open();
    } catch (checkoutError) {
      setError(checkoutError.message || 'Secure checkout is not available right now.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <section className="w-full max-w-md rounded-t-[28px] sm:rounded-3xl border border-white/10 bg-[#181819] text-white shadow-2xl overflow-hidden" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3"><span className="w-9 h-9 rounded-xl bg-[#c6e35b] text-black grid place-items-center font-black">b</span><div><p className="text-sm font-bold">BookOutSpot checkout</p><p className="text-[11px] text-zinc-400">{tierLabel} · {totalGuests} {totalGuests === 1 ? 'guest' : 'guests'}</p></div></div>
          <button type="button" onClick={onClose} aria-label="Close checkout" className="w-9 h-9 rounded-full grid place-items-center bg-white/5 hover:bg-white/10"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-5">
          <div className="flex items-end justify-between"><div><p className="text-xs text-zinc-400">A little Halloween affair</p><p className="text-[11px] text-zinc-500 mt-1">Secure payment · INR</p></div><p className="text-2xl font-semibold tracking-tight">₹{Number(totalAmount).toLocaleString('en-IN')}</p></div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 space-y-3">
            <p className="text-xs font-semibold text-zinc-200">Pay using</p>
            <div className="flex items-center gap-2 text-xs text-zinc-400"><Smartphone size={16} /> UPI apps <span className="text-zinc-600">·</span><CreditCard size={16} /> Cards & netbanking</div>
            <div className="flex gap-2 pt-1"><span className="rounded-md bg-white px-2 py-1 text-[9px] font-bold text-[#072654]">UPI</span><span className="rounded-md bg-white px-2 py-1 text-[9px] font-bold text-[#1a1f71]">VISA</span><span className="rounded-md bg-white px-2 py-1 text-[9px] font-bold text-[#eb001b]">Mastercard</span></div>
          </div>
          {error && <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-2.5 text-xs leading-relaxed text-rose-200">{error}</p>}
          {status === 'verifying' && <p className="flex items-center gap-2 text-xs text-[#d8eb91]"><ShieldCheck size={16} /> Confirming payment with Razorpay…</p>}
          {status === 'success' && <p className="flex items-center gap-2 text-xs text-emerald-300"><CheckCircle2 size={16} /> Payment verified.</p>}
          <button type="button" disabled={isLoading} onClick={startPayment} className="w-full flex items-center justify-center gap-2 rounded-full bg-[#c6e35b] py-3.5 text-sm font-bold text-[#171910] hover:bg-[#d4ed71] disabled:opacity-60">
            {isLoading ? 'Connecting securely…' : <>Continue to payment <ArrowRight size={17} /></>}
          </button>
          <p className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-500"><LockKeyhole size={12} /> Secure checkout powered by Razorpay</p>
          <p className="text-center text-[10px] leading-relaxed text-zinc-600">Your pass is issued only after the payment is verified.</p>
        </div>
      </section>
    </div>
  );
}
