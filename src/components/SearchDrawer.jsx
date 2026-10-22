import React, { useState } from 'react';
import { X, MagnifyingGlass, CaretRight, MapPin } from '@phosphor-icons/react';

export default function SearchDrawer({
  isOpen,
  onClose,
  events,
  onSelectEvent
}) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  if (!isOpen) return null;

  const categories = ['All', 'Nightlife', 'Dining', 'Music', 'Sports', 'Culture'];

  const filtered = events.filter(e => {
    const matchesCat = selectedCategory === 'All' || e.category === selectedCategory;
    const q = query.toLowerCase();
    const matchesText = !query || 
      e.title.toLowerCase().includes(q) ||
      e.subtitle.toLowerCase().includes(q) ||
      e.venue?.name.toLowerCase().includes(q) ||
      e.tags?.some(t => t.toLowerCase().includes(q));
    return matchesCat && matchesText;
  });

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg mx-auto bg-[#111019] border-t border-white/15 rounded-t-[32px] p-5 pb-8 text-[#F3EFE0] shadow-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-3" />

        {/* Top Header with Search input */}
        <div className="flex items-center gap-3 pb-3 border-b border-white/10 shrink-0">
          <div className="relative flex-1">
            <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search events, artists, venues…"
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white/10 border border-white/10 text-sm text-white placeholder-zinc-500 outline-none focus:border-[#FF521B] transition-colors"
            />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Categories Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-3 shrink-0">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-white text-black'
                  : 'bg-white/5 hover:bg-white/10 text-zinc-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 text-xs">
              No events found matching "{query}".
            </div>
          ) : (
            filtered.map((e) => (
              <div
                key={e.id}
                onClick={() => {
                  onSelectEvent(e);
                  onClose();
                }}
                className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 flex items-center gap-3.5 cursor-pointer transition-all text-left"
              >
                <img 
                  src={e.thumbnail || e.coverImage} 
                  alt={e.title}
                  className="w-14 h-14 rounded-xl object-cover shrink-0 border border-white/10" 
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-white truncate">
                    {e.title}
                  </h4>
                  <p className="text-xs text-zinc-400 truncate mt-0.5">
                    {e.dateSubtitle || e.dates}
                  </p>
                  <p className="text-[11px] text-[#FFA947] font-mono mt-0.5">
                    {e.priceLabel || `₹${e.price}`}
                  </p>
                </div>
                <CaretRight size={16} className="text-zinc-500 shrink-0" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
