import React, { useState, useEffect } from 'react';
import { 
  CaretLeft, 
  BookmarkSimple, 
  ShareNetwork, 
  Storefront, 
  CalendarCheck, 
  CaretRight, 
  FileText,
  Ticket
} from '@phosphor-icons/react';
import ShareSheet from './ShareSheet';
import TierSelectionModal from './TierSelectionModal';
import TermsSheet from './TermsSheet';

export default function EventDetail({
  event,
  onBack,
  onRequestBooking,
  initialOpenBooking = false,
  isBookmarked,
  onToggleBookmark,
  onBookingSuccess
}) {
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isTierSelectionOpen, setIsTierSelectionOpen] = useState(() => {
    if (initialOpenBooking) return true;
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('step') === 'tier' || params.get('step') === 'checkout';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (initialOpenBooking) {
      setIsTierSelectionOpen(true);
    }
  }, [initialOpenBooking]);

  const [selectedDate, setSelectedDate] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const dateId = params.get('date');
      if (dateId && event?.availableDates) {
        return event.availableDates.find(d => d.id === dateId) || event.availableDates[0];
      }
    } catch {}
    return event?.availableDates?.[0] || null;
  });
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [expandedAbout, setExpandedAbout] = useState(false);

  if (!event) return null;
  const isBookable = event.id === 'halloween-affair';

  const handleOpenBooking = () => {
    if (!isBookable) return;
    if (onRequestBooking) {
      onRequestBooking();
      return;
    }
    const defaultDate = selectedDate || event.availableDates?.[0] || {
      id: 'default',
      label: event.dates,
      priceLabel: event.priceLabel,
      timing: event.time
    };
    setSelectedDate(defaultDate);
    setIsTierSelectionOpen(true);
  };

  return (
    <div className="relative min-h-[100dvh] w-full max-w-full sm:max-w-lg mx-auto bg-[#08080C] text-[#F3EFE0] pb-28 font-sans antialiased overflow-x-hidden">
      
      {/* FULL BLEED TOP HERO POSTER ARTWORK (IMG_4053.PNG & IMG_4058.PNG) */}
      <div className="relative w-full h-[45vh] sm:h-[48vh] overflow-hidden bg-zinc-950">
        <img 
          src={event.coverImage} 
          alt={event.title}
          className="w-full h-full object-cover object-center filter contrast-[1.05]"
        />
        {/* Soft bottom vignette into dark background */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0C0B12] via-transparent to-black/40 pointer-events-none" />

        {/* TOP FLOATING CONTROLS (IMG_4053.PNG & IMG_4058.PNG) */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
          {/* Back Circular Button */}
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to events discovery"
            className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center transition-transform active:scale-95 cursor-pointer shadow-lg border border-white/10"
          >
            <CaretLeft size={20} weight="bold" />
          </button>

          {/* Right Action Buttons: Bookmark & Share */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleBookmark}
              aria-label="Save to hotlist"
              className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-lg border border-white/10 ${
                isBookmarked 
                  ? 'bg-[#FF521B] text-black shadow-md' 
                  : 'bg-black/50 hover:bg-black/70 text-white'
              }`}
            >
              <BookmarkSimple size={18} weight={isBookmarked ? 'fill' : 'bold'} />
            </button>

            <button
              type="button"
              onClick={() => setIsShareOpen(true)}
              aria-label="Share event"
              className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center transition-transform active:scale-95 cursor-pointer shadow-lg border border-white/10"
            >
              <ShareNetwork size={18} weight="bold" />
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM SHEET CONTENT OVERLAY (IMG_4053.PNG & IMG_4058.PNG) */}
      <div className="relative -mt-10 z-10 w-full max-w-full rounded-t-[32px] bg-[#0C0B12] border-t border-white/10 p-5 sm:p-6 space-y-6 shadow-2xl overflow-hidden box-border">
        
        {/* Category Pills & Titles */}
        <div className="space-y-2.5 text-left">
          {/* Pills row */}
          <div className="flex flex-wrap items-center gap-2">
            {(event.tags || [event.category]).map((tag, idx) => (
              <span 
                key={idx}
                className="px-3 py-1 rounded-full bg-[#1B1926] text-zinc-300 text-xs font-medium border border-white/5"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Event Title */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug break-words">
            {event.title}
          </h1>

          {/* Date & Time Subtitle */}
          <p className="text-xs sm:text-sm text-zinc-300 font-medium">
            {event.dateSubtitle || event.dates}
          </p>
        </div>

        {/* VENUE CARD (IMG_4053.PNG & IMG_4058.PNG) */}
        {event.venue && <div className="p-4 rounded-2xl bg-[#14131F] border border-white/10 flex items-center justify-between text-left">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center text-zinc-200 shrink-0">
              <Storefront size={22} weight="duotone" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-white truncate">
                {event.venue?.name || event.venue}
              </h4>
              {(event.venue?.rating || event.venue?.distance) && <p className="text-xs text-zinc-400 mt-0.5">
                {event.venue?.rating && <><span className="text-emerald-400 font-semibold">Rated {event.venue.rating}</span><span className="mx-1.5 text-zinc-600">|</span></>}
                {event.venue?.distance && <span>{event.venue.distance}</span>}
              </p>}
            </div>
          </div>
        </div>}

        {/* TIMELINE / SCHEDULE CARD (IMG_4054.PNG & IMG_4058.PNG) */}
        {event.timing && <div className="p-4 rounded-2xl bg-[#14131F] border border-white/10 flex items-center justify-between text-left">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center text-zinc-200 shrink-0">
              <CalendarCheck size={22} weight="duotone" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-white truncate">
                {event.timing.startsAt}
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5 truncate">
                {event.timing.scheduleSubtitle}
              </p>
            </div>
          </div>
        </div>}

        {/* ABOUT THE EVENT (IMG_4054.PNG) */}
        <div className="space-y-3 text-left">
          <h3 className="text-lg font-bold text-white tracking-tight">
            About the event
          </h3>
          <div className="text-sm text-zinc-300 leading-relaxed font-sans space-y-2">
            <p className={expandedAbout ? '' : 'line-clamp-3'}>
              {event.about || event.subtitle}
            </p>
            {event.about && <button
              type="button"
              onClick={() => setExpandedAbout(!expandedAbout)}
              className="text-xs font-bold text-[#FFA947] hover:underline cursor-pointer inline-flex items-center gap-1"
            >
              <span>{expandedAbout ? 'Read less' : 'Read more'}</span>
              <CaretRight size={12} weight="bold" />
            </button>}
          </div>
        </div>

        {/* EXPLORE THE AMBIENCE (IMG_4054.PNG) */}
        {event.gallery && event.gallery.length > 0 && (
          <div className="space-y-3 text-left">
            <h3 className="text-lg font-bold text-white tracking-tight">
              Explore the ambience
            </h3>
            <div className="w-full max-w-full min-w-0 flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
              {event.gallery.map((imgUrl, i) => (
                <div 
                  key={i}
                  className="w-56 h-36 rounded-2xl overflow-hidden shrink-0 border border-white/10 bg-zinc-900 shadow-md"
                >
                  <img 
                    src={imgUrl} 
                    alt={`${event.title} ambience ${i + 1}`} 
                    className="w-full h-full object-cover" 
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* THINGS TO KNOW (IMG_4061.PNG) */}
        {event.thingsToKnow?.length > 0 && <div className="space-y-3 text-left">
          <h3 className="text-lg font-bold text-white tracking-tight">
            Things to know
          </h3>
          <div className="p-4 rounded-2xl bg-[#14131F] border border-white/10 space-y-3.5">
            {event.thingsToKnow.map((item, index) => <div key={index} className="flex items-start gap-3 text-xs sm:text-sm text-zinc-200"><Ticket size={18} className="text-zinc-400 shrink-0 mt-0.5" weight="duotone" /><span>{item}</span></div>)}
          </div>
        </div>}

        {/* ORGANISED BY (IMG_4061.PNG) */}
        {event.organizer && <div className="space-y-3 text-left">
          <h3 className="text-lg font-bold text-white tracking-tight">
            Organised By
          </h3>
          <div className="p-5 rounded-3xl bg-[#14131F] border border-white/10 flex items-center justify-between gap-4">
            {/* Host Identity */}
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div className="w-14 h-14 rounded-full bg-[#3B1F8C] flex items-center justify-center font-bold text-white text-lg overflow-hidden border border-white/20 shrink-0 shadow-inner">
                {event.organizer?.avatar ? (
                  <img src={event.organizer.avatar} alt={event.organizer.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{event.organizer?.initials || event.organizer?.name?.split(/\s+/).map((part) => part[0]).join('').slice(0, 2) || '?'}</span>
                )}
              </div>
              <div className="min-w-0">
                <h4 className="text-sm sm:text-base font-extrabold text-white tracking-tight uppercase leading-snug truncate">
                  {event.organizer?.name}
                </h4>
                {event.organizer?.verified && <p className="text-[11px] text-zinc-400 mt-0.5">Verified host</p>}
              </div>
            </div>

            {/* Host Stats (IMG_4061.PNG) */}
            <div className="text-right space-y-1.5 font-sans border-l border-white/10 pl-4 shrink-0">
              {event.organizer?.likedRating && <div>
                <span className="font-extrabold text-white block text-sm">
                  {event.organizer.likedRating}
                </span>
                <span className="text-[10px] text-zinc-400 block">
                  {event.organizer.ratingsCount || 'Liked'}
                </span>
              </div>}
              {event.organizer?.hostedEvents && <div className="pt-1.5 border-t border-white/5">
                <span className="font-extrabold text-white block text-sm">
                  {event.organizer.hostedEvents}
                </span>
                <span className="text-[10px] text-zinc-400 block">Hosted events</span>
              </div>}
              {event.organizer?.hostingDuration && <div className="pt-1.5 border-t border-white/5">
                <span className="font-extrabold text-white block text-sm">
                  {event.organizer.hostingDuration}
                </span>
                <span className="text-[10px] text-zinc-400 block">Hosting</span>
              </div>}
            </div>
          </div>
        </div>}

        {/* MORE (IMG_4061.PNG) */}
        {event.terms?.length > 0 && <div className="space-y-3 text-left">
          <h3 className="text-lg font-bold text-white tracking-tight">
            More
          </h3>
          <button
            type="button"
            onClick={() => setIsTermsOpen(true)}
            className="w-full p-4.5 rounded-2xl bg-[#14131F] border border-white/10 flex items-center justify-between text-left hover:border-white/20 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <FileText size={20} className="text-zinc-400" />
              <span className="text-sm font-semibold text-white">Terms and conditions</span>
            </div>
            <CaretRight size={16} className="text-zinc-500" />
          </button>
        </div>}

      </div>

      {/* FLOATING STICKY BOTTOM BAR (IMG_4058.PNG & IMG_4061.PNG) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-4 flex justify-center pointer-events-none">
        <div className="w-full max-w-lg rounded-full bg-[#161522]/95 backdrop-blur-xl border border-white/15 p-2 px-5 flex items-center justify-between shadow-2xl pointer-events-auto">
          {/* Price */}
          <div className="text-left">
            <span className="text-sm sm:text-base font-semibold text-white">
              {isBookable ? (event.priceLabel || `₹${event.price}`) : 'Booking unavailable'}
            </span>
          </div>

          {/* Book tickets Pill Button (IMG_4061.PNG) */}
          <button
            type="button"
            onClick={handleOpenBooking}
            disabled={!isBookable}
            className={`py-3 px-7 rounded-full font-extrabold text-sm transition-transform shadow-xl ${isBookable ? 'bg-white hover:bg-zinc-200 text-black active:scale-95 cursor-pointer' : 'bg-white/10 text-zinc-400 cursor-not-allowed'}`}
          >
            {isBookable ? 'Book tickets' : 'Booking unavailable'}
          </button>
        </div>
      </div>

      {/* SHARE SHEET */}
      <ShareSheet
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        event={event}
        isBookmarked={isBookmarked}
        onToggleBookmark={onToggleBookmark}
      />

      {/* TICKET TIER SELECTION & GUEST CHECKOUT SCREEN */}
      {isBookable && <TierSelectionModal
        isOpen={isTierSelectionOpen}
        onClose={() => setIsTierSelectionOpen(false)}
        event={event}
        initialDate={selectedDate}
        onBookingSuccess={onBookingSuccess}
      />}

      {/* TERMS AND CONDITIONS BOTTOM SHEET */}
      {event.terms?.length > 0 && <TermsSheet
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
        terms={event.terms}
      />}

    </div>
  );
}
