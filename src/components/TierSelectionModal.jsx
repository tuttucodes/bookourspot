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

  // Resolve tiers list
  const tiers = event?.tiers || [
    {
      id: 'general',
      name: 'General Admission',
      price: event?.price || 199,
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
      selectedTiersList.push({
        ...tier,
        qty,
        guestsPerUnit,
        tierType: tier.id.includes('duo') ? 'DUO' : 'SOLO'
      });
    }
  });
  const ticketAssignments = selectedTiersList.flatMap((tier) => (
    Array.from({ length: tier.qty * tier.guestsPerUnit }, () => ({
      tierType: tier.tierType,
      tierName: tier.name,
      price: tier.price / tier.guestsPerUnit
    }))
  ));

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
  }, [totalTickets, isOpen]);

  if (!isOpen || !event) return null;

  const updateQuantity = (tierId, delta) => {
    setTierQuantities(prev => {
      const current = prev[tierId] || 0;
      const next = Math.max(0, Math.min(5, current + delta));
      const selectedUnits = Object.values(prev).reduce((sum, value) => sum + value, 0);
      if (next > current && selectedUnits >= 5) return prev;
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

    for (let i = 0; i < totalTickets; i++) {
      const g = guests[i];
      newPasses.push({
        id: issuedTickets[i].id,
        eventId: event.id,
        eventTitle: event.title,
        guestName: issuedTickets[i].guestName || g.name.trim(),
        guestPhone: issuedTickets[i].guestPhone || g.phone.trim(),
        phone: issuedTickets[i].guestPhone || g.phone.trim(),
        bookerName: guests[0].name.trim(),
        instagram: '',
        tierName: issuedTickets[i].tierName || ticketAssignments[i]?.tierName || 'Event pass',
        tierType: issuedTickets[i].tierType || ticketAssignments[i]?.tierType || 'SOLO',
        price: Number(issuedTickets[i].price) || ticketAssignments[i]?.price || singlePassPrice,
        bookingId,
        utr: '',
        selectedDate: selectedDate?.label,
        selectedTiming: selectedDate?.timing,
        addons: [],
        issuedAt: issuedTickets[i].issuedAt || new Date().toISOString(),
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
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-5 sm:py-8 pb-32 space-y-5 text-left box-border">
          
          {step === 'TIERS' ? (
            <>
              <div className="mx-auto w-full max-w-2xl">
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
              <p className="pt-3 text-xs text-zinc-500">Mix Entry and Couple / Duo tickets in one order, up to five ticket groups total.</p>
              </div>
            </>
          ) : (
            <form onSubmit={handleProceedToPayment} className="guest-checkout">
              <div className="guest-checkout-heading">
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Guest details
                </h3>
                <p className="text-xs text-zinc-400 font-sans">
                  Add each attendee’s name and mobile number. Passes are issued after payment is verified.
                </p>
              </div>

              <div className="guest-checkout-grid">
                <section className="guest-attendee-column" aria-label="Attendee information">
                  <div className="flex items-center justify-between gap-3 px-1">
                    <span className="text-sm font-semibold text-white">Attendees</span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-zinc-400">{totalTickets} {totalTickets === 1 ? 'person' : 'people'}</span>
                  </div>
                  <div className="space-y-3">
                    {guests.map((guest, idx) => (
                      <div key={idx} className="guest-card">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-violet-200">
                        {idx === 0 ? 'Primary attendee' : `Attendee ${String(idx + 1).padStart(2, '0')}`}
                      </span>
                      <span className="text-[10px] text-zinc-500">{ticketAssignments[idx]?.tierName || 'Event guest'}{idx === 0 ? ' · Booking contact' : ''}</span>
                    </div>

                    <div className="space-y-2.5">
                      <div>
                          <label htmlFor={`guest-${idx}-name`} className="text-[11px] font-medium text-zinc-400 block mb-1">
                          Full name
                        </label>
                        <input
                          id={`guest-${idx}-name`}
                          type="text"
                          required
                          value={guest.name}
                          onChange={(e) => updateGuest(idx, 'name', e.target.value)}
                          placeholder="e.g. Rahul Sharma"
                          autoComplete={idx === 0 ? 'name' : 'off'}
                          className="guest-input"
                        />
                      </div>

                      <div>
                          <label htmlFor={`guest-${idx}-phone`} className="text-[11px] font-medium text-zinc-400 block mb-1">
                          Phone number
                        </label>
                        <input
                          id={`guest-${idx}-phone`}
                          type="tel"
                          required
                          value={guest.phone}
                          onChange={(e) => updateGuest(idx, 'phone', e.target.value)}
                          placeholder="+91 98765 43210"
                          inputMode="tel"
                          autoComplete={idx === 0 ? 'tel' : 'off'}
                          className="guest-input"
                        />
                      </div>

                    </div>
                      </div>
                    ))}
                  </div>
                </section>

                <aside className="guest-order-column">
                  <div className="guest-order-card">
                    <p className="guest-order-eyebrow">YOUR ORDER</p>
                    <div className="mt-3 flex items-start justify-between gap-3">
                      <div><div className="space-y-1">{selectedTiersList.map((tier) => <p key={tier.id} className="font-semibold text-white">{tier.name} <span className="text-violet-200">× {tier.qty}</span></p>)}</div><p className="mt-2 text-xs leading-relaxed text-zinc-400">{selectedDate?.label} · {selectedDate?.timing}</p></div>
                      <span className="shrink-0 rounded-full bg-violet-300/10 px-2.5 py-1 text-[10px] text-violet-200">{totalTickets} {totalTickets === 1 ? 'attendee' : 'attendees'}</span>
                    </div>
                    <div className="my-4 border-t border-white/10" />
                    <div className="flex items-baseline justify-between"><span className="text-sm text-zinc-400">Total</span><span className="font-mono text-xl font-bold text-white">₹{totalAmount.toLocaleString('en-IN')}</span></div>
                    <p className="mt-1 text-[11px] text-zinc-500">INR · Payments by BookOutSpot</p>
                  </div>

                  <label htmlFor="tier_terms" className="guest-terms">
                <input
                  type="checkbox"
                  id="tier_terms"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="sr-only"
                />
                    <div className="text-violet-200 mt-0.5 shrink-0">{agreedTerms ? <CheckSquare size={18} weight="fill" /> : <Square size={18} />}</div>
                <span className="text-xs text-zinc-400 leading-relaxed">
                  I confirm the attendee details are correct and understand this booking stays pending until payment is verified.
                </span>
              </label>
              <p className="-mt-2 text-[11px] leading-relaxed text-zinc-500">By continuing, you agree to our <a href="/terms" target="_blank" rel="noreferrer" className="text-violet-200 underline underline-offset-2">Terms</a> and <a href="/privacy" target="_blank" rel="noreferrer" className="text-violet-200 underline underline-offset-2">Privacy Policy</a>.</p>

              <button
                type="submit"
                disabled={!agreedTerms}
                className="guest-pay-button"
              >
                <span>Continue to secure payment</span>
                <ArrowRight size={18} weight="bold" />
              </button>
                  <p className="text-center text-[11px] leading-relaxed text-zinc-500">You’ll review the payment amount before leaving this page.</p>
                </aside>
              </div>
            </form>
          )}

        </main>

        {/* STICKY BOTTOM BAR (IMG_4057.PNG) */}
        {step === 'TIERS' && totalTickets > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-40 p-4 flex justify-center pointer-events-none">
            <div className="w-full max-w-lg rounded-full bg-[#161522]/95 backdrop-blur-xl border border-white/15 p-2 px-5 flex items-center justify-between shadow-2xl pointer-events-auto">
              <div className="text-left">
                <span className="text-[10px] uppercase text-zinc-400 font-mono block">Total · {totalTickets} {totalTickets === 1 ? 'attendee' : 'attendees'}</span>
                <span className="text-lg sm:text-xl font-extrabold text-white font-mono">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </span>
              </div>

              <button
                type="button"
                onClick={handleContinueToGuests}
                className="py-3 px-8 rounded-full bg-white hover:bg-zinc-200 disabled:bg-violet-200/20 disabled:text-violet-100/70 disabled:cursor-not-allowed text-black font-extrabold text-sm uppercase tracking-wider transition-transform active:scale-95 shadow-xl cursor-pointer"
              >
                Continue
              </button>
            </div>
          </div>
        )}

      </div>

      {/* BookOutSpot UPI gateway modal */}
      <BookOutSpotPaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        totalAmount={totalAmount}
        totalGuests={totalTickets}
        tierLabel={selectedTiersList.map((tier) => `${tier.name} × ${tier.qty}`).join(' · ') || 'Event pass'}
        eventTitle={event.title}
        eventId={event.id}
        tierType={selectedTiersList.length > 1 ? 'MIXED' : selectedTiersList[0]?.tierType || 'SOLO'}
        quantity={selectedTiersList.reduce((sum, tier) => sum + tier.qty, 0) || 1}
        items={selectedTiersList.map((tier) => ({
          tierType: tier.tierType,
          quantity: tier.qty,
          attendees: ticketAssignments
            .map((assignment, index) => ({ assignment, guest: guests[index] }))
            .filter(({ assignment }) => assignment.tierType === tier.tierType)
            .map(({ guest }) => ({ name: guest?.name || '', phone: guest?.phone || '' }))
        }))}
        primaryName={guests[0]?.name || ''}
        primaryPhone={guests[0]?.phone || ''}
        attendees={guests.map(({ name, phone }) => ({ name: name.trim(), phone: phone.trim() }))}
        onConfirmSuccess={handlePaymentConfirmed}
      />
    </>,
    document.body
  );
}
