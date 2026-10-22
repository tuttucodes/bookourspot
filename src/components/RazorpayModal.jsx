import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  ShieldCheck, 
  WarningCircle, 
  QrCode, 
  CreditCard, 
  Bank, 
  LockSimple,
  Clock,
  CheckCircle,
  Copy,
  Check
} from '@phosphor-icons/react';

export default function RazorpayModal({
  isOpen,
  onClose,
  totalAmount,
  totalGuests,
  tierLabel,
  primaryName,
  primaryPhone,
  onConfirmSuccess,
  merchantUpi = '9074417293@pthdfc'
}) {
  const [selectedMethod, setSelectedMethod] = useState('UPI'); // 'UPI' | 'CARD' | 'NETBANKING'
  const [qrSrc, setQrSrc] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [utrError, setUtrError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(299); // 5 minute countdown
  const [orderId] = useState(() => 'BOS_' + Math.random().toString(36).substring(2, 9).toUpperCase());

  // Generate UPI URI
  const upiUri = `upi://pay?pa=${encodeURIComponent(merchantUpi)}&pn=${encodeURIComponent('A Little Halloween Affair')}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent(`Order ${orderId} - ${primaryName || 'Pass'}`)}`;

  // Generate dynamic QR
  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(upiUri, {
        width: 280,
        margin: 1,
        color: {
          dark: '#08070B',
          light: '#FFFFFF'
        }
      })
        .then(url => setQrSrc(url))
        .catch(err => console.error('Failed to generate Razorpay QR:', err));
    }
  }, [upiUri, isOpen]);

  // Countdown timer for QR expiration
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 299));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `0${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleVerifySubmit = (e) => {
    e.preventDefault();
    setUtrError('');

    const cleanUtr = (utrNumber || '').trim();

    // 1. Strict 12-Digit Numeric Regex
    if (!/^\d{12}$/.test(cleanUtr)) {
      setUtrError('Invalid reference. Indian UPI UTR numbers are strictly 12 digits (e.g. 429381729012).');
      return;
    }

    // 2. Reject obvious fake repetitive or sequential patterns
    const repetitivePattern = /^(\d)\1{11}$/;
    const sequentialPatterns = ['123456789012', '012345678901', '987654321098', '098765432109'];
    if (repetitivePattern.test(cleanUtr) || sequentialPatterns.includes(cleanUtr)) {
      setUtrError('Invalid reference number. Please provide the authentic 12-digit UTR from your bank confirmation receipt.');
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      onConfirmSuccess(cleanUtr);
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in"
      style={{ overscrollBehavior: 'contain' }}
    >
      {/* Razorpay Master Window */}
      <div className="relative w-full max-w-2xl bg-[#0F0D16] border border-white/15 rounded-3xl shadow-2xl text-[#F3EFE0] overflow-hidden flex flex-col my-auto">
        
        {/* Top Header Bar: Razorpay Enterprise Style */}
        <div className="bg-[#171422] border-b border-white/10 p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Merchant Monogram */}
            <div className="w-11 h-11 rounded-2xl bg-[#FF521B] flex items-center justify-center font-mono font-black text-black text-base shrink-0 shadow-lg">
              HA
            </div>

            <div className="min-w-0 text-left">
              <div className="flex items-center gap-2">
                <h4 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                  A Little Halloween Affair
                </h4>
                <span className="hidden sm:inline-block text-[9px] font-mono uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Verified Merchant
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Order #{orderId} · {totalGuests} {totalGuests === 1 ? 'Guest' : 'Guests'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0 text-right">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 block font-mono">Amount Payable</span>
              <span className="text-lg sm:text-xl font-bold text-white block font-mono">
                ₹{totalAmount.toLocaleString('en-IN')}.00
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close gateway"
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={18} weight="bold" />
            </button>
          </div>
        </div>

        {/* Gateway Body: Split View (Sidebar + Content) */}
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[440px]">
          
          {/* Left Navigation: Payment Channels */}
          <div className="md:col-span-4 bg-[#13111C] border-b md:border-b-0 md:border-r border-white/10 flex md:flex-col overflow-x-auto text-xs">
            <button
              type="button"
              onClick={() => setSelectedMethod('UPI')}
              className={`p-4 text-left flex items-center gap-3 transition-colors cursor-pointer border-b md:border-b border-white/5 ${
                selectedMethod === 'UPI' 
                  ? 'bg-white/10 text-white font-bold border-l-2 border-l-[#FF521B]' 
                  : 'text-zinc-400 hover:bg-white/5'
              }`}
            >
              <QrCode size={20} className="text-[#FFA947] shrink-0" />
              <div className="min-w-0">
                <span className="block truncate">UPI QR & Apps</span>
                <span className="text-[11px] text-zinc-500 hidden sm:block">Instant zero-fee transfer</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod('CARD')}
              className={`p-4 text-left flex items-center gap-3 transition-colors cursor-pointer opacity-50 ${
                selectedMethod === 'CARD' 
                  ? 'bg-white/10 text-white font-bold' 
                  : 'text-zinc-400 hover:bg-white/5'
              }`}
            >
              <CreditCard size={20} className="shrink-0" />
              <div className="min-w-0">
                <span className="block truncate">Debit / Credit Card</span>
                <span className="text-[11px] text-zinc-500 hidden sm:block">Visa, Mastercard</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod('NETBANKING')}
              className={`p-4 text-left flex items-center gap-3 transition-colors cursor-pointer opacity-50 ${
                selectedMethod === 'NETBANKING' 
                  ? 'bg-white/10 text-white font-bold' 
                  : 'text-zinc-400 hover:bg-white/5'
              }`}
            >
              <Bank size={20} className="shrink-0" />
              <div className="min-w-0">
                <span className="block truncate">Netbanking</span>
                <span className="text-[11px] text-zinc-500 hidden sm:block">All Indian banks</span>
              </div>
            </button>
          </div>

          {/* Right Main Channel Display */}
          <div className="md:col-span-8 p-4 sm:p-6 flex flex-col justify-between space-y-4">
            
            {selectedMethod === 'UPI' && (
              <div className="space-y-4 text-left">
                
                {/* Method Header & Expiration Timer */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-xs uppercase tracking-wider text-zinc-300 font-bold">
                    Pay with UPI (GPay / PhonePe / Paytm / CRED)
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-mono text-[#FFA947] bg-[#FFA947]/10 px-2.5 py-1 rounded-full border border-[#FFA947]/20">
                    <Clock size={14} />
                    <span>{formatTimer(timeLeft)}</span>
                  </div>
                </div>

                {/* QR Code Presentation */}
                <div className="p-4 rounded-2xl bg-black/50 border border-white/10 flex flex-col sm:flex-row items-center gap-4">
                  <div className="p-2.5 bg-white rounded-2xl shrink-0 shadow-xl">
                    {qrSrc ? (
                      <img 
                        src={qrSrc} 
                        alt="Razorpay UPI QR Code" 
                        className="w-36 h-36 sm:w-40 sm:h-40 object-contain rounded-xl" 
                      />
                    ) : (
                      <div className="w-36 h-36 flex items-center justify-center text-zinc-800 text-xs font-mono">
                        Generating QR…
                      </div>
                    )}
                  </div>

                  <div className="space-y-2.5 text-left text-xs">
                    <p className="text-zinc-300 leading-relaxed font-sans">
                      Scan using Google Pay, PhonePe, Paytm, CRED or your mobile banking UPI app.
                    </p>
                    <div className="flex flex-wrap gap-1.5 text-[10px] uppercase text-zinc-400">
                      <span className="px-2.5 py-1 bg-white/5 rounded-full border border-white/10">Google Pay</span>
                      <span className="px-2.5 py-1 bg-white/5 rounded-full border border-white/10">PhonePe</span>
                      <span className="px-2.5 py-1 bg-white/5 rounded-full border border-white/10">Paytm</span>
                      <span className="px-2.5 py-1 bg-white/5 rounded-full border border-white/10">CRED</span>
                    </div>

                    <div className="pt-1">
                      <a
                        href={upiUri}
                        className="inline-block py-2.5 px-4 rounded-full bg-white hover:bg-zinc-200 text-black font-bold text-xs tracking-wide transition-colors shadow-md"
                      >
                        Launch Installed UPI App →
                      </a>
                    </div>
                  </div>
                </div>

                {/* UTR Submission Field */}
                <form onSubmit={handleVerifySubmit} className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <label htmlFor="razorpay_utr" className="font-semibold uppercase tracking-wider">
                      12-Digit Bank Reference (UTR) *
                    </label>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {utrNumber.length}/12 Digits
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="razorpay_utr"
                      name="razorpay_utr"
                      required
                      maxLength={12}
                      autoComplete="off"
                      spellCheck={false}
                      value={utrNumber}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/\D/g, '');
                        setUtrNumber(clean);
                        if (utrError) setUtrError('');
                      }}
                      placeholder="e.g. 429381729012"
                      className="flex-1 bg-black/60 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white font-mono placeholder-zinc-600 focus:border-[#FF521B] outline-none"
                    />

                    <button
                      type="submit"
                      disabled={isVerifying || utrNumber.length !== 12}
                      className="px-5 py-2.5 rounded-xl bg-[#FF521B] hover:bg-[#ff6414] disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 shadow-lg"
                    >
                      {isVerifying ? (
                        <span className="animate-pulse">Auditing…</span>
                      ) : (
                        <>
                          <ShieldCheck size={18} weight="bold" />
                          <span>Confirm</span>
                        </>
                      )}
                    </button>
                  </div>

                  {utrError && (
                    <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-start gap-1.5">
                      <WarningCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                      <span>{utrError}</span>
                    </div>
                  )}

                  <p className="text-[11px] text-zinc-500 leading-normal">
                    Enter the 12-digit UTR shown in your bank or UPI transaction receipt to instantly generate your passes.
                  </p>
                </form>

              </div>
            )}

            {selectedMethod !== 'UPI' && (
              <div className="p-12 text-center text-zinc-500 space-y-3">
                <CreditCard size={36} className="mx-auto text-zinc-600" />
                <p className="text-sm text-zinc-300 font-bold">Channel Under Maintenance</p>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                  Cards and Netbanking are currently undergoing maintenance. Please select <strong>UPI QR & Apps</strong> for zero-fee instant settlement.
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedMethod('UPI')}
                  className="mt-2 px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs uppercase font-bold"
                >
                  Switch to UPI
                </button>
              </div>
            )}

            {/* Bottom Security Footer */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-500">
              <span className="flex items-center gap-1.5">
                <LockSimple size={13} className="text-emerald-400" />
                256-Bit SSL Encrypted
              </span>
              <span>BookOurSpot · Razorpay UPI Gateway</span>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
