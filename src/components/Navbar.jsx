import React from 'react';
import { MicrophoneStage, MagnifyingGlass, Ticket } from '@phosphor-icons/react';

export default function Navbar({
  activeTab,
  onTabChange,
  ticketCount = 0
}) {
  return (
    <div className="fixed bottom-5 left-0 right-0 z-40 flex justify-center pointer-events-none px-4">
      <nav 
        aria-label="BookOurSpot Navigation"
        className="pointer-events-auto rounded-full bg-[#1A1A28]/95 backdrop-blur-xl border border-white/15 p-1.5 flex items-center gap-1 shadow-2xl shadow-black/80"
      >
        {/* Events / Home */}
        <button
          type="button"
          onClick={() => onTabChange('EVENTS')}
          className={`flex items-center gap-2 py-2 px-4 rounded-full text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'EVENTS'
              ? 'bg-[#2D2A40] text-white shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <MicrophoneStage size={18} weight={activeTab === 'EVENTS' ? 'fill' : 'regular'} />
          <span>Events</span>
        </button>

        {/* Search */}
        <button
          type="button"
          onClick={() => onTabChange('SEARCH')}
          className={`flex items-center gap-2 py-2 px-4 rounded-full text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'SEARCH'
              ? 'bg-[#2D2A40] text-white shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <MagnifyingGlass size={18} weight={activeTab === 'SEARCH' ? 'bold' : 'regular'} />
          <span>Search</span>
        </button>

        {/* My Passes Wallet */}
        <button
          type="button"
          onClick={() => onTabChange('PASSES')}
          className={`flex items-center gap-2 py-2 px-4 rounded-full text-xs font-bold transition-all cursor-pointer relative ${
            activeTab === 'PASSES'
              ? 'bg-[#2D2A40] text-white shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Ticket size={18} weight={activeTab === 'PASSES' ? 'fill' : 'regular'} />
          <span>Passes</span>
          {ticketCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#FF521B] text-black font-black text-[9px] flex items-center justify-center font-mono">
              {ticketCount}
            </span>
          )}
        </button>
      </nav>
    </div>
  );
}
