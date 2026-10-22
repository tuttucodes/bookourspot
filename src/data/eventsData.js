export const EVENTS_DATA = [
  {
    id: 'halloween-affair',
    slug: 'a-little-halloween-affair',
    title: 'A little Halloween affair',
    subtitle: 'A house party · Secret spooky location',
    category: 'House party',
    tags: ['Halloween', 'Nightlife', 'House party'],
    price: 1500,
    priceLabel: '₹1,500',
    dates: 'Fri, 23 Oct',
    time: '7:00 PM Till Late',
    dateSubtitle: 'Friday, 23 Oct · 7:00 PM Till Late',
    availableDates: [
      { id: '2026-10-23', label: 'Fri, 23 Oct', priceLabel: '₹1,500', timing: '7:00 PM Till Late' }
    ],
    showFooterNote: 'House party · Secret spooky location',
    tiers: [
      {
        id: 'solo-house-pass',
        name: 'Entry · 1 person',
        price: 1500,
        guestsPerUnit: 1,
        bullets: [
          'Entry for one person.',
          'House party in Chennai. Exact location to be shared by the organiser.',
          'Dress code: spooky, stylish and a little dramatic.'
        ]
      }
    ],
    venue: {
      name: 'Secret spooky location',
      shortName: 'Chennai · Location details to follow',
      distance: 'House party',
      address: 'Secret spooky location, Chennai',
      type: 'Private Residence'
    },
    timing: {
      startsAt: 'Fri, 23 Oct · 7:00 PM',
      scheduleSubtitle: 'House party · Till late'
    },
    coverImage: '/halloween-affair.jpg',
    thumbnail: '/halloween-affair.jpg',
    gallery: [],
    about: `A Halloween house party in Chennai. Meet us at a secret spooky location on Friday, 23 October from 7 PM till late. Dress spooky, stylish and a little dramatic.`,
    thingsToKnow: [
      'Dress code: spooky, stylish and a little dramatic',
      'House party at a secret spooky location in Chennai',
      'Fri, 23 Oct · 7 PM till late'
    ],
    organizer: null,
    isFeatured: true,
    filterBucket: 'This weekend'
  }
];

export const COMING_SOON_EVENTS = [
  {
    id: 'karims-leela',
    title: 'The Leela Palace × Karim’s Old Delhi',
    subtitle: 'The legendary flavours of Old Delhi come to Chennai.',
    category: 'Food & drink',
    dateLabel: 'Thu, 22 – Sun, 25 Oct · Multiple slots',
    priceLabel: '₹500 onwards',
    venue: 'Spectra · The Leela Palace, Chennai',
    coverImage: '/leela-karims.png',
    badge: 'COMING SOON',
  },
  {
    id: 'racing-league',
    title: 'Indian Racing Festival · Round 3',
    subtitle: 'Indian Racing League weekend in Chennai.',
    category: 'Motorsport',
    dateLabel: 'Thu, 22 – Fri, 23 Oct',
    venue: 'Madras International Circuit, Chennai',
    coverImage: '/indian-racing.png',
    badge: 'COMING SOON',
  },
  {
    id: 'madras-driven',
    title: 'Madras Driven – Supercars & Classics',
    subtitle: 'Curated coastal sunrise morning drive and breakfast salon',
    category: 'Automotive Salon',
    dateLabel: 'Dates to be announced',
    venue: 'East Coast Road, Chennai',
    coverImage: '/madras-driven.png',
    badge: 'COMING SOON',
  },
  {
    id: 'rolling-loud',
    title: 'Rolling Loud South Arena',
    subtitle: 'The world’s premier hip-hop festival lands in South India',
    category: 'Live Music Arena',
    dateLabel: 'Dates to be announced',
    venue: 'Madras Arena, Chennai',
    coverImage: '/rolling-loud.png',
    badge: 'COMING SOON',
  },
  {
    id: 'strangers-meetup',
    title: 'Strangers Meetup – Chennai',
    subtitle: 'Community meetups and social experiences.',
    category: 'Community meetup',
    dateLabel: 'Sat, 24 Oct onwards · Multiple dates',
    priceLabel: '₹199 onwards',
    venue: 'Kreate by Kraft, Chennai',
    coverImage: '/strangers-meetup.png',
    badge: 'DROPPING SOON',
  }
];
