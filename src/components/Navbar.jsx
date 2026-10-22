import React from 'react';
import { Compass, Search, Ticket, UserRound } from 'lucide-react';

export default function Navbar({ activeTab, onTabChange, ticketCount = 0, currentUser = null }) {
  const items = [
    { id: 'EVENTS', label: 'Discover', Icon: Compass },
    { id: 'SEARCH', label: 'Search', Icon: Search },
    { id: 'PASSES', label: 'Tickets', Icon: Ticket },
    { id: 'PROFILE', label: currentUser ? 'Account' : 'Sign in', Icon: UserRound }
  ];
  return (
    <div className="bos-app-nav-wrap">
      <nav className="bos-app-nav" aria-label="Main navigation">
        {items.map(({ id, label, Icon }) => (
          <button key={id} type="button" aria-current={activeTab === id ? 'page' : undefined} onClick={() => onTabChange(id)} className={activeTab === id ? 'bos-app-nav-item selected' : 'bos-app-nav-item'}>
            <span className="nav-icon-wrap"><Icon size={18} strokeWidth={activeTab === id ? 2.3 : 1.8} />{id === 'PASSES' && ticketCount > 0 && <i>{ticketCount > 99 ? '99+' : ticketCount}</i>}</span>
            {id === 'PASSES' && ticketCount > 0 && <span className="sr-only">{ticketCount} tickets</span>}
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
