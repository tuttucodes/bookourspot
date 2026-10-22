import React from 'react';
import { 
  ArrowLeft, 
  PencilSimple, 
  CaretRight, 
  CalendarCheck, 
  Receipt, 
  Coins, 
  Question, 
  ChatCircleDots, 
  ChatText, 
  UserGear, 
  Info, 
  SignOut,
  CreditCard,
  Ticket
} from '@phosphor-icons/react';
import { signOutUser } from '../utils/authService';
import { playTap } from '../utils/audioTheme';

export default function ProfileModal({
  isOpen,
  onClose,
  currentUser,
  onOpenPasses,
  onSignOut
}) {
  if (!isOpen) return null;

  const user = currentUser || {
    name: 'Rahul Babu K',
    phone: '+91 9074417293',
    email: 'rahulbabuk05@gmail.com'
  };

  const handleLogout = async () => {
    playTap();
    await signOutUser();
    if (onSignOut) onSignOut();
    onClose();
  };

  const handleOpenBookings = () => {
    playTap();
    onClose();
    if (onOpenPasses) onOpenPasses();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto animate-in fade-in"
      style={{ overscrollBehavior: 'contain' }}
    >
      <div className="relative w-full max-w-md bg-[#0F0E17] border-0 sm:border border-white/10 rounded-none sm:rounded-3xl shadow-2xl text-[#F3EFE0] min-h-screen sm:min-h-0 sm:max-h-[92vh] flex flex-col font-sans overflow-hidden">
        
        {/* TOP APP BAR (1:1 with IMG_4086.PNG) */}
        <header className="px-5 py-4 flex items-center gap-4 bg-[#0F0E17] border-b border-white/5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <ArrowLeft size={20} weight="bold" />
          </button>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Profile
          </h1>
        </header>

        {/* SCROLLABLE MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-left">
          
          {/* USER INFO CARD (1:1 with IMG_4086.PNG) */}
          <div className="p-4 rounded-3xl bg-[#1A1828] border border-white/10 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-3.5 min-w-0">
              {/* Avatar Circle */}
              <div className="w-14 h-14 rounded-full bg-[#3B3856] border-2 border-white/20 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-inner">
                {user.name?.[0]?.toUpperCase() || 'R'}
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-white truncate">
                  {user.name || 'Rahul Babu K'}
                </h2>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  {user.phone || '+91 9074417293'}
                </p>
              </div>
            </div>

            {/* Edit Profile Pencil Icon */}
            <button
              type="button"
              onClick={() => alert(`Profile Details:\nName: ${user.name}\nPhone: ${user.phone}\nEmail: ${user.email || 'N/A'}`)}
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              <PencilSimple size={18} />
            </button>
          </div>

          {/* PASS HOLDER MEMBERSHIP CARD (1:1 with IMG_4086.PNG) */}
          <div 
            onClick={() => alert('BookOurSpot Pass holder membership includes priority guestlist RSVP, 2 complimentary signature cocktails per salon, and direct optical entry.')}
            className="p-4 rounded-2xl bg-gradient-to-r from-[#1E1B38] via-[#2A2352] to-[#161426] border border-white/15 flex items-center justify-between cursor-pointer group shadow-lg transition-transform active:scale-[0.99]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/20 text-[10px] font-black uppercase tracking-wider text-white font-mono shrink-0">
                PASS
              </div>
              <span className="text-xs sm:text-sm font-semibold text-white truncate">
                Become a Pass holder at ₹999
              </span>
            </div>
            <CaretRight size={16} weight="bold" className="text-zinc-400 group-hover:text-white transition-colors shrink-0" />
          </div>

          {/* PAYMENTS SECTION (1:1 with IMG_4086.PNG) */}
          <section className="space-y-1.5 pt-2">
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight px-1">
              Payments
            </h3>
            <div className="rounded-2xl bg-[#141320] border border-white/5 divide-y divide-white/5 overflow-hidden">
              
              {/* Bookings (Opens Passes Modal) */}
              <button
                type="button"
                onClick={handleOpenBookings}
                className="w-full p-4 flex items-center justify-between hover:bg-white/[0.03] transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <CalendarCheck size={20} className="text-zinc-400" />
                  <span className="text-sm font-medium text-white">Bookings & Passes</span>
                </div>
                <CaretRight size={16} className="text-zinc-500" />
              </button>

              {/* Bill Payments */}
              <div 
                onClick={() => alert('No pending bills or bar tabs.')}
                className="w-full p-4 flex items-center justify-between hover:bg-white/[0.03] transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <Receipt size={20} className="text-zinc-400" />
                  <span className="text-sm font-medium text-white">Bill Payments</span>
                </div>
                <CaretRight size={16} className="text-zinc-500" />
              </div>

              {/* Spot Credits */}
              <div 
                onClick={() => alert('Spot Credits balance: ₹0. Earn credits with each confirmed event visit.')}
                className="w-full p-4 flex items-center justify-between hover:bg-white/[0.03] transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <Coins size={20} className="text-zinc-400" />
                  <span className="text-sm font-medium text-white">Spot Credits</span>
                </div>
                <CaretRight size={16} className="text-zinc-500" />
              </div>

            </div>
          </section>

          {/* SUPPORT SECTION (1:1 with IMG_4087.PNG) */}
          <section className="space-y-1.5 pt-2">
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight px-1">
              Support
            </h3>
            <div className="rounded-2xl bg-[#141320] border border-white/5 divide-y divide-white/5 overflow-hidden">
              
              <div 
                onClick={() => alert('BookOurSpot Help Desk: For support regarding bookings, passes, or venue access, email concierge@bookourspot.com or WhatsApp +91 90744 17293.')}
                className="w-full p-4 flex items-center justify-between hover:bg-white/[0.03] transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <Question size={20} className="text-zinc-400" />
                  <span className="text-sm font-medium text-white">Frequently asked questions</span>
                </div>
                <CaretRight size={16} className="text-zinc-500" />
              </div>

              <div 
                onClick={() => window.open('https://wa.me/919074417293?text=Hi%20BookOurSpot%20Concierge', '_blank')}
                className="w-full p-4 flex items-center justify-between hover:bg-white/[0.03] transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <ChatCircleDots size={20} className="text-zinc-400" />
                  <span className="text-sm font-medium text-white">Chat with us</span>
                </div>
                <CaretRight size={16} className="text-zinc-500" />
              </div>

              <div 
                onClick={() => alert('Thank you for shaping BookOurSpot. Feedback registered.')}
                className="w-full p-4 flex items-center justify-between hover:bg-white/[0.03] transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <ChatText size={20} className="text-zinc-400" />
                  <span className="text-sm font-medium text-white">Share feedback</span>
                </div>
                <CaretRight size={16} className="text-zinc-500" />
              </div>

            </div>
          </section>

          {/* MORE SECTION (1:1 with IMG_4087.PNG) */}
          <section className="space-y-1.5 pt-2">
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight px-1">
              More
            </h3>
            <div className="rounded-2xl bg-[#141320] border border-white/5 divide-y divide-white/5 overflow-hidden">
              
              <div 
                onClick={() => alert('Account Settings: Linked with WhatsApp and Supabase Cloud Auth.')}
                className="w-full p-4 flex items-center justify-between hover:bg-white/[0.03] transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <UserGear size={20} className="text-zinc-400" />
                  <span className="text-sm font-medium text-white">Account settings</span>
                </div>
                <CaretRight size={16} className="text-zinc-500" />
              </div>

              <div 
                onClick={() => alert('BookOurSpot is a curated nightlife, house salon, and secret event booking platform in Chennai.')}
                className="w-full p-4 flex items-center justify-between hover:bg-white/[0.03] transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <Info size={20} className="text-zinc-400" />
                  <span className="text-sm font-medium text-white">About us</span>
                </div>
                <CaretRight size={16} className="text-zinc-500" />
              </div>

            </div>
          </section>

          {/* LOGOUT ROW (1:1 with IMG_4087.PNG) */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full p-4 rounded-2xl bg-[#141320] hover:bg-red-950/20 border border-white/5 hover:border-red-500/30 flex items-center justify-between text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <SignOut size={20} className="text-zinc-400 group-hover:text-red-400 transition-colors" />
                <span className="text-sm font-semibold text-white group-hover:text-red-300 transition-colors">
                  Logout
                </span>
              </div>
              <CaretRight size={16} className="text-zinc-500" />
            </button>
          </div>

          {/* BRANDING FOOTER (1:1 with IMG_4087.PNG) */}
          <div className="pt-6 pb-4 text-center space-y-1">
            <p className="font-mono font-black text-sm text-zinc-500 uppercase tracking-widest">
              BookOurSpot
            </p>
            <p className="text-[10px] text-zinc-600 font-mono">
              v1.0.0 · Curated Chennai Events
            </p>
          </div>

        </main>

      </div>
    </div>
  );
}
