import React, { useState } from 'react';
import {
  ArrowDown, ArrowRight, Bookmark, CalendarDays, Check, ChevronDown, Clock3,
  Compass, MapPin, Search, ShieldCheck, Ticket, UserRound
} from 'lucide-react';
import { COMING_SOON_EVENTS } from '../data/eventsData';

const formats = ['All', 'Nightlife', 'Food & drink', 'Live music', 'Motorsport', 'Experiences'];

function EventCard({ item, onSelectEvent, onBookEvent, isSaved, onToggleBookmark }) {
  const isLive = item.id === 'halloween-affair';
  const title = item.title;
  const location = isLive ? item.venue?.shortName : item.venue;
  const date = isLive ? 'Fri, 23 Oct · 7 PM till late' : item.dateLabel;
  const image = item.coverImage;

  return (
    <article className={`spot-card ${isLive ? 'spot-card-live' : ''}`}>
      <button className="spot-card-image" onClick={() => onSelectEvent(item)} aria-label={`View ${title}`}>
        <img src={image} alt="" loading={isLive ? 'eager' : 'lazy'} />
        <span className={`spot-card-badge ${isLive ? 'badge-live' : ''}`}>
          {isLive ? <><span className="live-dot" /> Booking open</> : 'Coming soon'}
        </span>
        <span className="spot-card-category">{item.category}</span>
      </button>
      <div className="spot-card-info">
        <button className="spot-card-title" onClick={() => onSelectEvent(item)}>{title}</button>
        <p className="spot-card-subtitle">{item.subtitle}</p>
        {item.priceLabel && <p className="spot-card-price">{item.priceLabel}</p>}
        <div className="spot-card-meta"><span><CalendarDays size={15} />{date || 'Date to be announced'}</span><span><MapPin size={15} />{location || 'Location to be announced'}</span></div>
        <div className="spot-card-actions">
          <button
            className="spot-save"
            onClick={() => onToggleBookmark(item.id)}
            aria-label={isSaved ? 'Remove from saved events' : 'Save event'}
            title={isSaved ? 'Saved' : 'Save event'}
          ><Bookmark size={17} fill={isSaved ? 'currentColor' : 'none'} />{isSaved ? 'Saved' : 'Save'}</button>
          {isLive ? (
            <button className="spot-button spot-button-primary" onClick={() => onBookEvent(item)}>
              Book tickets <ArrowRight size={16} />
            </button>
          ) : (
            <button className="spot-button spot-button-muted" disabled title="Bookings are not open yet">
              Booking unavailable right now
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function EventFeed({
  events, onSelectEvent, onBookEvent, onOpenAuth, onOpenProfile, onOpenSearch,
  currentUser, bookmarkedIds = [], onToggleBookmark
}) {
  const selectedCity = 'Chennai';
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('All');
  const halloweenEvent = events.find((event) => event.id === 'halloween-affair') || events[0];
  const allEvents = [halloweenEvent, ...COMING_SOON_EVENTS];
  const eventTypes = {
    'karims-leela': 'Food & drink',
    'racing-league': 'Motorsport',
    'madras-driven': 'Experiences',
    'rolling-loud': 'Live music',
    'strangers-meetup': 'Experiences'
  };
  const filteredEvents = allEvents.filter((event) => selectedFormat === 'All' ||
    (event.id === 'halloween-affair' ? selectedFormat === 'Nightlife' : eventTypes[event.id] === selectedFormat));

  return (
    <div className="bos-page">
      <header className="bos-header">
        <a className="bos-wordmark" href="/" aria-label="BookOutSpot home"><span className="wordmark-icon">b</span><span>BookOut<span className="wordmark-accent">Spot</span></span></a>
        <div className="bos-header-center">
          <button className="city-trigger" aria-haspopup="menu" aria-expanded={showCityDropdown} onClick={() => setShowCityDropdown((open) => !open)}>
            <MapPin size={16} /> <span>{selectedCity}</span><ChevronDown size={15} />
          </button>
          {showCityDropdown && <div className="city-menu" role="menu"><button role="menuitem" onClick={() => setShowCityDropdown(false)}>{selectedCity}<Check size={15} /></button><p className="city-menu-note">More cities coming soon</p></div>}
        </div>
        <div className="bos-header-actions">
          {currentUser ? <button className="account-button" onClick={onOpenProfile}><span className="account-avatar">{currentUser.name?.[0]?.toUpperCase() || <UserRound size={17} />}</span><span>Account</span></button> : <button className="sign-in-button" onClick={onOpenAuth}><UserRound size={16} /> Sign in</button>}
        </div>
      </header>

      <main>
        <section className="bos-intro">
          <div className="intro-copy"><span className="eyebrow"><Compass size={14} /> A good night starts here</span><h1>Make room<br /><span>for a story.</span></h1><p>Find the nights, tables and little adventures worth leaving home for.</p></div>
          <div className="intro-note"><span>IN YOUR CITY</span><strong>{selectedCity}</strong><button onClick={() => setShowCityDropdown(true)}>Change city <ArrowDown size={14} /></button></div>
        </section>

        <section className="spotlight-section" aria-label="Featured event">
          <div className="section-kicker"><span className="eyebrow">THE SPOTLIGHT</span><span className="section-index">01 / FEATURED</span></div>
          <article className="spotlight-card">
            <button className="spotlight-open" onClick={() => onSelectEvent(halloweenEvent)} aria-label={`View ${halloweenEvent.title}`}>
              <img src={halloweenEvent.coverImage} alt="A little Halloween affair poster with date, location details, price and dress code" />
            </button>
            <div className="spotlight-copy">
              <div className="spotlight-copy-top"><span className="spotlight-label"><span className="live-dot" /> HALLOWEEN · CHENNAI</span><button className="spotlight-save" aria-label={bookmarkedIds.includes(halloweenEvent.id) ? 'Remove from saved events' : 'Save event'} onClick={() => onToggleBookmark(halloweenEvent.id)}><Bookmark size={17} fill={bookmarkedIds.includes(halloweenEvent.id) ? 'currentColor' : 'none'} /></button></div>
              <span className="spotlight-overline">ONE NIGHT · FRI, 23 OCT</span>
              <h2 className="spotlight-title">A little Halloween affair<span className="spotlight-period">.</span></h2>
              <p className="spotlight-description">A house party at a secret spooky location. Dress spooky, stylish &amp; a little dramatic.</p>
              <div className="spotlight-bottom"><span className="spotlight-facts"><span><CalendarDays size={15} /> Fri, 23 Oct</span><span><Clock3 size={15} /> 7 PM till late</span><span>₹1,500 per person</span></span><button className="spotlight-cta" onClick={() => onBookEvent(halloweenEvent)}>Book tickets <ArrowRight size={17} /></button></div>
            </div>
          </article>
          <div className="spotlight-footnote"><span><ShieldCheck size={15} /> Event details shown as provided by the organiser</span><button onClick={() => onSelectEvent(halloweenEvent)}>Event details <ArrowRight size={14} /></button></div>
        </section>

        <section className="discover-section" id="events">
          <div className="discover-heading"><div><span className="eyebrow">GOOD THINGS AROUND TOWN</span><h2>Find your kind of out.</h2><p>Small plans, big nights, and everything in between.</p></div><button className="discover-search" onClick={onOpenSearch}><Search size={17} /> Explore events</button></div>
          <div className="format-row" role="group" aria-label="Filter events">{formats.map((format) => <button key={format} aria-pressed={selectedFormat === format} className={selectedFormat === format ? 'format-chip active' : 'format-chip'} onClick={() => setSelectedFormat(format)}>{format}</button>)}</div>
          <div className="event-grid" id="event-grid">
            {filteredEvents.map((event) => <EventCard key={event.id} item={event} onSelectEvent={onSelectEvent} onBookEvent={onBookEvent} isSaved={bookmarkedIds.includes(event.id)} onToggleBookmark={onToggleBookmark} />)}
          </div>
        </section>

        <section className="bos-bottom-note"><span className="bottom-note-number">02</span><div><span className="eyebrow">YOUR NEXT FAVOURITE MEMORY</span><h2>Go where the good<br />stories happen.</h2></div><span className="bottom-note-star">✳</span></section>
        <footer className="bos-footer"><a className="bos-wordmark" href="/"><span className="wordmark-icon">b</span><span>BookOut<span className="wordmark-accent">Spot</span></span></a><span>Good plans, found. · Chennai</span><a href="mailto:hello@bookourspot.com">Get in touch <ArrowRight size={14} /></a></footer>
      </main>
    </div>
  );
}
