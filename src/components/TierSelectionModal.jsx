import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  ArrowLeft, 
  CalendarCheck, 
  CaretRight, 
  Minus, 
  Plus, 
  ShieldCheck, 
  CheckSquare, 
  Square,
  ArrowRight,
} from '@phosphor-icons/react';
import BookOutSpotPaymentModal from './BookOutSpotPaymentModal';
import { savePasses } from '../utils/passRegistry';
import { getLocalUser } from '../utils/authService';
import { playTap, playPassAdded, playSuccessChime } from '../utils/audioTheme';
import confetti from 'canvas-confetti';

export default function TierSelectionModal({
  isOpen,
  onClose,
  event,
  initialDate,
  onBookingSuccess
}) {
  const [step, setStep] = useState('TIERS'); // 'TIERS' | 'GUEST_DETAILS'
  const [selectedDate, setSelectedDate] = useState(null);
  const [tierQuantities, setTierQuantities] = useState({});
  const [expandedTier, setExpandedTier] = useState(null);
  const [guests, setGuests] = useState([]);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  // Initialize selected date
  useEffect(() => {
    if (event) {
      if (initialDate) {
        setSelectedDate(initialDate);
      } else if (event.availableDates && event.availableDates.length > 0) {
        setSelectedDate(event.availableDates[0]);
      } else {
        setSelectedDate({
          id: 'default',
          label: event.dates || 'Selected Date',
          priceLabel: event.priceLabel,
          timing: event.time || 'Scheduled Slot'
        });
      }
      // Preselect 1 pass by default so booking is immediately active
      const firstTierId = event.tiers?.[0]?.id || 'solo-house-pass';
      setTierQuantities({ [firstTierId]: 1 });
      setAgreedTerms(false);
      setStep('TIERS');
    }
  }, [event, initialDate, isOpen]);

  if (!isOpen || !event) return null;

  // Resolve tiers list
  const tiers = event.tiers || [
    {
      id: 'general',
      name: 'General Admission',
      price: event.price || 199,
      bullets: [
        'Direct admission and guaranteed entry.',
        'Please carry a valid government photo ID.'
      ]
    }
  ];

  // Calculate totals
  let totalAmount = 0;
  let totalTickets = 0;
  const selectedTiersList = [];

  tiers.forEach(tier => {
    const qty = tierQuantities[tier.id] || 0;
    if (qty > 0) {
      totalAmount += qty * tier.price;
      const guestsPerUnit = tier.guestsPerUnit || (tier.id.includes('duo') ? 2 : 1);
      totalTickets += qty * guestsPerUnit;
      selectedTiersList.push({ ...tier, qty, guestsPerUnit });
    }
  });

  // Keep guest list synced with totalTickets and prefill primary booker if available
  useEffect(() => {
    setGuests(prev => {
      const copy = [...prev];
      const localUser = getLocalUser();
      while (copy.length < totalTickets) {
        if (copy.length === 0 && localUser?.name) {
          copy.push({
            name: localUser.name,
            phone: localUser.phone || '',
            instagram: ''
          });
        } else {
          copy.push({ name: '', phone: '', instagram: '' });
        }
      }
      return copy.slice(0, totalTickets);
    });
  }, [totalTickets]);

  const updateQuantity = (tierId, delta) => {
    setTierQuantities(prev => {
      const current = prev[tierId] || 0;
      const next = Math.max(0, Math.min(5, current + delta));
      if (next > current) {
        playPassAdded();
      } else if (next < current) {
        playTap();
      }
      return { ...prev, [tierId]: next };
    });
  };

  const updateGuest = (index, field, value) => {
    setGuests(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleContinueToGuests = () => {
    if (totalTickets <= 0) return;
    playTap();
    setStep('GUEST_DETAILS');
  };

  const handleProceedToPayment = (e) => {
    e.preventDefault();
    playTap();

    if (selectedTiersList.length !== 1) {
      alert('Please book one ticket type at a time.');
      return;
    }

    for (let i = 0; i < totalTickets; i++) {
      const g = guests[i];
      if (!g.name || !g.name.trim()) {
        alert(`Please enter full name for Guest 0${i + 1}.`);
        return;
      }
      if (!g.phone || !g.phone.trim()) {
        alert(`Please enter phone number for Guest 0${i + 1}.`);
        return;
      }
    }

    if (!agreedTerms) {
      alert('Please confirm the event and attendee details before continuing.');
      return;
    }

    setIsPaymentOpen(true);
  };

  const handlePaymentConfirmed = (bookingId, issuedTickets) => {
    setIsPaymentOpen(false);

    if (!Array.isArray(issuedTickets) || issuedTickets.length !== totalTickets) {
      alert('Payment was verified, but ticket issuance needs support assistance. Please contact support before retrying.');
      return;
    }

    const newPasses = [];
    const singlePassPrice = totalTickets > 0 ? Math.round(totalAmount / totalTickets) : 0;
    const primaryTierName = selectedTiersList.length > 0 ? selectedTiersList[0].name : 'General Pass';

    for (let i = 0; i < totalTickets; i++) {
      const g = guests[i];
      newPasses.push({
        id: issuedTickets[i].id,
        eventId: event.id,
        eventTitle: event.title,
        guestName: g.name.trim(),
        guestPhone: g.phone.trim(),
        phone: g.phone.trim(),
        bookerName: guests[0].name.trim(),
        instagram: '',
        tierName: primaryTierName,
        price: singlePassPrice,
        bookingId,
        utr: '',
        selectedDate: selectedDate?.label,
        selectedTiming: selectedDate?.timing,
        addons: [],
        issuedAt: new Date().toISOString(),
        status: issuedTickets[i].status || 'VALID'
      });
    }

    savePasses(newPasses);

    try {
      playSuccessChime();
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      colors: ['#a987ff', '#ff9e69', '#f3efff', '#ffffff']
      });
    } catch {}

    if (onBookingSuccess) {
      onBookingSuccess(newPasses);
    }
    onClose();
  };

  if (!isOpen || !event) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 w-full max-w-full h-full z-50 bg-[#0C0B12] text-[#F3EFE0] overflow-y-auto overflow-x-hidden flex flex-col font-sans antialiased animate-in fade-in duration-200 box-border">
        
        {/* TOP APP BAR (IMG_4057.PNG) */}
        <header className="sticky top-0 z-20 w-full bg-[#0C0B12]/95 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between shrink-0 box-border">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => {
                if (step === 'GUEST_DETAILS') {
                  setStep('TIERS');
                } else {
                  onClose();
                }
              }}
              aria-label="Back"
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-transform active:scale-95 cursor-pointer shrink-0"
            >
              <ArrowLeft size={18} weight="bold" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm sm:text-base font-bold text-white truncate">
                {event.title}
              </h1>
              <p className="text-[10px] text-zinc-400 font-mono">
                {step === 'TIERS' ? 'Select Tickets' : 'Guest Details'}
              </p>
            </div>
          </div>
        </header>

        {/* MAIN BODY */}
        <main className="flex-1 w-full max-w-full sm:max-w-md mx-auto px-4 py-4 pb-32 space-y-5 text-left box-border">
          
          {step === 'TIERS' ? (
            <>
              {/* DATE / SLOT SUMMARY CARD WITH 'CHANGE' PILL BUTTON (IMG_4057.PNG) */}
              <div className="p-3.5 rounded-2xl bg-[#1c1c20] border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                  <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-zinc-300 shrink-0">
                    <CalendarCheck size={20} weight="regular" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-semibold text-white truncate">
                      {selectedDate?.label || event.dates}
                    </h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                      {selectedDate?.timing || event.time}
                    </p>
                  </div>
                </div>

              </div>

              {/* TICKET TIERS LIST (IMG_4057.PNG) */}
              <div className="space-y-5 pt-1">
                {tiers.map((tier, idx) => {
                  const qty = tierQuantities[tier.id] || 0;
                  const isExpanded = expandedTier === tier.id;

                  return (
                    <div 
                      key={tier.id} 
                      className={`pt-4 ${idx > 0 ? 'border-t border-dashed border-white/15' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-0.5 min-w-0 flex-1 pr-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm sm:text-base font-bold text-white tracking-tight break-words">
                              {tier.name}
                            </h4>
                          </div>
                          <div className="text-sm sm:text-base font-bold text-white font-mono">
                            ₹{tier.price.toLocaleString('en-IN')}
                          </div>
                        </div>

                        {/* ADD BUTTON OR STEPPER (IMG_4057.PNG) */}
                        <div className="shrink-0">
                          {qty === 0 ? (
                            <button
                              type="button"
                              onClick={() => updateQuantity(tier.id, 1)}
                              className="px-5 py-1.5 rounded-xl border border-white/30 hover:border-white text-white font-bold text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer bg-transparent hover:bg-white/5"
                            >
                              Add
                            </button>
                          ) : (
                            <div className="flex items-center gap-2 bg-black/80 border border-white/20 rounded-xl px-2 py-1 shadow-lg">
                              <button
                                type="button"
                                onClick={() => updateQuantity(tier.id, -1)}
                                className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                                aria-label="Decrease quantity"
                              >
                                <Minus size={12} weight="bold" />
                              </button>
                              <span className="font-mono text-xs font-bold text-white min-w-[18px] text-center">
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(tier.id, 1)}
                                className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                                aria-label="Increase quantity"
                              >
                                <Plus size={12} weight="bold" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Tier Bullet Points (IMG_4057.PNG) */}
                      <div className="mt-2.5 space-y-1.5 text-xs text-zinc-300 font-sans">
                        {(tier.bullets || []).map((bullet, bIdx) => (
                          <div key={bIdx} className="flex items-start gap-2">
                            <span className="text-zinc-500 text-xs shrink-0 select-none">-</span>
                            <span className="leading-relaxed break-words">{bullet}</span>
                          </div>
                        ))}

                        {/* Read more toggle if present */}
                        {tier.moreDetails && (
                          <button
                            type="button"
                            onClick={() => setExpandedTier(isExpanded ? null : tier.id)}
                            className="text-xs font-semibold text-zinc-400 hover:text-white mt-1 inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>{isExpanded ? 'Read less' : 'Read more'}</span>
                            <CaretRight size={12} weight="bold" />
                          </button>
                        )}
                        {isExpanded && tier.moreDetails && (
                          <p className="text-xs text-zinc-400 font-mono pt-1">
                            {tier.moreDetails}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* STEP 2: GUEST DETAILS (Minimal, Luxury, Relaxed) */
            <form onSubmit={handleProceedToPayment} className="space-y-6">
              <div className="space-y-1 text-left">
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Guest Credentials
                </h3>
                <p className="text-xs text-zinc-400 font-sans">
                  Add the name and mobile number for each attendee.
                </p>
              </div>

              {/* Order summary pill */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-white block">
                    {totalTickets} {totalTickets === 1 ? 'Guest Pass' : 'Guest Passes'}
                  </span>
                  <span className="text-zinc-400 font-mono text-[11px]">
                    {selectedDate?.label} · {selectedDate?.timing}
                  </span>
                </div>
                <span className="font-mono font-bold text-[#FFA947] text-sm">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-mono text-zinc-400">
                  Attendee Info ({totalTickets})
                </span>
              </div>

              {/* Individual Guest Input Cards */}
              <div className="space-y-4">
                {guests.map((guest, idx) => (
                  <div 
                    key={idx} 
                    className="p-4 rounded-2xl bg-[#141418] border border-white/10 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#FFA947] uppercase tracking-wider font-mono">
                        Guest 0{idx + 1} {idx === 0 ? '· Primary Booker' : ''}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        Event guest
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      <div>
                        <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                          Full name
                        </label>
                        <input
                          type="text"
                          required
                          value={guest.name}
                          onChange={(e) => updateGuest(idx, 'name', e.target.value)}
                          placeholder="e.g. Rahul Sharma"
                          className="w-full bg-[#0C0B12] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-600 focus:border-white/30 outline-none transition-colors"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                          Phone number
                        </label>
                        <input
                          type="tel"
                          required
                          value={guest.phone}
                          onChange={(e) => updateGuest(idx, 'phone', e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full bg-[#0C0B12] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-600 font-mono focus:border-white/30 outline-none transition-colors"
                        />
                      </div>

                    </div>
                  </div>
                ))}
              </div>

              {/* Admission Terms Checkbox */}
              <label 
                htmlFor="tier_terms"
                className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5 cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  id="tier_terms"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="sr-only"
                />
                <div className="text-white mt-0.5 shrink-0">
                  {agreedTerms ? <CheckSquare size={18} weight="fill" /> : <Square size={18} />}
                </div>
                <span className="text-xs text-zinc-400 leading-relaxed">
                  I confirm the event and attendee details above are correct.
                </span>
              </label>

              {/* Proceed to UPI Gateway Button */}
              <button
                type="submit"
                disabled={!agreedTerms}
                className="w-full py-4 px-6 rounded-full bg-white hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed text-black font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl cursor-pointer transition-transform active:scale-[0.98]"
              >
                <span>Proceed to Pay (₹{totalAmount.toLocaleString('en-IN')})</span>
                <ArrowRight size={18} weight="bold" />
              </button>
            </form>
          )}

        </main>

        {/* STICKY BOTTOM BAR (IMG_4057.PNG) */}
        {step === 'TIERS' && totalTickets > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-40 p-4 flex justify-center pointer-events-none">
            <div className="w-full max-w-lg rounded-full bg-[#161522]/95 backdrop-blur-xl border border-white/15 p-2 px-5 flex items-center justify-between shadow-2xl pointer-events-auto">
              <div className="text-left">
                <span className="text-[10px] uppercase text-zinc-400 font-mono block">Total ({totalTickets} {totalTickets === 1 ? 'ticket' : 'tickets'})</span>
                <span className="text-lg sm:text-xl font-extrabold text-white font-mono">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </span>
              </div>

              <button
                type="button"
                onClick={handleContinueToGuests}
                className="py-3 px-8 rounded-full bg-white hover:bg-zinc-200 text-black font-extrabold text-sm uppercase tracking-wider transition-transform active:scale-95 shadow-xl cursor-pointer"
              >
                Continue
              </button>
            </div>
          </div>
        )}

      </div>

      {/* RAZORPAY UPI GATEWAY MODAL */}
      <BookOutSpotPaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        totalAmount={totalAmount}
        totalGuests={totalTickets}
        tierLabel={selectedTiersList[0]?.name || 'General Pass'}
        eventId={event.id}
        tierType={selectedTiersList[0]?.id?.includes('duo') ? 'DUO' : 'SOLO'}
        quantity={selectedTiersList[0]?.qty || 1}
        primaryName={guests[0]?.name || ''}
        primaryPhone={guests[0]?.phone || ''}
        attendees={guests.map(({ name, phone }) => ({ name: name.trim(), phone: phone.trim() }))}
        onConfirmSuccess={handlePaymentConfirmed}
      />
    </>,
    document.body
  );
}
