import React, { useEffect, useState } from 'react';

export default function SplashScreen({ onDismiss }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onDismiss) onDismiss();
    }, 1800);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (!isVisible) return null;

  return (
    <div 
      onClick={() => { setIsVisible(false); if (onDismiss) onDismiss(); }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#431CB8] text-white cursor-pointer select-none transition-opacity duration-500 animate-in fade-in"
    >
      <div className="flex flex-col items-center space-y-4 px-6 text-center transform scale-100 sm:scale-105">
        {/* BookOurSpot Chunky Stylized Wordmark */}
        <div className="relative">
          <div className="w-16 h-16 rounded-3xl bg-white text-[#431CB8] flex items-center justify-center font-black text-3xl mx-auto mb-3 shadow-2xl">
            B
          </div>
          <div className="text-4xl sm:text-5xl font-black tracking-tight text-white font-sans drop-shadow-md">
            <span>BookOurSpot</span>
          </div>
          <div className="text-xs sm:text-sm font-extrabold tracking-[0.25em] text-[#D3C7FF] mt-1 uppercase">
            BOOKOURSPOT.COM
          </div>
        </div>

        <p className="text-xs text-[#D3C7FF]/80 font-medium tracking-wider pt-6">
          Curated Events, Dining & Nightlife
        </p>
      </div>

      <div className="absolute bottom-10 text-[11px] text-[#D3C7FF]/60 font-mono tracking-widest uppercase">
        Tap to Skip
      </div>
    </div>
  );
}
