import React, { useState, useEffect } from 'react';
import SplashScreen from './components/SplashScreen';
import EventFeed from './components/EventFeed';
import EventDetail from './components/EventDetail';
import Navbar from './components/Navbar';
import SearchDrawer from './components/SearchDrawer';
import MyTicketsModal from './components/MyTicketsModal';
import OrganizerDoorHub from './components/OrganizerDoorHub';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
import { EVENTS_DATA } from './data/eventsData';
import { getStoredPasses } from './utils/passRegistry';
import { getCurrentUser } from './utils/authService';

export default function App() {
  const [showSplash, setShowSplash] = useState(() => {
    try {
      return !sessionStorage.getItem('bos_splash_shown');
    } catch {
      return false;
    }
  });
  const [activeTab, setActiveTab] = useState('EVENTS'); // 'EVENTS' | 'SEARCH' | 'PASSES' | 'PROFILE'
  const [initialOpenBooking, setInitialOpenBooking] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const eventId = params.get('event');
      if (eventId) {
        return EVENTS_DATA.find(e => e.id === eventId || e.slug === eventId) || null;
      }
    } catch {}
    return null;
  });

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (selectedEvent) {
        url.searchParams.set('event', selectedEvent.id);
      } else {
        url.searchParams.delete('event');
      }
      window.history.replaceState({}, '', url.toString());
    } catch {}
  }, [selectedEvent]);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMyTicketsOpen, setIsMyTicketsOpen] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('wallet') === '1' || params.get('passes') === '1';
    } catch {
      return false;
    }
  });
  const [isDoorHubOpen, setIsDoorHubOpen] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('host') === '1' || params.get('scanner') === '1';
    } catch {
      return false;
    }
  });
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [ticketCount, setTicketCount] = useState(0);
  
  // Bookmarked event IDs (Hotlist)
  const [bookmarkedIds, setBookmarkedIds] = useState(() => {
    try {
      const stored = localStorage.getItem('bookourspot_hotlist_v1');
      return stored ? JSON.parse(stored) : ['halloween-affair'];
    } catch {
      return ['halloween-affair'];
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
    setSelectedEvent(event);
    setInitialOpenBooking(autoOpenBooking);
  };

  // Sync ticket count and user session
  useEffect(() => {
    const updateStats = () => {
      const stored = getStoredPasses();
      setTicketCount(stored.length);
    };
    updateStats();
    window.addEventListener('pass_registry_updated', updateStats);

    getCurrentUser().then(user => {
      if (user) setCurrentUser(user);
    });

    const handleAuthChange = () => {
      getCurrentUser().then(user => setCurrentUser(user));
    };
    window.addEventListener('auth_state_changed', handleAuthChange);

    return () => {
      window.removeEventListener('pass_registry_updated', updateStats);
      window.removeEventListener('auth_state_changed', handleAuthChange);
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
      setIsMyTicketsOpen(true);
    } else if (tab === 'PROFILE') {
      if (currentUser) {
        setIsProfileOpen(true);
      } else {
        setIsAuthOpen(true);
      }
    }
  };

  const handleBookingSuccess = (newPasses) => {
    setIsMyTicketsOpen(true);
  };

  return (
    <div className="relative min-h-[100dvh] w-full bg-[#08080C] text-[#F3EFE0] selection:bg-[#431CB8] selection:text-white font-sans antialiased overflow-x-hidden">
      
      {/* 1. SPLASH SCREEN */}
      {showSplash && (
        <SplashScreen 
          onDismiss={() => {
            setShowSplash(false);
            try { sessionStorage.setItem('bos_splash_shown', 'true'); } catch {}
          }} 
        />
      )}

      {/* 2. MAIN APP VIEW CONTAINER */}
      <main className="w-full min-h-screen">
        {selectedEvent ? (
          /* EVENT DETAILS PAGE */
          <EventDetail
            event={selectedEvent}
            onBack={() => {
              setSelectedEvent(null);
              setInitialOpenBooking(false);
            }}
            initialOpenBooking={initialOpenBooking}
            isBookmarked={bookmarkedIds.includes(selectedEvent.id)}
            onToggleBookmark={() => toggleBookmark(selectedEvent.id)}
            onBookingSuccess={handleBookingSuccess}
          />
        ) : (
          /* EVENTS DISCOVERY FEED */
          <EventFeed
            events={EVENTS_DATA}
            onSelectEvent={(e) => handleSelectEvent(e, false)}
            onBookEvent={(e) => handleSelectEvent(e, true)}
            onOpenAuth={() => setIsAuthOpen(true)}
            onOpenProfile={() => setIsProfileOpen(true)}
            onOpenHostPortal={() => setIsDoorHubOpen(true)}
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
        events={EVENTS_DATA}
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

      <OrganizerDoorHub
        isOpen={isDoorHubOpen}
        onClose={() => setIsDoorHubOpen(false)}
      />

      {/* LOGIN & ONBOARDING SHEET (1:1 with IMG_4088.PNG, IMG_4089.PNG, IMG_4090.PNG) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthOpen(false);
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
      />

    </div>
  );
}
