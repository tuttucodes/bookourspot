import React, { useState, useEffect } from 'react';

export default function CountdownTimer() {
  // Target: Friday, 23 October, 19:00 IST
  // Calculate relative to current year/time
  const getEventDate = () => {
    const now = new Date();
    // Friday, Oct 23
    let target = new Date(now.getFullYear(), 9, 23, 19, 0, 0); // Month 9 is October (0-indexed)
    if (target.getTime() <= now.getTime()) {
      // If already passed this day or year, target this Friday or next Oct 23
      target = new Date(now.getTime() + 1000 * 60 * 60 * 42); // 42 hours countdown fallback demo
    }
    return target;
  };

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const target = getEventDate();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = target.getTime() - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const timeUnits = [
    { label: 'DAYS', value: String(timeLeft.days).padStart(2, '0') },
    { label: 'HOURS', value: String(timeLeft.hours).padStart(2, '0') },
    { label: 'MINUTES', value: String(timeLeft.minutes).padStart(2, '0') },
    { label: 'SECONDS', value: String(timeLeft.seconds).padStart(2, '0') },
  ];

  return (
    <div className="flex items-center gap-2 md:gap-3">
      {timeUnits.map((item, idx) => (
        <React.Fragment key={item.label}>
          <div className="flex flex-col items-center">
            <div className="w-13 h-14 md:w-16 md:h-16 rounded-xl bg-black/60 border border-white/10 backdrop-blur-md flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <span className="font-mono text-xl md:text-2xl font-semibold tracking-tight text-white shadow-sm">
                {item.value}
              </span>
            </div>
            <span className="text-[9px] md:text-[10px] tracking-widest font-mono text-zinc-400 mt-1.5 uppercase">
              {item.label}
            </span>
          </div>
          {idx < timeUnits.length - 1 && (
            <span className="text-[#FF5400] font-mono text-lg font-light mb-5 opacity-60 animate-pulse">
              :
            </span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
