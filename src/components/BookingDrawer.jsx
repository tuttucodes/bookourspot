import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowRight, 
  ShieldCheck, 
  CheckSquare, 
  Square,
  Lock,
  Ticket
} from '@phosphor-icons/react';
import RazorpayModal from './RazorpayModal';
import { generateUniquePassId, savePasses } from '../utils/passRegistry';
import confetti from 'canvas-confetti';

export default function BookingDrawer({
  isOpen,
  onClose,
  event,
  onBookingSuccess
}) {
  const [selectedTier, setSelectedTier] = useState('SOLO'); // 'SOLO' | 'DUO'
  const [quantity, setQuantity] = useState(1);
  const [guests, setGuests] = useState([
    { name: '', phone: '', instagram: '' }
  ]);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [isRazorpayOpen, setIsRazorpayOpen] = useState(false);

  // Pricing calculation
  const isHalloween = event?.id === 'halloween-affair';
  const soloPrice = event?.price || 1500;
  const duoPrice = event?.duoPrice || (soloPrice * 2 - 200);

  const guestsPerUnit = (isHalloween && selectedTier === 'DUO') ? 2 : 1;
  const totalGuests = quantity * guestsPerUnit;
  const totalAmount = isHalloween 
    ? (selectedTier === 'DUO' ? quantity * duoPrice : quantity * soloPrice)
    : quantity * soloPrice;

  // Keep guests array in sync with totalGuests
  useEffect(() => {
    setGuests(prev => {
      const copy = [...prev];
      while (copy.length < totalGuests) {
        copy.push({ name: '', phone: '', instagram: '' });
      }
      return copy.slice(0, totalGuests);
    });
  }, [totalGuests]);

  const updateGuest = (index, field, value) => {
    setGuests(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleProceedToPayment = (e) => {
    e.preventDefault();

    for (let i = 0; i < totalGuests; i++) {
      const g = guests[i];
      if (!g.name || !g.name.trim()) {
        alert(`Please enter the full name for Guest 0${i + 1}.`);
        return;
      }
      if (!g.phone || !g.phone.trim()) {
        alert(`Please enter the phone number for Guest 0${i + 1}.`);
        return;
      }
    }

    if (!agreedTerms) {
      alert('Please accept the non-transferable admission terms to continue.');
      return;
    }

    setIsRazorpayOpen(true);
  };

  const handlePaymentConfirmed = (cleanUtr) => {
    setIsRazorpayOpen(false);

    const newPasses = [];
    const tierLabel = isHalloween 
      ? (selectedTier === 'DUO' ? 'Couple / Duo Pass' : 'Solo House Pass')
      : 'General Admission';
    const singlePassPrice = Math.round(totalAmount / totalGuests);

    for (let i = 0; i < totalGuests; i++) {
      const currentGuest = guests[i];
      newPasses.push({
        id: generateUniquePassId(i + 1, totalGuests),
        eventId: event.id,
        eventTitle: event.title,
        guestName: currentGuest.name.trim(),
        guestPhone: currentGuest.phone.trim(),
        phone: currentGuest.phone.trim(),
        bookerName: guests[0].name.trim(),
        instagram: (currentGuest.instagram || (i === 0 ? guests[0].instagram : '')).trim(),
        tierName: tierLabel,
        tierType: selectedTier,
        price: singlePassPrice,
        utr: cleanUtr,
        issuedAt: new Date().toISOString(),
        status: 'LOGGED_PENDING_AUDIT'
      });
    }

    savePasses(newPasses);

    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#431CB8', '#FF521B', '#F3EFE0', '#25D366']
      });
    } catch {}

    if (onBookingSuccess) {
      onBookingSuccess(newPasses);
    }
    onClose();
  };

  if (!isOpen || !event) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in"
        onClick={onClose}
      >
        <div 
          className="relative w-full max-w-lg mx-auto bg-[#111019] border-t border-white/15 rounded-t-[32px] p-5 sm:p-6 pb-8 text-[#F3EFE0] shadow-2xl max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Drag Indicator */}
          <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-3" />

          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
            <div className="min-w-0 pr-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#FF521B] font-bold block">
                BookOurSpot Booking · bookourspot.com
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-white truncate">
                {event.title}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close booking drawer"
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <X size={18} weight="bold" />
            </button>
          </div>

          {/* Scrollable Form Body */}
          <form onSubmit={handleProceedToPayment} className="flex-1 overflow-y-auto py-4 space-y-5 text-left">
            
            {/* Category selection */}
            {isHalloween ? (
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                  Select Pass Category
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedTier('SOLO')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      selectedTier === 'SOLO'
                        ? 'bg-[#1D182E] border-[#FF521B] shadow-lg shadow-[#FF521B]/15'
                        : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-bold text-white">Solo Pass</span>
                      <span className="text-xs font-mono font-bold text-[#FFA947]">₹1,500</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1">Single entry · Open craft bar</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTier('DUO')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                      selectedTier === 'DUO'
                        ? 'bg-[#1D182E] border-[#FF521B] shadow-lg shadow-[#FF521B]/15'
                        : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <span className="absolute -top-2 right-2.5 px-2 py-0.5 rounded-full bg-[#FF521B] text-black font-mono text-[9px] font-bold uppercase tracking-wider">
                      Save ₹200
                    </span>
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-bold text-white">Duo Pass</span>
                      <span className="text-xs font-mono font-bold text-[#FFA947]">₹2,800</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1">Two guests · Open craft bar</p>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-white block">General Admission</span>
                  <span className="text-xs text-zinc-400">Direct admission & seat reservation</span>
                </div>
                <span className="text-sm font-mono font-bold text-[#FFA947]">
                  {event.priceLabel}
                </span>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">
                  {quantity} {selectedTier === 'DUO' ? 'Duo Package' : 'Ticket'}{quantity > 1 ? 's' : ''}
                </span>
                <span className="text-[11px] text-zinc-400 font-mono">
                  {totalGuests} {totalGuests === 1 ? 'Guest' : 'Guests'} Total
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-black/60 border border-white/10 rounded-full p-1">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-mono text-xs font-bold text-white w-6 text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(5, quantity + 1))}
                    className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <span className="font-mono text-sm font-bold text-white pl-1">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Guest Credentials (Each guest's name and phone number) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Guest Credentials ({totalGuests})
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  Govt Photo ID verified at door
                </span>
              </div>

              <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-1">
                {guests.map((g, idx) => (
                  <div 
                    key={idx}
                    className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5"
                  >
                    <span className="text-xs font-bold text-[#FFA947]">
                      Guest 0{idx + 1} {idx === 0 ? '· Primary Booker' : ''}
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        value={g.name}
                        onChange={(e) => updateGuest(idx, 'name', e.target.value)}
                        placeholder="Full Legal Name"
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-[#FF521B] outline-none"
                      />
                      <input
                        type="tel"
                        required
                        value={g.phone}
                        onChange={(e) => updateGuest(idx, 'phone', e.target.value)}
                        placeholder="WhatsApp Phone Number"
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 font-mono focus:border-[#FF521B] outline-none"
                      />
                    </div>

                    {idx === 0 && (
                      <input
                        type="text"
                        value={g.instagram}
                        onChange={(e) => updateGuest(0, 'instagram', e.target.value)}
                        placeholder="Instagram Handle (Optional)"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-zinc-300 placeholder-zinc-500 focus:border-[#FF521B] outline-none"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Non-Transferable Terms Confirmation */}
            <div className="pt-1">
              <label 
                htmlFor="drawer_terms"
                className="flex items-start gap-2.5 cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  id="drawer_terms"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="sr-only"
                />
                <div className="text-[#FF521B] mt-0.5 shrink-0">
                  {agreedTerms ? <CheckSquare size={16} weight="fill" /> : <Square size={16} />}
                </div>
                <span className="text-[11px] text-zinc-400 leading-relaxed">
                  I confirm that all guest names and phone numbers match government photo ID. Passes are non-transferable and non-refundable.
                </span>
              </label>
            </div>

            {/* Sticky Action Button */}
            <button
              type="submit"
              disabled={!agreedTerms}
              className="w-full py-4 px-6 rounded-full bg-white hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl cursor-pointer transition-transform active:scale-[0.98]"
            >
              <span>Proceed to Pay (₹{totalAmount.toLocaleString('en-IN')})</span>
              <ArrowRight size={16} weight="bold" />
            </button>
          </form>
        </div>
      </div>

      {/* RAZORPAY UPI GATEWAY MODAL */}
      <RazorpayModal
        isOpen={isRazorpayOpen}
        onClose={() => setIsRazorpayOpen(false)}
        totalAmount={totalAmount}
        totalGuests={totalGuests}
        tierLabel={isHalloween ? (selectedTier === 'DUO' ? 'Duo Pass' : 'Solo Pass') : 'General Pass'}
        primaryName={guests[0]?.name || 'Guest'}
        primaryPhone={guests[0]?.phone || ''}
        onConfirmSuccess={handlePaymentConfirmed}
        merchantUpi="9074417293@pthdfc"
      />
    </>
  );
}
