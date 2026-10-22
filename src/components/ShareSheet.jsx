import React, { useState } from 'react';
import { 
  X, 
  BookmarkSimple, 
  LinkSimple, 
  ShareNetwork, 
  WhatsappLogo, 
  Check 
} from '@phosphor-icons/react';

export default function ShareSheet({ 
  isOpen, 
  onClose, 
  event,
  isBookmarked,
  onToggleBookmark 
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !event) return null;

  const handleCopy = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: `${event.title} — ${event.subtitle}`,
          url: window.location.href,
        });
      } catch {}
    } else {
      handleCopy();
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`Check out ${event.title} on BookOutSpot (bookourspot.com)!\n${event.dateSubtitle}\n${window.location.href}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg mx-auto bg-[#171724] border-t border-white/10 rounded-t-[32px] p-5 pb-8 text-[#F3EFE0] shadow-2xl animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3">
          <h3 className="text-xl font-bold text-white tracking-tight">
            Share event
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close share sheet"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Event Preview Card (1:1 with IMG_4055.PNG) */}
        <div className="mt-2 p-3 bg-white/[0.04] border border-white/10 rounded-2xl flex items-center gap-3.5">
          <img 
            src={event.thumbnail || event.coverImage} 
            alt={event.title}
            className="w-14 h-14 rounded-xl object-cover shrink-0 border border-white/10"
          />
          <div className="min-w-0 flex-1 text-left">
            <h4 className="text-sm font-bold text-white truncate">
              {event.title}
            </h4>
            <p className="text-xs text-zinc-400 truncate mt-0.5">
              Event • {event.dateSubtitle || event.dates}
            </p>
            <p className="text-[11px] text-zinc-500 truncate mt-0.5">
              {event.venue?.name || event.venue?.shortName}
            </p>
          </div>
        </div>

        {/* Action Buttons Row (1:1 with IMG_4055.PNG) */}
        <div className="mt-6 grid grid-cols-4 gap-3 text-center">
          
          {/* Save to Hotlist */}
          <button
            type="button"
            onClick={onToggleBookmark}
            className="flex flex-col items-center gap-2 group cursor-pointer"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
              isBookmarked 
                ? 'bg-[#FF521B] text-black shadow-lg shadow-[#FF521B]/30' 
                : 'bg-white/10 group-hover:bg-white/15 text-zinc-200'
            }`}>
              <BookmarkSimple size={24} weight={isBookmarked ? 'fill' : 'bold'} />
            </div>
            <span className="text-[11px] font-medium text-zinc-300 leading-tight">
              {isBookmarked ? 'In Hotlist' : 'Save to Hotlist'}
            </span>
          </button>

          {/* Copy link */}
          <button
            type="button"
            onClick={handleCopy}
            className="flex flex-col items-center gap-2 group cursor-pointer"
          >
            <div className="w-14 h-14 rounded-2xl bg-white/10 group-hover:bg-white/15 text-zinc-200 flex items-center justify-center transition-all">
              {copied ? (
                <Check size={24} weight="bold" className="text-emerald-400" />
              ) : (
                <LinkSimple size={24} weight="bold" />
              )}
            </div>
            <span className="text-[11px] font-medium text-zinc-300 leading-tight">
              {copied ? 'Copied!' : 'Copy link'}
            </span>
          </button>

          {/* Share */}
          <button
            type="button"
            onClick={handleNativeShare}
            className="flex flex-col items-center gap-2 group cursor-pointer"
          >
            <div className="w-14 h-14 rounded-2xl bg-white/10 group-hover:bg-white/15 text-zinc-200 flex items-center justify-center transition-all">
              <ShareNetwork size={24} weight="bold" />
            </div>
            <span className="text-[11px] font-medium text-zinc-300 leading-tight">
              Share
            </span>
          </button>

          {/* Chat / WhatsApp */}
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="flex flex-col items-center gap-2 group cursor-pointer"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] flex items-center justify-center transition-all hover:bg-[#25D366]/30">
              <WhatsappLogo size={26} weight="fill" />
            </div>
            <span className="text-[11px] font-medium text-zinc-300 leading-tight">
              Chat
            </span>
          </button>

        </div>
      </div>
    </div>
  );
}
