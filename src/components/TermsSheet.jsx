import React from 'react';
import { createPortal } from 'react-dom';
import { X } from '@phosphor-icons/react';

export default function TermsSheet({ isOpen, onClose }) {
  if (!isOpen) return null;

  const terms = [
    'Please carry a valid ID proof along with you.',
    'All ticket purchases are final and non-refundable. If an event is cancelled, you will receive a full refund. If an event is rescheduled, you may choose to retain your ticket for the rescheduled date or opt for a refund.',
    'Security procedures, including frisking remain the right of the management.',
    'No dangerous or potentially hazardous objects including but not limited to weapons, knives, guns, fireworks, helmets, lazer devices, bottles, musical instruments will be allowed in the venue and may be ejected with or without the owner from the venue',
    'The sponsors/performers/organizers are not responsible for any injury or damage occurring due to the event. Any claims regarding the same would be settled in courts in Mumbai.',
    'People in an inebriated state may not be allowed entry.',
    'Organizers hold the right to deny late entry to the event.',
    'Venue rules apply.'
  ];

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg mx-auto bg-[#141416] border-t border-white/10 rounded-t-[32px] p-6 pb-10 text-[#F3EFE0] shadow-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (IMG_4060.PNG) */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            Terms and conditions
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close terms"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Terms Bullet Points with diamond markers (IMG_4060.PNG) */}
        <div className="flex-1 overflow-y-auto py-5 space-y-4 text-left pr-1">
          {terms.map((term, index) => (
            <div key={index} className="flex items-start gap-3.5">
              <span className="text-zinc-500 text-xs mt-1 shrink-0 select-none">◆</span>
              <p className="text-sm text-zinc-300 leading-relaxed font-sans">
                {term}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
