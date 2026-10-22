import React, { useState, useEffect, lazy, Suspense } from 'react';
import EventFeed from './components/EventFeed';
import Navbar from './components/Navbar';
import { ALL_EVENTS, EVENTS_DATA } from './data/eventsData';
import { getCurrentUser } from './utils/authService';
import { firebaseAuth } from './utils/firebaseClient';
import { onAuthStateChanged } from 'firebase/auth';

const EventDetail = lazy(() => import('./components/EventDetail'));
const SearchDrawer = lazy(() => import('./components/SearchDrawer'));
const MyTicketsModal = lazy(() => import('./components/MyTicketsModal'));
const AuthModal = lazy(() => import('./components/AuthModal'));
const ProfileModal = lazy(() => import('./components/ProfileModal'));

export default function App() {
  const [activeTab, setActiveTab] = useState('EVENTS'); // 'EVENTS' | 'SEARCH' | 'PASSES' | 'PROFILE'
  const [initialOpenBooking, setInitialOpenBooking] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const eventId = params.get('event');
      if (eventId) {
        return ALL_EVENTS.find(e => e.id === eventId || e.slug === eventId) || null;
      }
    } catch {}
    return null;
  });

  useEffect(() => {
    const syncFromLocation = () => {
      const eventId = new URLSearchParams(window.location.search).get('event');
      setSelectedEvent(eventId ? ALL_EVENTS.find((event) => event.id === eventId || event.slug === eventId) || null : null);
    };
    window.addEventListener('popstate', syncFromLocation);
    return () => window.removeEventListener('popstate', syncFromLocation);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!currentUser || !firebaseAuth?.currentUser) {
      setTicketCount(0);
      return () => { cancelled = true; };
    }
    firebaseAuth.currentUser.getIdToken()
      .then((idToken) => fetch('/api/bookings', { headers: { Authorization: `Bearer ${idToken}` } }))
      .then(async (response) => {
        if (!response.ok) throw new Error('Booking count unavailable');
        return response.json();
      })
      .then((data) => {
        if (!cancelled) setTicketCount((data.bookings || []).reduce((count, booking) => count + (booking.tickets?.length || 0), 0));
      })
      .catch(() => { if (!cancelled) setTicketCount(0); });
    return () => { cancelled = true; };
  }, [currentUser?.id]);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMyTicketsOpen, setIsMyTicketsOpen] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('wallet') === '1' || params.get('passes') === '1';
    } catch {
      return false;
    }
  });
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [pendingBookingEvent, setPendingBookingEvent] = useState(null);
  const [pendingOpenTickets, setPendingOpenTickets] = useState(false);
  const [ticketCount, setTicketCount] = useState(0);
  
  // Bookmarked event IDs (Hotlist)
  const [bookmarkedIds, setBookmarkedIds] = useState(() => {
    try {
      const stored = localStorage.getItem('bookourspot_hotlist_v1');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const toggleBookmark = (eventId) => {
    setBookmarkedIds((prev) => {
      const updated = prev.includes(eventId)
        ? prev.filter((id) => id !== eventId)
        : [...prev, eventId];
      localStorage.setItem('bookourspot_hotlist_v1', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSelectEvent = (event, autoOpenBooking = false) => {
    const url = new URL(window.location.href);
    url.searchParams.set('event', event.id);
    url.searchParams.delete('step');
    window.history.pushState({}, '', url.toString());
    setSelectedEvent(event);
    setInitialOpenBooking(autoOpenBooking);
  };

  const handleBackToFeed = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('event');
    url.searchParams.delete('step');
    window.history.replaceState({}, '', url.toString());
    setSelectedEvent(null);
    setInitialOpenBooking(false);
  };

  const handleStartBooking = (event) => {
    if (!currentUser) {
      setPendingBookingEvent(event);
      setIsAuthOpen(true);
      return;
    }
    handleSelectEvent(event, true);
  };

  // Sync ticket count and user session
  useEffect(() => {
    const unsubscribeAuth = firebaseAuth
      ? onAuthStateChanged(firebaseAuth, () => getCurrentUser().then(user => setCurrentUser(user)))
      : undefined;
    const handleAuthChange = () => getCurrentUser().then(user => setCurrentUser(user));
    window.addEventListener('auth_state_changed', handleAuthChange);

    return () => {
      window.removeEventListener('auth_state_changed', handleAuthChange);
      unsubscribeAuth?.();
    };
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'EVENTS') {
      setSelectedEvent(null);
      setInitialOpenBooking(false);
    } else if (tab === 'SEARCH') {
      setIsSearchOpen(true);
    } else if (tab === 'PASSES') {
      if (currentUser) setIsMyTicketsOpen(true);
      else { setPendingOpenTickets(true); setIsAuthOpen(true); }
    } else if (tab === 'PROFILE') {
      if (currentUser) {
        setIsProfileOpen(true);
      } else {
        setIsAuthOpen(true);
      }
    }
  };

  const handleBookingSuccess = (newPasses) => {
    if (Array.isArray(newPasses)) setTicketCount((count) => count + newPasses.length);
    setIsMyTicketsOpen(true);
  };

  return (
    <div className="relative min-h-[100dvh] w-full bg-[#08080C] text-[#F3EFE0] selection:bg-[#431CB8] selection:text-white font-sans antialiased overflow-x-hidden">
      
      {/* 2. MAIN APP VIEW CONTAINER */}
      <Suspense fallback={<div className="grid min-h-[70vh] place-items-center text-sm text-zinc-400">Loading your plans…</div>}>
      <main className="w-full min-h-screen">
        {selectedEvent ? (
          /* EVENT DETAILS PAGE */
          <EventDetail
            event={selectedEvent}
            onBack={handleBackToFeed}
            onRequestBooking={() => handleStartBooking(selectedEvent)}
            initialOpenBooking={initialOpenBooking}
            isBookmarked={bookmarkedIds.includes(selectedEvent.id)}
            onToggleBookmark={() => toggleBookmark(selectedEvent.id)}
            onBookingSuccess={handleBookingSuccess}
          />
        ) : (
          /* EVENTS DISCOVERY FEED */
          <EventFeed
            events={ALL_EVENTS}
            onSelectEvent={(e) => handleSelectEvent(e, false)}
            onBookEvent={handleStartBooking}
            onOpenAuth={() => setIsAuthOpen(true)}
            onOpenSearch={() => setIsSearchOpen(true)}
            onOpenProfile={() => setIsProfileOpen(true)}
            currentUser={currentUser}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={toggleBookmark}
          />
        )}
      </main>

      {/* 3. FLOATING BOTTOM PILL NAVIGATION */}
      {!selectedEvent && (
        <Navbar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          ticketCount={ticketCount}
          currentUser={currentUser}
        />
      )}

      {/* 4. MODALS & DRAWERS */}
      <SearchDrawer
        isOpen={isSearchOpen}
        onClose={() => {
          setIsSearchOpen(false);
          setActiveTab('EVENTS');
        }}
        events={ALL_EVENTS}
        onSelectEvent={(e) => {
          handleSelectEvent(e, false);
          setIsSearchOpen(false);
        }}
      />

      <MyTicketsModal
        isOpen={isMyTicketsOpen}
        onClose={() => {
          setIsMyTicketsOpen(false);
          setActiveTab('EVENTS');
        }}
        onBookNewPass={() => {
          setIsMyTicketsOpen(false);
          handleSelectEvent(EVENTS_DATA[0], true);
        }}
      />

      {/* LOGIN & ONBOARDING SHEET (1:1 with IMG_4088.PNG, IMG_4089.PNG, IMG_4090.PNG) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => { setIsAuthOpen(false); setActiveTab('EVENTS'); setPendingBookingEvent(null); setPendingOpenTickets(false); }}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthOpen(false);
          if (pendingBookingEvent) {
            handleSelectEvent(pendingBookingEvent, true);
            setPendingBookingEvent(null);
          } else if (pendingOpenTickets) {
            setIsMyTicketsOpen(true);
            setPendingOpenTickets(false);
          } else if (activeTab === 'PROFILE') {
            setIsProfileOpen(true);
          }
        }}
      />

      {/* USER PROFILE SCREEN (1:1 with IMG_4086.PNG, IMG_4087.PNG) */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        onOpenPasses={() => {
          setIsProfileOpen(false);
          setIsMyTicketsOpen(true);
        }}
        onSignOut={() => {
          setCurrentUser(null);
          setIsProfileOpen(false);
        }}
        onProfileUpdate={setCurrentUser}
        ticketCount={ticketCount}
      />
      </Suspense>

    </div>
  );
}
