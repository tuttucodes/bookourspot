import React from 'react';
import { createPortal } from 'react-dom';
import { X } from '@phosphor-icons/react';

export default function DateModal({ 
  isOpen, 
  onClose, 
  event, 
  selectedDate, 
  onSelectDate 
}) {
  if (!isOpen || !event) return null;

  const dates = event.availableDates || [
    {
      id: 'default-1',
      label: event.dates || 'Today',
      priceLabel: `${event.priceLabel || '₹' + event.price} Onwards`,
      timing: event.time || 'Evening'
    }
  ];

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 box-border"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md mx-auto bg-[#141416] border-t border-white/10 rounded-t-[32px] p-5 pb-8 text-[#F3EFE0] shadow-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300 box-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (IMG_4059.PNG) */}
        <div className="flex items-center justify-between pb-3 shrink-0">
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            When would you like to visit?
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close date picker"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Date Options List (IMG_4059.PNG) */}
        <div className="flex-1 overflow-y-auto py-2 space-y-2.5 text-left">
          {dates.map((item) => {
            const isSelected = selectedDate?.id === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectDate(item);
                }}
                className={`w-full p-4 rounded-2xl border transition-all text-left flex items-center justify-between cursor-pointer active:scale-[0.99] box-border ${
                  isSelected 
                    ? 'bg-[#222226] border-white/30 shadow-lg shadow-white/5' 
                    : 'bg-[#222226] border-white/5 hover:border-white/20'
                }`}
              >
                <div>
                  <span className="text-sm sm:text-base font-bold text-white block">
                    {item.label}
                  </span>
                  {item.timing && (
                    <span className="text-xs text-zinc-400 font-medium mt-0.5 block">
                      {item.timing}
                    </span>
                  )}
                </div>
                <span className="text-xs sm:text-sm text-zinc-300 font-medium shrink-0 ml-2">
                  {item.priceLabel}
                </span>
              </button>
            );
          })}
        </div>

        {/* Footnote (IMG_4059.PNG) */}
        <div className="pt-4 text-left border-t border-white/5 mt-2">
          <p className="text-xs text-zinc-400 font-sans italic">
            {event.showFooterNote || `Shows start at ${event.time || 'scheduled hours'}`}
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
