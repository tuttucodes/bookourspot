import React, { useState } from 'react';
import { 
  House, 
  User, 
  CaretDown, 
  MapPin, 
  BookmarkSimple, 
  CaretRight, 
  Sparkle,
  CalendarCheck,
  MusicNotes,
  Moon,
  ForkKnife,
  Ticket,
  Clock,
  ShieldCheck,
  Martini,
  Bell,
  LockSimple
} from '@phosphor-icons/react';
import { COMING_SOON_EVENTS } from '../data/eventsData';
import { playTap } from '../utils/audioTheme';

export default function EventFeed({
  events,
  onSelectEvent,
  onBookEvent,
  onOpenAuth,
  onOpenProfile,
  onOpenHostPortal,
  currentUser,
  bookmarkedIds,
  onToggleBookmark
}) {
  const [selectedCity, setSelectedCity] = useState('CHENNAI · SOUTH');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [notifiedEvents, setNotifiedEvents] = useState([]);

  const cities = ['CHENNAI · SOUTH', 'BANGALORE · INDIRANAGAR', 'MUMBAI · BANDRA'];

  // Spotlight Event is exclusively "a little halloween affair"
  const halloweenEvent = events.find(e => e.id === 'halloween-affair') || events[0];

  const handleNotifyMe = (eventId, eventTitle) => {
    playTap();
    if (!notifiedEvents.includes(eventId)) {
      setNotifiedEvents(prev => [...prev, eventId]);
      alert(`You're on the priority guestlist! We'll notify you on WhatsApp the moment passes drop for "${eventTitle}".`);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto pb-28 pt-2 px-4 sm:px-5 space-y-6 text-[#F3EFE0] font-sans">
      
      {/* TOP BAR */}
      <header className="flex items-center justify-between py-2 relative z-30">
        
        {/* Left Home circular button */}
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="w-11 h-11 rounded-full bg-[#18181b] hover:bg-[#222227] border border-white/10 flex items-center justify-center text-white transition-colors cursor-pointer"
        >
          <House size={20} weight="fill" />
        </button>

        {/* Center: Title & Location Switcher */}
        <div className="relative text-center">
          <h2 className="text-lg font-bold text-white tracking-tight leading-tight">
            Events
          </h2>
          <button
            type="button"
            onClick={() => setShowCityDropdown(!showCityDropdown)}
            className="flex items-center gap-1 text-[11px] font-semibold text-zinc-300 hover:text-white uppercase tracking-wider mx-auto transition-colors cursor-pointer mt-0.5"
          >
            <span>{selectedCity}</span>
            <CaretDown size={12} weight="bold" />
          </button>

          {/* Location Dropdown */}
          {showCityDropdown && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 rounded-2xl bg-[#1c1c20] border border-white/15 p-1.5 shadow-2xl text-left z-40">
              {cities.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => {
                    setSelectedCity(city);
                    setShowCityDropdown(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    selectedCity === city ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: User Profile Avatar & Gate Host Link */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenHostPortal}
            title="Host Gate Terminal"
            className="text-[10px] font-mono text-zinc-400 hover:text-white uppercase tracking-wider border-b border-zinc-700 pb-0.5 hidden sm:inline cursor-pointer mr-1"
          >
            Hosts
          </button>

          {currentUser ? (
            <button
              type="button"
              onClick={onOpenProfile}
              className="h-10 px-3 rounded-full bg-[#1F1D2C] hover:bg-[#282638] border border-white/15 flex items-center gap-2 text-white transition-all cursor-pointer shadow-md"
            >
              <div className="w-6 h-6 rounded-full bg-[#FF521B] text-black font-black text-[11px] flex items-center justify-center">
                {currentUser.name?.[0]?.toUpperCase() || 'R'}
              </div>
              <span className="text-xs font-semibold max-w-[80px] truncate hidden sm:inline">
                {currentUser.name?.split(' ')[0] || 'Profile'}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="h-10 px-3.5 rounded-full bg-white hover:bg-zinc-200 text-black font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
            >
              <User size={15} weight="bold" />
              <span>Login</span>
            </button>
          )}
        </div>
      </header>

      {/* HERO SPOTLIGHT BANNER: A LITTLE HALLOWEEN AFFAIR */}
      <div className="relative rounded-3xl overflow-hidden border border-white/15 bg-zinc-950 shadow-2xl group">
        <div 
          onClick={() => onSelectEvent(halloweenEvent)}
          className="relative h-[380px] sm:h-[420px] w-full cursor-pointer"
        >
          <img 
            src={halloweenEvent.coverImage} 
            alt={halloweenEvent.title}
            className="w-full h-full object-cover object-center filter contrast-[1.05] transition-transform duration-700 group-hover:scale-[1.02]" 
          />
          {/* Vignette Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/40" />

          {/* Top Tag Badges */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <span className="px-3 py-1 rounded-full bg-[#FF521B]/90 backdrop-blur-md text-black text-[10px] font-mono font-black uppercase tracking-wider shadow-lg flex items-center gap-1">
              <span>🎃</span>
              <span>Exclusive Spotlight · Chennai</span>
            </span>

            {/* Bookmark button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark(halloweenEvent.id);
              }}
              className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-transform active:scale-90"
            >
              <BookmarkSimple 
                size={18} 
                weight={bookmarkedIds.includes(halloweenEvent.id) ? "fill" : "regular"} 
                className={bookmarkedIds.includes(halloweenEvent.id) ? "text-[#FFA947]" : "text-white"}
              />
            </button>
          </div>

          {/* Bottom Content & Direct Action */}
          <div className="absolute bottom-5 left-4 right-4 text-center z-10 space-y-3">
            
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md">
                {halloweenEvent.title}
              </h1>
              <p className="text-xs text-zinc-300 font-sans max-w-xs mx-auto drop-shadow">
                {halloweenEvent.subtitle}
              </p>
              <div className="flex items-center justify-center gap-2 pt-1 text-[11px] font-mono text-[#FFA947]">
                <span>Fri, 23 Oct · 7:00 PM</span>
                <span>•</span>
                <span className="text-white font-bold">₹1,500 Onwards</span>
              </div>
            </div>

            {/* Direct Book Tickets Pill CTA */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onBookEvent) onBookEvent(halloweenEvent);
              }}
              className="py-3 px-8 rounded-full bg-white hover:bg-zinc-200 text-black font-extrabold text-xs uppercase tracking-wider inline-flex items-center gap-1.5 shadow-2xl transition-transform active:scale-95 cursor-pointer"
            >
              <span>Book tickets</span>
              <CaretRight size={14} weight="bold" />
            </button>
          </div>

        </div>
      </div>

      {/* CURATED HIGHLIGHTS: SPOTLIGHT EXPERIENCE CARD */}
      <section className="space-y-3 text-left">
        <div className="flex items-center justify-between">
          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Curated Tonight in Chennai
          </h3>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold uppercase tracking-wider">
            Guestlist Open
          </span>
        </div>

        <div 
          onClick={() => onSelectEvent(halloweenEvent)}
          className="p-5 rounded-3xl bg-gradient-to-br from-[#1C182A] via-[#14121F] to-[#0D0C14] border border-white/15 space-y-4 cursor-pointer group shadow-xl transition-all hover:border-white/30"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0 flex-1">
              <span className="text-xs font-bold text-[#FFA947] uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Moon size={14} weight="fill" />
                Secret House Party · South Sanctuary
              </span>
              <h4 className="text-xl font-black text-white group-hover:text-zinc-100 transition-colors">
                a little halloween affair
              </h4>
              <p className="text-xs text-zinc-300 leading-relaxed font-sans pt-0.5">
                Candlelight, costumes, live sound, bespoke mixology & house punch. Strictly non-transferable admission bound to legal name.
              </p>
            </div>
          </div>

          {/* Key Inclusions Pills */}
          <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-300 font-mono">
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-2">
              <Martini size={15} className="text-[#FFA947] shrink-0" />
              <span className="truncate">Open Craft Cocktail Bar</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-2">
              <ShieldCheck size={15} className="text-emerald-400 shrink-0" />
              <span className="truncate">21+ Govt Photo ID Entry</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-1 flex items-center justify-between border-t border-white/10">
            <div>
              <span className="text-[10px] text-zinc-400 font-mono uppercase block">Admission</span>
              <span className="text-base font-extrabold text-white font-mono">₹1,500</span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onBookEvent) onBookEvent(halloweenEvent);
              }}
              className="py-2.5 px-6 rounded-full bg-[#FF521B] hover:bg-[#ff6420] text-black font-extrabold text-xs uppercase tracking-wider transition-transform active:scale-95 cursor-pointer shadow-lg"
            >
              Book Pass →
            </button>
          </div>
        </div>
      </section>

      {/* MORE EVENTS COMING SOON (REPLACED OTHER EVENTS AS REQUESTED) */}
      <section className="space-y-4 text-left pt-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Sparkle size={16} weight="fill" className="text-[#FFA947]" />
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              More Experiences Coming Soon
            </h3>
          </div>
          <p className="text-xs text-zinc-400 font-sans">
            We drop secret dining pop-ups, house salons, and late-night social spots across Chennai every week.
          </p>
        </div>

        {/* Coming Soon Teaser Grid */}
        <div className="space-y-3.5">
          {COMING_SOON_EVENTS.map((item) => {
            const isNotified = notifiedEvents.includes(item.id);
            return (
              <div
                key={item.id}
                className="relative rounded-2xl overflow-hidden bg-[#13121C] border border-white/10 hover:border-white/20 transition-all p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 shadow-md group"
              >
                {/* Left Thumbnail + Details */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-black/60 shrink-0 border border-white/10">
                    <img 
                      src={item.coverImage} 
                      alt={item.title} 
                      className="w-full h-full object-cover filter contrast-[1.05] group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/30" />
                  </div>

                  <div className="space-y-1 min-w-0 flex-1 text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 text-[9px] font-mono font-bold uppercase tracking-wider">
                        {item.category}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#FFA947]/15 text-[#FFA947] border border-[#FFA947]/30 text-[9px] font-mono font-bold uppercase tracking-wider">
                        {item.badge}
                      </span>
                    </div>

                    <h4 className="text-sm sm:text-base font-bold text-white truncate">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-zinc-400 truncate font-sans">
                      {item.venue} · {item.dateLabel}
                    </p>
                  </div>
                </div>

                {/* Right Notify Me Button */}
                <div className="shrink-0 w-full sm:w-auto text-right">
                  <button
                    type="button"
                    onClick={() => handleNotifyMe(item.id, item.title)}
                    className={`w-full sm:w-auto py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                      isNotified 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                        : 'bg-white/10 hover:bg-white/15 text-white border border-white/15'
                    }`}
                  >
                    <Bell size={13} weight={isNotified ? 'fill' : 'bold'} />
                    <span>{isNotified ? 'Notified ✓' : 'Notify Me'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="text-center text-xs text-zinc-500 pt-8 pb-4 font-mono space-y-1">
        <p className="font-semibold text-zinc-400">BookOurSpot · bookourspot.com</p>
        <p className="text-[10px] text-zinc-600">Curated Events, Dining & Nightlife in Chennai</p>
      </footer>

    </div>
  );
}
