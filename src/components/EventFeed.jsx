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
  Ticket
} from '@phosphor-icons/react';

export default function EventFeed({
  events,
  onSelectEvent,
  onBookEvent,
  onOpenAuth,
  onOpenHostPortal,
  currentUser,
  bookmarkedIds,
  onToggleBookmark
}) {
  const [activeFilter, setActiveFilter] = useState('Tomorrow'); // 'Tomorrow' | 'This weekend' | 'All'
  const [selectedCity, setSelectedCity] = useState('CHENNAI · SOUTH');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);

  const cities = ['CHENNAI · SOUTH', 'BANGALORE · INDIRANAGAR', 'MUMBAI · BANDRA'];

  // Marquee events for top hero carousel
  const heroEvents = events.filter(e => e.isFeatured);
  const currentHero = heroEvents[heroIndex] || events[0];

  const filteredEvents = events.filter(e => {
    if (activeFilter === 'All') return true;
    return e.filterBucket === activeFilter;
  });

  return (
    <div className="w-full max-w-lg mx-auto pb-28 pt-2 px-4 sm:px-5 space-y-6 text-[#F3EFE0] font-sans">
      
      {/* TOP BAR (1:1 with IMG_4050.PNG) */}
      <header className="flex items-center justify-between py-2 relative z-30">
        
        {/* Left Home circular button */}
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="w-11 h-11 rounded-full bg-[#18181b] hover:bg-[#222227] border border-white/10 flex items-center justify-center text-white transition-colors cursor-pointer"
        >
          <House size={20} weight="fill" />
        </button>

        {/* Center: Title & Location Switcher (IMG_4050.PNG) */}
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

        {/* Right: User Profile Avatar (IMG_4050.PNG) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenHostPortal}
            title="Host Gate Terminal"
            className="text-[10px] font-mono text-zinc-400 hover:text-white uppercase tracking-wider border-b border-zinc-700 pb-0.5 hidden sm:inline cursor-pointer mr-1"
          >
            Hosts
          </button>

          <button
            type="button"
            onClick={onOpenAuth}
            className="w-11 h-11 rounded-full bg-[#8E8EA0] hover:opacity-90 flex items-center justify-center text-white transition-opacity cursor-pointer overflow-hidden shadow-sm"
          >
            {currentUser ? (
              <span className="font-bold text-xs text-black">
                {currentUser.name?.[0]?.toUpperCase() || 'U'}
              </span>
            ) : (
              <User size={22} weight="fill" className="text-zinc-800" />
            )}
          </button>
        </div>
      </header>

      {/* HERO FEATURED BANNER CAROUSEL (1:1 with IMG_4050.PNG) */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-zinc-950 shadow-2xl group">
        <div 
          onClick={() => onSelectEvent(currentHero)}
          className="relative h-[360px] sm:h-[400px] w-full cursor-pointer"
        >
          <img 
            src={currentHero.coverImage} 
            alt={currentHero.title}
            className="w-full h-full object-cover object-center filter contrast-[1.05] transition-transform duration-700 group-hover:scale-[1.02]"
          />
          {/* Subtle bottom gradient to highlight the button */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

          {/* Centered White Pill CTA button & Dots (IMG_4050.PNG) */}
          <div className="absolute bottom-5 left-0 right-0 flex flex-col items-center gap-2.5 z-10">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onBookEvent) {
                  onBookEvent(currentHero);
                } else {
                  onSelectEvent(currentHero);
                }
              }}
              className="py-2.5 px-6 rounded-full bg-white hover:bg-zinc-200 text-black font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-2xl transition-transform active:scale-95 cursor-pointer"
            >
              <span>Book tickets</span>
              <CaretRight size={14} weight="bold" />
            </button>

            {/* Pagination dots (― · · ·) */}
            <div className="flex items-center gap-1.5 pt-0.5">
              {heroEvents.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setHeroIndex(i);
                  }}
                  className={`h-1 rounded-full transition-all cursor-pointer ${
                    heroIndex === i ? 'w-5 bg-white' : 'w-1.5 bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FEATURED EVENTS HORIZONTAL CAROUSEL (1:1 with IMG_4050.PNG) */}
      <section className="space-y-3.5 text-left">
        <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Featured events
        </h3>

        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 pt-1 -mx-4 px-4">
          {events.map((e) => {
            const isBookmarked = bookmarkedIds.includes(e.id);
            return (
              <div
                key={e.id}
                onClick={() => onSelectEvent(e)}
                className="w-64 sm:w-72 shrink-0 rounded-2xl overflow-hidden bg-transparent cursor-pointer group flex flex-col"
              >
                {/* Poster Frame (3:4 ratio) */}
                <div className="relative h-72 sm:h-80 w-full rounded-2xl overflow-hidden bg-zinc-950 border border-white/10 shadow-lg">
                  <img 
                    src={e.thumbnail || e.coverImage} 
                    alt={e.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                  {/* Bookmark Button in Top Right (IMG_4050.PNG) */}
                  <button
                    type="button"
                    onClick={(evt) => {
                      evt.stopPropagation();
                      onToggleBookmark(e.id);
                    }}
                    className={`absolute top-3 right-3 w-9 h-9 rounded-xl backdrop-blur-md flex items-center justify-center transition-all ${
                      isBookmarked 
                        ? 'bg-[#FF521B] text-black shadow-md' 
                        : 'bg-black/50 hover:bg-black/80 text-white border border-white/20'
                    }`}
                  >
                    <BookmarkSimple size={18} weight={isBookmarked ? 'fill' : 'bold'} />
                  </button>

                  {/* Pricing Badge */}
                  <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm border border-white/15 text-[11px] font-mono font-bold text-white">
                    {e.priceLabel}
                  </div>
                </div>

                {/* Card Details Outside/Below Poster (IMG_4050.PNG) */}
                <div className="pt-3 space-y-1 text-left">
                  {/* Pink Location Pin (IMG_4050.PNG) */}
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#E23670] truncate uppercase tracking-wider">
                    <MapPin size={13} weight="fill" />
                    <span className="truncate">{e.venue?.shortName || e.venue?.name}</span>
                  </div>

                  <h4 className="text-base font-bold text-white truncate">
                    {e.title}
                  </h4>

                  <p className="text-xs text-zinc-400 font-medium truncate">
                    {e.dateSubtitle || e.dates}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FIND SOMETHING FOR (1:1 with IMG_4051.PNG) */}
      <section className="space-y-4 text-left pt-2">
        <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Find something for
        </h3>

        {/* Filter Chips Pills (IMG_4051.PNG) */}
        <div className="flex items-center gap-2 text-sm font-semibold">
          <button
            type="button"
            onClick={() => setActiveFilter('Tomorrow')}
            className={`py-2 px-5 rounded-full transition-all cursor-pointer ${
              activeFilter === 'Tomorrow'
                ? 'bg-[#252438] text-white border border-white/20 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Tomorrow
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('This weekend')}
            className={`py-2 px-5 rounded-full transition-all cursor-pointer ${
              activeFilter === 'This weekend'
                ? 'bg-[#252438] text-white border border-white/20 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            This weekend
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('All')}
            className={`py-2 px-4 rounded-full transition-all flex items-center gap-1 cursor-pointer ${
              activeFilter === 'All'
                ? 'bg-[#252438] text-white border border-white/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>Date</span>
            <CaretDown size={12} weight="bold" />
          </button>
        </div>

        {/* Horizontal Cards for Filter (IMG_4051.PNG) */}
        <div className="flex gap-3.5 overflow-x-auto no-scrollbar pb-2 pt-1 -mx-4 px-4">
          {filteredEvents.map((e) => (
            <div
              key={e.id}
              onClick={() => onSelectEvent(e)}
              className="w-48 sm:w-56 shrink-0 rounded-2xl overflow-hidden bg-[#14131F] border border-white/10 hover:border-white/25 transition-all cursor-pointer group shadow-md"
            >
              <div className="relative h-48 w-full overflow-hidden bg-zinc-950">
                <img 
                  src={e.thumbnail || e.coverImage} 
                  alt={e.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-left">
                  <h5 className="text-xs sm:text-sm font-bold text-white truncate">
                    {e.title}
                  </h5>
                  <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                    {e.priceLabel}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* More for Tomorrow Button (IMG_4051.PNG) */}
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={() => setActiveFilter(activeFilter === 'Tomorrow' ? 'All' : 'Tomorrow')}
            className="py-2.5 px-6 rounded-full bg-white hover:bg-zinc-200 text-black font-extrabold text-xs uppercase tracking-wider inline-flex items-center gap-1.5 shadow-lg transition-transform active:scale-95 cursor-pointer"
          >
            <span>More for {activeFilter}</span>
            <CaretRight size={14} weight="bold" />
          </button>
        </div>
      </section>

      {/* YOUR GO-TO PICKS (1:1 with IMG_4051.PNG) */}
      <section className="space-y-4 text-left pt-3">
        <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Your go-to picks
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Card 1: Nightlife & Halloween */}
          <div 
            onClick={() => onSelectEvent(events.find(e => e.id === 'halloween-affair') || events[0])}
            className="relative h-64 rounded-3xl overflow-hidden border border-white/15 bg-gradient-to-br from-[#FF521B]/40 to-[#2A0845] p-5 flex flex-col justify-between cursor-pointer group shadow-xl"
          >
            <div className="relative z-10 flex items-center justify-between">
              <span className="text-xs font-bold text-[#FFA947] uppercase tracking-wider flex items-center gap-1">
                <Moon size={14} weight="fill" />
                Nightlife
              </span>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                <CaretRight size={16} weight="bold" />
              </div>
            </div>

            <div className="relative z-10 space-y-1">
              <h4 className="text-2xl font-black text-white leading-tight">
                a little halloween affair
              </h4>
              <p className="text-xs text-zinc-300">
                Friday, 23 Oct · Secret House Party · ₹1,500
              </p>
            </div>
          </div>

          {/* Card 2: Music Festivals */}
          <div 
            onClick={() => onSelectEvent(events.find(e => e.id === 'rolling-loud') || events[1])}
            className="relative h-64 rounded-3xl overflow-hidden border border-white/15 bg-gradient-to-br from-[#3B1F8C] to-[#0A071E] p-5 flex flex-col justify-between cursor-pointer group shadow-xl"
          >
            <div className="relative z-10 flex items-center justify-between">
              <span className="text-xs font-bold text-[#D3C7FF] uppercase tracking-wider flex items-center gap-1">
                <MusicNotes size={14} weight="fill" />
                Live Music
              </span>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                <CaretRight size={16} weight="bold" />
              </div>
            </div>

            <div className="relative z-10 space-y-1">
              <h4 className="text-2xl font-black text-white leading-tight">
                Rolling Loud India
              </h4>
              <p className="text-xs text-zinc-300">
                Madras Arena · From ₹3,999
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-xs text-zinc-500 pt-6 pb-4 font-mono">
        <p className="font-semibold text-zinc-400">BookOurSpot · bookourspot.com</p>
        <p className="text-[10px] text-zinc-600 mt-1">Curated Events, Dining & Nightlife Platform</p>
      </footer>

    </div>
  );
}
