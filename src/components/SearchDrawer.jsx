import React, { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpRight, Clock3, MapPin, Search, Sparkles, X } from 'lucide-react';
import useModalAccessibility from '../hooks/useModalAccessibility';

export default function SearchDrawer({ isOpen, onClose, events = [], onSelectEvent }) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All plans');
  const dialogRef = useRef(null);

  const categories = useMemo(() => ['All plans', ...new Set(events.map((event) => event.category).filter(Boolean))], [events]);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return events.filter((event) => {
      const matchesCategory = selectedCategory === 'All plans' || event.category === selectedCategory;
      const haystack = [event.title, event.subtitle, event.venue?.name, event.venue?.shortName, ...(event.tags || [])].filter(Boolean).join(' ').toLowerCase();
      return matchesCategory && (!term || haystack.includes(term));
    });
  }, [events, query, selectedCategory]);

  useModalAccessibility(isOpen, dialogRef, onClose);

  if (!isOpen) return null;
  return createPortal(
    <div className="bos-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={dialogRef} tabIndex={-1} className="bos-sheet bos-search-sheet" role="dialog" aria-modal="true" aria-labelledby="bos-search-title">
        <div className="bos-sheet-grab" />
        <header className="bos-sheet-heading">
          <div><span className="bos-modal-kicker"><Sparkles size={13} /> FIND YOUR NEXT PLAN</span><h2 id="bos-search-title">Search the city</h2><p>Discover events, places and nights worth going out for.</p></div>
          <button type="button" className="bos-icon-button" onClick={onClose} aria-label="Close search"><X size={19} /></button>
        </header>
        <label className="bos-search-field"><Search size={19} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try Halloween, dining, live music…" aria-label="Search events" /></label>
        <div className="bos-filter-row" role="group" aria-label="Filter by event category">
          {categories.map((category) => <button key={category} type="button" aria-pressed={selectedCategory === category} onClick={() => setSelectedCategory(category)} className={selectedCategory === category ? 'bos-filter-chip active' : 'bos-filter-chip'}>{category}</button>)}
        </div>
        <div className="bos-search-results" aria-live="polite">
          <div className="bos-results-label">{query ? `${filtered.length} MATCHING PLANS` : 'PICKED FOR YOU'}</div>
          {filtered.length ? filtered.map((event) => <button className="bos-search-result" key={event.id} type="button" onClick={() => { onSelectEvent(event); onClose(); }}>
            <img src={event.thumbnail || event.coverImage} alt="" />
            <span className="bos-result-copy"><strong>{event.title}</strong><span>{event.subtitle}</span><small><MapPin size={12} /> {event.venue?.shortName || event.venue?.name || event.venue}</small></span>
            <span className="bos-result-action">{event.isBookable ? <span className="bos-live-pill">BOOK NOW</span> : <span className="bos-soon-pill">BOOKING UNAVAILABLE</span>}<ArrowUpRight size={16} /></span>
          </button>) : <div className="bos-search-empty"><Search size={27} /><strong>No plans found</strong><span>Try another event, category or venue.</span></div>}
        </div>
        <footer className="bos-search-footer"><Clock3 size={13} /> New plans are added as organisers confirm availability.</footer>
      </section>
    </div>, document.body
  );
}
