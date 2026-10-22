import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  X, 
  CheckCircle, 
  ShieldCheck, 
  ArrowRight, 
  WarningCircle, 
  CheckSquare, 
  Square,
  Printer,
  WhatsappLogo,
  Lock,
  Ticket
} from '@phosphor-icons/react';
import TicketStub from './TicketStub';
import RazorpayModal from './RazorpayModal';
import { generateUniquePassId, savePasses, getStoredPasses } from '../utils/passRegistry';

export default function PassCheckoutModal({ 
  isOpen, 
  onClose, 
  initialTier = 'SOLO',
  initialQuantity = 1 
}) {
  const [selectedTier, setSelectedTier] = useState(initialTier); // 'SOLO' | 'DUO'
  const [quantity, setQuantity] = useState(initialQuantity);
  
  // Each guest's individual credentials
  const [guests, setGuests] = useState([
    { name: '', phone: '', instagram: '' }
  ]);
  
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [step, setStep] = useState('DETAILS'); // 'DETAILS' | 'STUBS'
  const [isRazorpayOpen, setIsRazorpayOpen] = useState(false);
  const [issuedPasses, setIssuedPasses] = useState([]);

  const tierPrices = {
    SOLO: 1500,
    DUO: 2800
  };

  const guestsPerUnit = selectedTier === 'DUO' ? 2 : 1;
  const totalGuests = quantity * guestsPerUnit;
  const totalAmount = quantity * tierPrices[selectedTier];

  // Sync guests array with totalGuests count
  useEffect(() => {
    setGuests(prev => {
      const updated = [...prev];
      while (updated.length < totalGuests) {
        updated.push({ name: '', phone: '', instagram: '' });
      }
      return updated.slice(0, totalGuests);
    });
  }, [totalGuests]);

  const updateGuest = (index, field, value) => {
    setGuests(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleProceedToRazorpay = (e) => {
    e.preventDefault();

    // Validate that every guest has a name and phone number
    for (let i = 0; i < totalGuests; i++) {
      const g = guests[i];
      if (!g.name || !g.name.trim()) {
        alert(`Please enter the full legal name for Guest 0${i + 1}.`);
        return;
      }
      if (!g.phone || !g.phone.trim()) {
        alert(`Please enter the phone number for Guest 0${i + 1}.`);
        return;
      }
    }

    if (!agreedTerms) {
      alert('Please confirm that you acknowledge the non-transferable admission terms.');
      return;
    }

    setIsRazorpayOpen(true);
  };

  const handlePaymentSuccess = (cleanUtr) => {
    setIsRazorpayOpen(false);

    // Generate distinct unique pass for each individual guest
    const newPasses = [];
    const tierLabel = selectedTier === 'DUO' ? 'Couple / Duo Pass' : 'Solo House Pass';
    const singlePassPrice = Math.round(totalAmount / totalGuests);

    for (let i = 0; i < totalGuests; i++) {
      const currentGuest = guests[i];
      newPasses.push({
        id: generateUniquePassId(i + 1, totalGuests),
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

    // Save to persistent pass registry & Supabase cloud
    savePasses(newPasses);
    setIssuedPasses(newPasses);
    setStep('STUBS');

    try {
      confetti({
        particleCount: 140,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#FF521B', '#FFA947', '#F3EFE0', '#15121B']
      });
    } catch {}
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  const whatsappGroupUrl = "https://chat.whatsapp.com/GnMqQbcq6KA3nCDRzAzKp0?s=cl&p=i&mlu=4&ilr=4";

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex flex-col items-center justify-start sm:justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
        style={{ overscrollBehavior: 'contain' }}
      >
        <div 
          className="relative w-full max-w-lg my-auto bg-[#0C0A0F] border border-white/15 shadow-2xl p-5 sm:p-7 text-[#F3EFE0] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] relative z-10">
            <div>
              <h3 className="font-editorial-italic text-2xl text-white font-normal leading-none">
                {step === 'STUBS' ? 'Official Passes' : 'Pass Allocation'}
              </h3>
              <p className="text-xs text-zinc-400 font-sans mt-1">
                A Little Halloween Affair · 23 October · Secret Location
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close pass checkout modal"
              className="p-1.5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer border border-white/10 shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          {/* Step 1: Details & Guest Credentials */}
          {step === 'DETAILS' && (
            <form onSubmit={handleProceedToRazorpay} className="mt-5 space-y-5 relative z-10 text-left">
              
              {/* Category Cards: Sharp, Brutalist, Zero Curves */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
                  Select Pass Category
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Solo Pass */}
                  <button
                    type="button"
                    onClick={() => setSelectedTier('SOLO')}
                    className={`p-3.5 border text-left transition-all cursor-pointer ${
                      selectedTier === 'SOLO'
                        ? 'bg-[#16121C] border-[#FF521B]'
                        : 'bg-white/[0.02] border-white/10 hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-baseline justify-between mb-0.5">
                      <span className="font-editorial-italic text-lg text-white">Solo Pass</span>
                      <span className="font-mono text-sm font-semibold text-[#FFA947]">₹1,500</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-sans">Single entry · Open craft bar</p>
                  </button>

                  {/* Duo Pass */}
                  <button
                    type="button"
                    onClick={() => setSelectedTier('DUO')}
                    className={`p-3.5 border text-left transition-all cursor-pointer relative ${
                      selectedTier === 'DUO'
                        ? 'bg-[#16121C] border-[#FF521B]'
                        : 'bg-white/[0.02] border-white/10 hover:border-white/25'
                    }`}
                  >
                    <span className="absolute -top-2 right-2 px-1.5 py-0.2 bg-[#FF521B] text-[#070608] font-mono text-[9px] font-bold uppercase tracking-wider">
                      Save ₹200
                    </span>
                    <div className="flex items-baseline justify-between mb-0.5">
                      <span className="font-editorial-italic text-lg text-white">Duo Pass</span>
                      <span className="font-mono text-sm font-semibold text-[#FFA947]">₹2,800</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-sans">Two guests · Open craft bar</p>
                  </button>
                </div>
              </div>

              {/* Quantity Stepper & Price Summary */}
              <div className="p-3 bg-white/[0.02] border border-white/[0.08] flex items-center justify-between text-xs">
                <div>
                  <span className="text-zinc-200 font-medium block">
                    {quantity} {selectedTier === 'DUO' ? 'Duo Package' : 'Pass'}{quantity > 1 ? 'es' : ''}
                  </span>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    {totalGuests} {totalGuests === 1 ? 'Guest' : 'Guests'} total admission
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-black/50 border border-white/10 p-1">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-6 h-6 bg-white/5 hover:bg-white/15 text-white flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-mono text-xs font-semibold text-white w-5 text-center">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.min(5, quantity + 1))}
                      className="w-6 h-6 bg-white/5 hover:bg-white/15 text-white flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <span className="font-mono text-sm font-bold text-[#FFA947] pl-1">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Guest Registration: Each Guest Name & Phone Number */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-1.5">
                  <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                    Guest Credentials ({totalGuests})
                  </span>
                  <span className="text-[10px] text-zinc-500 font-sans">
                    Govt Photo ID checked at the gate
                  </span>
                </div>

                {/* Dynamic list of guests with name and phone number for EACH guest */}
                <div className="space-y-3 max-h-[36vh] overflow-y-auto pr-1">
                  {guests.map((g, idx) => (
                    <div 
                      key={idx}
                      className="p-3 bg-white/[0.02] border border-white/[0.08] space-y-2.5 text-left"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-editorial-italic text-sm text-[#FFA947] font-normal">
                          Guest 0{idx + 1} {idx === 0 ? '· Primary Booker' : ''}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label htmlFor={`guest_name_${idx}`} className="sr-only">Guest {idx + 1} Name</label>
                          <input
                            type="text"
                            id={`guest_name_${idx}`}
                            name={`guest_name_${idx}`}
                            required
                            value={g.name}
                            onChange={(e) => updateGuest(idx, 'name', e.target.value)}
                            placeholder={`Full Name (as per ID)`}
                            className="w-full bg-black/60 border border-white/10 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-[#FF521B] outline-none transition-colors"
                          />
                        </div>

                        <div>
                          <label htmlFor={`guest_phone_${idx}`} className="sr-only">Guest {idx + 1} Phone</label>
                          <input
                            type="tel"
                            id={`guest_phone_${idx}`}
                            name={`guest_phone_${idx}`}
                            required
                            value={g.phone}
                            onChange={(e) => updateGuest(idx, 'phone', e.target.value)}
                            placeholder={`WhatsApp Phone Number`}
                            className="w-full bg-black/60 border border-white/10 px-3 py-2 text-xs text-white placeholder-zinc-500 font-mono focus:border-[#FF521B] outline-none transition-colors"
                          />
                        </div>
                      </div>

                      {/* Instagram handle only on primary booker */}
                      {idx === 0 && (
                        <div>
                          <label htmlFor="guest_ig_0" className="sr-only">Instagram Handle</label>
                          <input
                            type="text"
                            id="guest_ig_0"
                            name="guest_ig_0"
                            autoComplete="off"
                            spellCheck={false}
                            value={g.instagram}
                            onChange={(e) => updateGuest(0, 'instagram', e.target.value)}
                            placeholder="Instagram Handle (Optional)"
                            className="w-full bg-black/40 border border-white/10 px-3 py-1.5 text-xs text-zinc-300 placeholder-zinc-500 focus:border-[#FF521B] outline-none transition-colors"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Policy Confirmation */}
              <div className="pt-1 space-y-2">
                <label 
                  htmlFor="terms_checkbox"
                  className="flex items-start gap-2.5 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    id="terms_checkbox"
                    name="terms_checkbox"
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                    className="sr-only"
                  />
                  <div className="text-[#FF521B] mt-0.5 shrink-0" aria-hidden="true">
                    {agreedTerms ? <CheckSquare size={16} weight="fill" /> : <Square size={16} />}
                  </div>
                  <span className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                    Passes are non-transferable and non-refundable. Govt Photo ID matching each registered guest name is verified at the door. 21+ only.
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!agreedTerms}
                className="w-full py-3.5 px-5 bg-[#FF521B] hover:bg-[#ff6414] disabled:opacity-40 disabled:cursor-not-allowed text-[#070608] font-mono text-xs sm:text-sm font-black tracking-wider uppercase flex items-center justify-center gap-2 active:scale-[0.99] transition-transform cursor-pointer"
              >
                <span>PROCEED TO PAYMENT (₹{totalAmount.toLocaleString('en-IN')})</span>
                <ArrowRight size={16} weight="bold" />
              </button>
            </form>
          )}

          {/* Step 2: Issued Ticket Stubs */}
          {step === 'STUBS' && (
            <div className="mt-4 text-center space-y-4 relative z-10">
              
              <div className="w-10 h-10 bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle size={24} weight="bold" />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                  Payment Verified · Passes Allocated
                </span>
                <h4 className="font-editorial-italic text-2xl text-white font-normal">
                  Official Admission Passes
                </h4>
                <p className="text-[11px] text-zinc-400 max-w-sm mx-auto font-sans">
                  {issuedPasses.length} {issuedPasses.length === 1 ? 'pass' : 'passes'} registered. 
                  Each pass carries a unique scannable QR for individual gate admission.
                </p>
              </div>

              {/* Render Each Individual Ticket Stub */}
              <div className="max-h-[50vh] overflow-y-auto space-y-3 px-1 py-1">
                {issuedPasses.map((p, idx) => (
                  <TicketStub 
                    key={p.id}
                    pass={p}
                    passNumber={idx + 1}
                    totalPasses={issuedPasses.length}
                  />
                ))}
              </div>

              {/* Actions: Print / Download Passes & Join WhatsApp */}
              <div className="space-y-2 pt-1 font-mono">
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="flex-1 py-2.5 px-3 bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Printer size={16} weight="bold" />
                    <span>Download / Print Stubs</span>
                  </button>

                  <a
                    href={whatsappGroupUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2.5 px-3 bg-[#25D366] hover:bg-[#20ba5a] text-[#070608] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <WhatsappLogo size={18} weight="fill" />
                    <span>Join VIP WhatsApp Guestlist</span>
                  </a>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer pt-1"
                >
                  Close Pass Drawer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RAZORPAY PAYMENT GATEWAY MODAL */}
      <RazorpayModal
        isOpen={isRazorpayOpen}
        onClose={() => setIsRazorpayOpen(false)}
        totalAmount={totalAmount}
        totalGuests={totalGuests}
        tierLabel={selectedTier === 'DUO' ? 'Duo Pass' : 'Solo Pass'}
        tierType={selectedTier}
        quantity={quantity}
        primaryName={guests[0]?.name || 'Guest'}
        primaryPhone={guests[0]?.phone || ''}
        onConfirmSuccess={handlePaymentSuccess}
      />
    </>
  );
}
