export const EVENTS_DATA = [
  {
    id: 'strangers-meetup',
    slug: 'strangers-meetup-chennai',
    title: 'Strangers Meetup – Chennai',
    subtitle: 'Meet interesting minds, candid conversations & social experiences',
    category: 'Community',
    tags: ['Community Meetups', 'Social Experiences'],
    price: 199,
    priceLabel: '₹199 onwards',
    dates: 'Sat, 24 Oct onwards',
    time: '5:00 PM – 6:00 PM',
    dateSubtitle: 'Sat, 24 Oct onwards, Multiple Dates',
    availableDates: [
      { id: '2026-10-24', label: 'Sat, 24 Oct', priceLabel: '₹199 Onwards', timing: '5 PM - 6 PM' },
      { id: '2026-10-25', label: 'Sun, 25 Oct', priceLabel: '₹199 Onwards', timing: '5 PM - 6 PM' },
      { id: '2026-10-31', label: 'Sat, 31 Oct', priceLabel: '₹199 Onwards', timing: '5 PM - 6 PM' }
    ],
    showFooterNote: 'Shows start at 5:00 PM daily',
    tiers: [
      {
        id: 'early-bird-female',
        name: 'Early Bird Female',
        price: 199,
        bullets: [
          'A mandatory cover charge of INR 500 per person will be applicable at the venue.',
          'The cover charge is fully redeemable on food & beverage at the venue.'
        ]
      },
      {
        id: 'early-bird-male',
        name: 'Early Bird Male',
        price: 599,
        bullets: [
          'A mandatory cover charge of INR 500 per person will be applicable at the venue.',
          'The cover charge is fully redeemable on food & beverage at the venue.'
        ]
      }
    ],
    venue: {
      name: 'Kreate by Kraft, Chennai',
      shortName: 'Kreate by Kraft',
      rating: 4.6,
      distance: '23.8 km away',
      address: 'Kreate by Kraft, Nungambakkam, Chennai',
      type: 'Creative Cafe & Lounge'
    },
    timing: {
      startsAt: 'Starts at 5:00 PM',
      scheduleSubtitle: 'Social icebreakers & curated mingling'
    },
    coverImage: '/strangers-meetup.png',
    thumbnail: '/strangers-meetup.png',
    gallery: [
      '/strangers-meetup.png'
    ],
    about: `Step out of your routine and meet a room full of curious, driven, and friendly strangers.

Facilitated by Social Sailor, this meetup brings together young professionals, creators, and thinkers in Chennai for authentic, agenda-free conversations. Whether you are new to the city or looking to broaden your social circle, this is your space.

A mandatory cover charge of ₹500 applies at the venue counter, 100% redeemable on artisanal food and craft beverages.`,
    thingsToKnow: [
      'Entry allowed for ages 18 and above',
      'Kids not allowed',
      'Govt photo ID required at door',
      'Venue rules apply'
    ],
    organizer: {
      name: 'SOCIAL SAILOR ENTERTAINMENT',
      likedRating: '42%',
      ratingsCount: 'Liked (239 ratings)',
      hostedEvents: '20+',
      hostingDuration: '8 months',
      initials: 'SS',
      verified: true
    },
    isFeatured: true,
    filterBucket: 'This weekend'
  },
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
      { id: '2026-10-23', label: 'Fri, 23 Oct', priceLabel: '₹1,500 Onwards', timing: '7:00 PM Till Late' },
      { id: '2026-10-24', label: 'Sat, 24 Oct (Encore)', priceLabel: '₹1,500 Onwards', timing: '7:00 PM Till Late' }
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
  },
  {
    id: 'racing-league',
    slug: 'indian-racing-festival',
    title: 'Indian Racing Festival · Round 3',
    subtitle: 'High Octane Street Racing & Formula 4 India Championship',
    category: 'Sports',
    tags: ['Motorsport', 'Formula 4', 'Street Circuit'],
    price: 999,
    priceLabel: '₹999',
    dates: 'Thu, 22 Oct – Fri, 23 Oct',
    time: '12:00 PM Onwards',
    dateSubtitle: 'Thu, 22 Oct – Fri, 23 Oct, 12:00 PM',
    availableDates: [
      { id: '2026-10-22', label: 'Thu, 22 Oct', priceLabel: '₹999 Onwards', timing: '12:00 PM Onwards' },
      { id: '2026-10-23', label: 'Fri, 23 Oct', priceLabel: '₹999 Onwards', timing: '12:00 PM Onwards' }
    ],
    showFooterNote: 'Circuit gates open at 10:00 AM',
    tiers: [
      {
        id: 'grandstand',
        name: 'Grandstand North',
        price: 999,
        bullets: [
          'Covered grandstand seating overlooking Turn 1 apex.',
          'Live track commentary and video wall broadcast.'
        ]
      },
      {
        id: 'paddock-pass',
        name: 'Paddock & Pitlane Walk',
        price: 2499,
        bullets: [
          'Full paddock admission and scheduled pit lane walks.',
          'Driver autograph session and hospitality lounge access.'
        ]
      }
    ],
    venue: {
      name: 'Madras International Circuit, Irungattukottai',
      shortName: 'Madras International Circuit',
      rating: 4.6,
      distance: '31.5 km away',
      address: 'NH4, Sriperumbudur, Tamil Nadu',
      type: 'FIA Grade Circuit'
    },
    timing: {
      startsAt: 'Starts at 12:00 PM',
      scheduleSubtitle: 'Qualifying & Sprint Races'
    },
    coverImage: '/indian-racing.png',
    thumbnail: '/indian-racing.png',
    gallery: [
      '/indian-racing.png'
    ],
    about: `India’s marquee single-seater and prototype touring car championship returns under the floodlights. Feel the roar of high-displacement engines and witness wheel-to-wheel battles across the iconic tarmac.`,
    thingsToKnow: [
      'Grandstand pass includes paddock access zone',
      'Ear protection advised for young attendees',
      'Food & beverage village inside the circuit'
    ],
    organizer: {
      name: 'Racing Promotions Pvt Ltd',
      likedRating: '84%',
      ratingsCount: 'Liked (680 ratings)',
      initials: 'IR',
      hostedEvents: '12+',
      hostingDuration: '8 months',
      verified: true
    },
    isFeatured: true,
    filterBucket: 'Tomorrow'
  },
  {
    id: 'madras-driven',
    slug: 'madras-driven-cars-coffee',
    title: 'Madras Driven: Cars & Coffee Underground',
    subtitle: 'Underground Supercar Meet, Hypercars & Specialty Brews',
    category: 'Culture',
    tags: ['Automotive', 'Cars', 'Coffee'],
    price: 499,
    priceLabel: '₹499',
    dates: 'Sun, 01 Nov',
    time: '8:00 AM – 12:00 PM',
    dateSubtitle: 'Sun, 01 Nov at 8:00 AM',
    availableDates: [
      { id: '2026-11-01', label: 'Sun, 01 Nov', priceLabel: '₹499 Onwards', timing: '8:00 AM – 12:00 PM' }
    ],
    showFooterNote: 'Roll-in opens at 7:30 AM',
    tiers: [
      {
        id: 'visitor-pass',
        name: 'Spectator & Coffee Pass',
        price: 499,
        bullets: [
          'Full underground paddock access and supercar displays.',
          'Complimentary specialty cold brew by artisan roasters.'
        ]
      }
    ],
    venue: {
      name: 'The Marina Mall Underground Basement B2',
      shortName: 'THE MARINA MALL',
      rating: 4.7,
      distance: '18.1 km away',
      address: 'OMR, Egattur, Navalur, Chennai',
      type: 'Underground Level'
    },
    timing: {
      startsAt: 'Starts at 8:00 AM',
      scheduleSubtitle: 'Coffee cupping & engine rev-off at 10:30 AM'
    },
    coverImage: '/madras-driven.png',
    thumbnail: '/madras-driven.png',
    gallery: [
      '/madras-driven.png'
    ],
    about: `The underground automotive community congregates for Chennai's finest showcase of rare JDM imports, European exotics, custom air-cooled Porsches, and precision single-origin cold brews.`,
    thingsToKnow: [
      'No rash driving or unsanctioned burnouts permitted in parking decks',
      'Pass includes complimentary artisan batch cold brew',
      'Photographers & creators welcome'
    ],
    organizer: {
      name: 'Madras Driven Collective',
      likedRating: '95%',
      ratingsCount: 'Liked (190 ratings)',
      initials: 'MD',
      hostedEvents: '9+',
      hostingDuration: '14 months',
      verified: true
    },
    isFeatured: false,
    filterBucket: 'This weekend'
  },
  {
    id: 'leela-karims',
    slug: 'the-leela-palace-x-karims',
    title: "The Leela Palace x Karim's Old Delhi",
    subtitle: 'The Legendary Flavours of Old Delhi Come to The Leela Palace Chennai',
    category: 'Dining',
    tags: ['Pop Ups', 'Food & Drinks', 'Fine Dining'],
    price: 500,
    priceLabel: '₹500',
    dates: 'Thu, 22 Oct – Sun, 25 Oct',
    time: 'Multiple slots',
    dateSubtitle: 'Thu, 22 Oct – Sun, 25 Oct, Multiple slots',
    availableDates: [
      { id: '2026-10-22', label: 'Thu, 22 Oct', priceLabel: '₹500 Onwards', timing: '7:00 PM – 11:00 PM' },
      { id: '2026-10-23', label: 'Fri, 23 Oct', priceLabel: '₹500 Onwards', timing: '7:00 PM – 11:00 PM' },
      { id: '2026-10-24', label: 'Sat, 24 Oct', priceLabel: '₹500 Onwards', timing: '12:30 PM & 7:00 PM' },
      { id: '2026-10-25', label: 'Sun, 25 Oct', priceLabel: '₹500 Onwards', timing: '12:30 PM & 7:00 PM' }
    ],
    showFooterNote: 'Table seatings begin promptly at scheduled slot',
    tiers: [
      {
        id: 'dining-cover',
        name: 'General Reservation Cover',
        price: 500,
        bullets: [
          'Guaranteed table reservation at Spectra.',
          'Full ₹500 cover charge redeemable against final dining bill.'
        ]
      }
    ],
    venue: {
      name: 'Spectra – The Leela Palace, Chennai',
      shortName: 'Spectra – The Leela Palace',
      rating: 4.4,
      distance: '23.9 km away',
      address: 'Adyar Seaface, MRC Nagar, Raja Annamalai Puram, Chennai',
      type: 'Luxury Hotel'
    },
    timing: {
      startsAt: 'Starts at 7 PM',
      scheduleSubtitle: 'View full schedule & timeline'
    },
    coverImage: '/leela-karims.png',
    thumbnail: '/leela-karims.png',
    gallery: [
      '/leela-karims.png'
    ],
    about: `From the bylanes of Old Delhi to the heart of Chennai.

A century-old culinary legacy travels across cities. Indulge in authentic Mughlai heritage dishes, melt-in-mouth kebabs, rich gravies, and the legendary mutton burra crafted by master chefs from Karim's historic Jama Masjid kitchen.`,
    thingsToKnow: [
      'Entry allowed for all ages',
      'Tickets required for all ages',
      'Prior table reservation recommended for dinner hours',
      'Valet parking available at the main hotel porch'
    ],
    organizer: {
      name: 'The Leela Palace',
      likedRating: '92%',
      ratingsCount: 'Liked (1,240 ratings)',
      initials: 'LP',
      hostedEvents: '45+',
      hostingDuration: '3 years',
      verified: true
    },
    isFeatured: true,
    filterBucket: 'Tomorrow'
  },
  {
    id: 'rolling-loud',
    slug: 'rolling-loud-india',
    title: 'Rolling Loud India 2026',
    subtitle: 'The World’s Premier Hip-Hop Festival Makes Its Subcontinent Debut',
    category: 'Music',
    tags: ['Hip Hop', 'Festival', 'Live Stage'],
    price: 3999,
    priceLabel: '₹3,999',
    dates: 'Sat, 28 Nov – Sun, 29 Nov',
    time: '2:00 PM Till Midnight',
    dateSubtitle: 'Sat, 28 Nov – Sun, 29 Nov · 2:00 PM Onwards',
    availableDates: [
      { id: '2026-11-28', label: 'Sat, 28 Nov (Day 1)', priceLabel: '₹3,999 Onwards', timing: '2:00 PM Till Midnight' },
      { id: '2026-11-29', label: 'Sun, 29 Nov (Day 2)', priceLabel: '₹3,999 Onwards', timing: '2:00 PM Till Midnight' }
    ],
    showFooterNote: 'Gates open 1:00 PM each day',
    tiers: [
      {
        id: 'ga-pass',
        name: 'General Admission (GA)',
        price: 3999,
        bullets: [
          'Access to Main Stage and Sub-Stage festival grounds.',
          'Food truck village, street art zone and brand activations.'
        ]
      },
      {
        id: 'vip-pass',
        name: 'VIP Front Row Pit',
        price: 7999,
        bullets: [
          'Dedicated elevated viewing deck next to main artist stage.',
          'Expedited security lane and private air-conditioned restrooms.'
        ]
      }
    ],
    venue: {
      name: 'Madras International Arena, OMR',
      shortName: 'Madras International Arena',
      rating: 4.8,
      distance: '14.2 km away',
      address: 'East Coast Road Entertainment Corridor, Chennai',
      type: 'Festival Grounds'
    },
    timing: {
      startsAt: 'Starts at 2:00 PM',
      scheduleSubtitle: 'Multiple stages · Festival gates open 1:00 PM'
    },
    coverImage: '/rolling-loud.png',
    thumbnail: '/rolling-loud.png',
    gallery: [
      '/rolling-loud.png'
    ],
    about: `The heavyweight international hip-hop spectacle lands in India. Experience multiple massive stages, cutting-edge pyrotechnics, skateparks, streetwear pop-ups, and an all-star lineup of international headliners and homegrown rap pioneers.`,
    thingsToKnow: [
      'Age restriction: 18+ only with govt photo ID',
      'Wristband exchange counters open 24 hours prior',
      'No professional cameras or outside beverages permitted'
    ],
    organizer: {
      name: 'Live Nation & Collective Partners',
      likedRating: '88%',
      ratingsCount: 'Liked (3,410 ratings)',
      initials: 'RL',
      hostedEvents: '34+',
      hostingDuration: '2 years',
      verified: true
    },
    isFeatured: true,
    filterBucket: 'This weekend'
  }
];
