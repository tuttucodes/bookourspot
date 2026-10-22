export const EVENTS_DATA = [
  {
    id: 'halloween-affair',
    slug: 'a-little-halloween-affair',
    title: 'a little halloween affair',
    subtitle: 'candlelight, cocktails, costumes & a little bad behaviour',
    category: 'Nightlife',
    tags: ['Secret Party', 'Costumes', 'Craft Cocktails', 'House Salon'],
    price: 1500,
    priceLabel: '₹1,500',
    duoPrice: 2800,
    dates: 'Fri, 23 Oct',
    time: '7:00 PM Till Late',
    dateSubtitle: 'Friday, 23 Oct · 7:00 PM Till Late',
    availableDates: [
      { id: '2026-10-23', label: 'Fri, 23 Oct', priceLabel: '₹1,500', timing: '7:00 PM Till Late' },
      { id: '2026-10-24', label: 'Sat, 24 Oct (Encore)', priceLabel: '₹1,500', timing: '7:00 PM Till Late' }
    ],
    showFooterNote: 'Secret sanctuary doors open at 7:00 PM sharp',
    tiers: [
      {
        id: 'solo-house-pass',
        name: 'Solo House Pass',
        price: 1500,
        guestsPerUnit: 1,
        bullets: [
          'Admission for 1 guest with verified Govt Photo ID.',
          'Full access to open craft cocktail bar & themed drinks throughout.',
          'Secret house sanctuary coordinates dispatched via WhatsApp 3h prior.'
        ]
      },
      {
        id: 'duo-house-pass',
        name: 'Duo / Couple Pass',
        price: 2800,
        guestsPerUnit: 2,
        bullets: [
          'Admission for 2 guests with verified Govt Photo ID.',
          'Full access to open craft cocktail bar & themed drinks throughout.',
          'Save ₹200 on dual pass reservation.'
        ]
      }
    ],
    venue: {
      name: 'Secret House Party · South Sanctuary',
      shortName: 'South Sanctuary, Chennai',
      rating: 4.9,
      distance: 'Coordinates pinned 3h prior',
      address: 'Private Villa / Penthouse Sanctuary (Revealed on WhatsApp Guestlist)',
      type: 'Private Residence'
    },
    timing: {
      startsAt: 'Starts at 7:00 PM',
      scheduleSubtitle: 'Doors lock at midnight · Open craft bar throughout'
    },
    coverImage: '/halloween-affair.jpg',
    thumbnail: '/halloween-affair.jpg',
    gallery: [
      '/halloween-affair.jpg'
    ],
    about: `come for the costumes. stay for the cocktails. things get hotter after dark.

An ultra-intimate, high-energy house affair designed for those who appreciate good music, bespoke cocktails, and unfiltered late-night energy. Featuring live sound, an open craft cocktail bar, house punch, and a midnight costume award.

Strictly non-transferable admission bound to guest credentials. Govt photo ID matching your registered name is mandatory at the door.`,
    thingsToKnow: [
      'Strictly 21+ only · Govt photo ID mandatory at the gate',
      'Full costume mandatory · Entry denied if wearing everyday plain clothes',
      'Open craft cocktail bar and signature house punch included in pass',
      'Secret villa coordinates dispatched via private WhatsApp guest list 3h prior'
    ],
    organizer: {
      name: 'Sanctuary & The Collective',
      likedRating: '96%',
      ratingsCount: 'Liked (410 ratings)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
      initials: 'SC',
      hostedEvents: '18+',
      hostingDuration: '11 months',
      verified: true
    },
    isFeatured: true,
    filterBucket: 'This weekend'
  }
];

export const COMING_SOON_EVENTS = [
  {
    id: 'karims-leela',
    title: "Karim's of Delhi × The Leela Palace",
    subtitle: 'Grand Imperial Mughlai Dining Pop-Up with Old Delhi Master Chefs',
    category: 'Culinary Pop-Up',
    dateLabel: 'Dropping November 2026',
    venue: 'The Leela Palace, MRC Nagar, Chennai',
    coverImage: '/leela-karims.png',
    badge: 'COMING SOON',
    waitlistCount: '480+ on waitlist'
  },
  {
    id: 'racing-league',
    title: 'Indian Racing Festival – Night Race',
    subtitle: 'Night street circuit championship under the floodlights',
    category: 'Motorsport',
    dateLabel: 'Dropping November 2026',
    venue: 'Madras International Circuit, Chennai',
    coverImage: '/indian-racing.png',
    badge: 'COMING SOON',
    waitlistCount: '1.2k on waitlist'
  },
  {
    id: 'madras-driven',
    title: 'Madras Driven – Supercars & Classics',
    subtitle: 'Curated coastal sunrise morning drive and breakfast salon',
    category: 'Automotive Salon',
    dateLabel: 'Dropping December 2026',
    venue: 'East Coast Road, Chennai',
    coverImage: '/madras-driven.png',
    badge: 'COMING SOON',
    waitlistCount: '320+ on waitlist'
  },
  {
    id: 'rolling-loud',
    title: 'Rolling Loud South Arena',
    subtitle: 'The world’s premier hip-hop festival lands in South India',
    category: 'Live Music Arena',
    dateLabel: 'Dropping December 2026',
    venue: 'Madras Arena, Chennai',
    coverImage: '/rolling-loud.png',
    badge: 'COMING SOON',
    waitlistCount: '3.1k on waitlist'
  },
  {
    id: 'strangers-meetup',
    title: 'Strangers Social Salon',
    subtitle: 'Candid conversations, curated icebreakers & artisanal coffee',
    category: 'Social Community',
    dateLabel: 'New Cohort Dropping Soon',
    venue: 'Kreate by Kraft, Nungambakkam, Chennai',
    coverImage: '/strangers-meetup.png',
    badge: 'DROPPING SOON',
    waitlistCount: '210+ on waitlist'
  }
];
