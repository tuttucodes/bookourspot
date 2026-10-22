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
  Martini,
  Flame,
  Sparkle
} from '@phosphor-icons/react';
import DateModal from './DateModal';
import RazorpayModal from './RazorpayModal';
import { generateUniquePassId, savePasses } from '../utils/passRegistry';
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
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [tierQuantities, setTierQuantities] = useState({});
  const [expandedTier, setExpandedTier] = useState(null);
  const [guests, setGuests] = useState([]);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [isRazorpayOpen, setIsRazorpayOpen] = useState(false);
  const [hasCocktailUpsell, setHasCocktailUpsell] = useState(false);

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
      setAgreedTerms(true);
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

  // Alex Hormozi Upsell: Signature Cocktail voucher allocation (+₹450)
  const cocktailUpsellPrice = 450;
  if (hasCocktailUpsell && totalTickets > 0) {
    totalAmount += cocktailUpsellPrice;
  }

  // Keep guest list synced with totalTickets and prefill primary booker if available
  useEffect(() => {
    setGuests(prev => {
      const copy = [...prev];
      const localUser = getLocalUser();
      while (copy.length < totalTickets) {
        if (copy.length === 0 && localUser?.name) {
          copy.push({
            name: localUser.name || 'Rahul Babu K',
            phone: localUser.phone || '+91 90744 17293',
            instagram: '@rahulbabu'
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
      const next = Math.max(0, Math.min(6, current + delta));
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
      alert('Please accept the non-transferable admission terms to continue.');
      return;
    }

    setIsRazorpayOpen(true);
  };

  const handlePaymentConfirmed = (cleanUtr) => {
    setIsRazorpayOpen(false);

    const newPasses = [];
    const singlePassPrice = totalTickets > 0 ? Math.round(totalAmount / totalTickets) : 0;
    const primaryTierName = selectedTiersList.length > 0 ? selectedTiersList[0].name : 'General Pass';
    const activeAddons = hasCocktailUpsell ? ['Signature Mixology Pairing (2 Craft Cocktails)'] : [];

    for (let i = 0; i < totalTickets; i++) {
      const g = guests[i];
      newPasses.push({
        id: generateUniquePassId(i + 1, totalTickets),
        eventId: event.id,
        eventTitle: event.title,
        guestName: g.name.trim(),
        guestPhone: g.phone.trim(),
        phone: g.phone.trim(),
        bookerName: guests[0].name.trim(),
        instagram: (g.instagram || (i === 0 ? guests[0].instagram : '')).trim(),
        tierName: primaryTierName,
        price: singlePassPrice,
        utr: cleanUtr,
        selectedDate: selectedDate?.label,
        selectedTiming: selectedDate?.timing,
        addons: activeAddons,
        issuedAt: new Date().toISOString(),
        status: 'LOGGED_PENDING_AUDIT'
      });
    }

    savePasses(newPasses);

    try {
      playSuccessChime();
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

                <button
                  type="button"
                  onClick={() => setIsDateModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-semibold cursor-pointer active:scale-95 transition-all shrink-0"
                >
                  Change
                </button>
              </div>

              {/* SCARCITY & URGENCY STATUS (ALEX HORMOZI DEMAND SIGNAL) */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-[#FF521B]/15 via-black/40 to-[#FFA947]/10 border border-[#FF521B]/30 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF521B] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF521B]"></span>
                  </span>
                  <span className="text-[#FFA947] font-bold text-[11px] tracking-wide uppercase">
                    High Demand · 86% Passes Claimed
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 font-sans hidden sm:inline">
                  Chennai Sanctuary
                </span>
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
                            {idx === 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-[#FFA947]/15 text-[#FFA947] border border-[#FFA947]/30 text-[9px] font-mono font-bold uppercase tracking-wider">
                                ⚡ Only 4 left
                              </span>
                            )}
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
                  Please provide individual details for each guest. Passes are strictly non-transferable and verified with Govt Photo ID at the door.
                </p>
              </div>

              {/* Order summary pill */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-white block">
                    {totalTickets} {totalTickets === 1 ? 'Guest Pass' : 'Guest Passes'}
                    {hasCocktailUpsell && (
                      <span className="text-[#FFA947] font-mono font-normal ml-1">
                        + Mixology Pairing
                      </span>
                    )}
                  </span>
                  <span className="text-zinc-400 font-mono text-[11px]">
                    {selectedDate?.label} · {selectedDate?.timing}
                  </span>
                </div>
                <span className="font-mono font-bold text-[#FFA947] text-sm">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Quick autofill helper */}
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-mono text-zinc-400">
                  Attendee Info ({totalTickets})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    playTap();
                    const localUser = getLocalUser();
                    setGuests(guests.map((g, i) => ({
                      name: i === 0 ? (localUser?.name || 'Rahul Babu K') : `Guest 0${i + 1}`,
                      phone: i === 0 ? (localUser?.phone || '+91 90744 17293') : '+91 98765 43210',
                      instagram: i === 0 ? '@rahulbabu' : ''
                    })));
                  }}
                  className="text-[11px] font-mono text-[#FFA947] hover:underline cursor-pointer"
                >
                  ⚡ Auto-fill Details
                </button>
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
                        Govt ID required
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      <div>
                        <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                          Full Legal Name
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
                          WhatsApp Phone Number
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

                      {idx === 0 && (
                        <div>
                          <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                            Instagram Handle (Optional)
                          </label>
                          <input
                            type="text"
                            value={guest.instagram}
                            onChange={(e) => updateGuest(0, 'instagram', e.target.value)}
                            placeholder="@username"
                            className="w-full bg-[#0C0B12] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-300 placeholder-zinc-600 focus:border-white/30 outline-none transition-colors"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* SIGNATURE CRAFT COCKTAILS UPSELL (NO VIP / NO FASTTRACK - PURE MIXOLOGY) */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1A1828] to-[#111018] border border-white/15 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-[#FF521B]/15 flex items-center justify-center text-[#FFA947] shrink-0">
                        <Martini size={14} weight="fill" />
                      </div>
                      <span className="text-xs font-bold text-white tracking-wide uppercase font-mono">
                        Signature Mixology Pairing
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-relaxed font-sans">
                      Add 2 handcrafted bespoke cocktails (Spiced Midnight Bourbon & House Negroni) with express bar redemption.
                    </p>
                    <div className="flex items-center gap-2 font-mono text-xs pt-0.5">
                      <span className="font-bold text-[#FFA947]">₹450</span>
                      <span className="text-[10px] text-zinc-500 line-through">₹700 at bar</span>
                      <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        SAVE ₹250
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setHasCocktailUpsell(prev => !prev);
                      if (!hasCocktailUpsell) {
                        playPassAdded();
                      } else {
                        playTap();
                      }
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all cursor-pointer shrink-0 active:scale-95 ${
                      hasCocktailUpsell
                        ? 'bg-emerald-500 text-black border border-emerald-400 shadow-lg shadow-emerald-500/20 font-black'
                        : 'bg-white/10 hover:bg-white/15 text-white border border-white/20'
                    }`}
                  >
                    {hasCocktailUpsell ? 'Added ✓' : '+ Add ₹450'}
                  </button>
                </div>
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
                  I agree that all attendee names correspond to valid government-issued photo ID. Passes are non-refundable and strictly non-transferable.
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

      {/* DATE PICKER BOTTOM SHEET (IMG_4059.PNG) */}
      <DateModal
        isOpen={isDateModalOpen}
        onClose={() => setIsDateModalOpen(false)}
        event={event}
        selectedDate={selectedDate}
        onSelectDate={(newDate) => {
          setSelectedDate(newDate);
          setIsDateModalOpen(false);
        }}
      />

      {/* RAZORPAY UPI GATEWAY MODAL */}
      <RazorpayModal
        isOpen={isRazorpayOpen}
        onClose={() => setIsRazorpayOpen(false)}
        totalAmount={totalAmount}
        totalGuests={totalTickets}
        tierLabel={selectedTiersList[0]?.name || 'General Pass'}
        primaryName={guests[0]?.name || 'Guest'}
        primaryPhone={guests[0]?.phone || ''}
        onConfirmSuccess={handlePaymentConfirmed}
        merchantUpi="9074417293@pthdfc"
      />
    </>,
    document.body
  );
}
