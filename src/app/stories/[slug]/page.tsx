import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const dynamic = 'force-static';

type Story = {
  slug: string;
  eyebrow: string;
  title: string;
  excerpt: string;
  body: string[];
  exploreHref: string;
  exploreLabel: string;
};

const STORIES: Record<string, Story> = {
  'fresh-fades-kl': {
    slug: 'fresh-fades-kl',
    eyebrow: 'Discovery',
    title: 'Fresh fades in KL — where the late-evening crowd books',
    excerpt:
      'Barbershops with clean fades, quick evening slots, and dependable walk-in energy.',
    body: [
      'Kuala Lumpur after 6pm is a different city. Professionals clocking out of Menara Maxis, students chasing the last LRT, and creators filming next-day content all converge on the same thing: a chair that opens up now.',
      "We spent a week with three barbershops in Bukit Bintang and Damansara that consistently deliver — not the Instagram-famous ones, the actual reliable ones. What makes them stand out isn't the interior. It's the rhythm: the seat is warm when you sit, the clipper guard is fresh, the fade taper starts at the hairline not three fingers above.",
      "Quick walk-ins still matter here. Most KL barbers keep two chairs reserved for drop-ins even on a Friday. The trick is knowing which shops actually stick to that promise. Book via BookOurSpot when you need the certainty, walk in when the mood hits.",
    ],
    exploreHref: '/explore?category=barbershop',
    exploreLabel: 'Browse KL barbershops',
  },
  'weekend-spa-reset': {
    slug: 'weekend-spa-reset',
    eyebrow: 'Curation',
    title: 'Weekend spa reset — the 90-minute recipe that actually works',
    excerpt:
      'Massage and facial spots that feel premium without making discovery feel hard.',
    body: [
      'The best Saturday you can have in Klang Valley starts with a 90-minute decision: do nothing, or do one thing well. A proper spa reset is the one-thing option — and doing it well is easier than the options crisis makes it seem.',
      'Three ingredients separate a good session from a forgettable one. First: a therapist who calibrates pressure in the first 30 seconds. Second: a steam-then-oil sequence that actually respects the rest time. Third: a waiting area that is not playing pop music at 70 dB.',
      'The spas we keep returning to treat the booking the way a restaurant treats a reservation: your slot is yours, the room is prepared, the robe is warm. Book a morning slot — the therapist’s hands are fresh, the room air is still cool.',
    ],
    exploreHref: '/explore?category=spa',
    exploreLabel: 'Browse Klang Valley spas',
  },
  'after-work-glam': {
    slug: 'after-work-glam',
    eyebrow: 'Tips',
    title: 'After-work glam — same-day salon picks that deliver',
    excerpt:
      'Salon picks with same-day availability for fast post-office appointments.',
    body: [
      "Salon bookings have a weird gap between 5pm and 7pm. Most good stylists are winding down their last appointment, most great ones are already booked. The answer isn't to push harder, it's to book smarter.",
      'Look for salons that keep a "walk-out window" — a deliberately unbooked 30-minute gap reserved for last-minute touch-ups. In PJ and Mont Kiara, the better salons keep two of these a night. BookOurSpot shows you which businesses are actively holding those slots right now.',
      'Keep the service tight: a quick blow-dry, a root touch-up, or a lash lift. Anything that takes more than 45 minutes should be a morning booking, not an after-work one.',
    ],
    exploreHref: '/explore?category=salon',
    exploreLabel: 'Browse salons tonight',
  },
};

export function generateStaticParams() {
  return Object.keys(STORIES).map((slug) => ({ slug }));
}

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = STORIES[slug];
  if (!story) notFound();

  return (
    <div className="min-h-screen bg-[#fcf9f8]">
      <header className="sticky top-0 z-30 bg-surface-glass">
        <div className="max-w-3xl mx-auto px-5 py-3 flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#f0eded]"
            aria-label="Back to home"
          >
            <ArrowLeft size={18} className="text-[#1c1b1b]" />
          </Link>
          <span className="type-label text-[#3e484c]">Stories</span>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-5 pt-6 pb-16">
        <p className="type-label text-[#006273]">{story.eyebrow}</p>
        <h1 className="mt-3 type-display text-[#1c1b1b]">{story.title}</h1>
        <p className="mt-4 text-lg text-[#3e484c] leading-relaxed">{story.excerpt}</p>

        <div className="mt-8 space-y-5 text-base leading-[1.75] text-[#1c1b1b]">
          {story.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <div className="mt-10 rounded-3xl bg-brand-gradient p-6 text-white shadow-ambient">
          <p className="type-label text-white/80">Try it yourself</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">Ready to book?</h2>
          <p className="mt-2 text-sm text-white/85">
            Browse nearby spots with live availability and pay at the store.
          </p>
          <Link
            href={story.exploreHref}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white text-[#006273] px-4 py-2 text-sm font-semibold hover:bg-white/95"
          >
            {story.exploreLabel} <ArrowRight size={14} />
          </Link>
        </div>

        <nav className="mt-12 border-t border-[#e5e2e1] pt-6">
          <p className="type-label text-[#3e484c]">More stories</p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {Object.values(STORIES)
              .filter((s) => s.slug !== story.slug)
              .map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/stories/${s.slug}`}
                    className="block rounded-2xl bg-white p-4 hover:shadow-ambient transition-shadow"
                  >
                    <p className="type-label text-[#006273]">{s.eyebrow}</p>
                    <p className="mt-1 font-semibold text-[#1c1b1b]">{s.title}</p>
                  </Link>
                </li>
              ))}
          </ul>
        </nav>
      </article>
    </div>
  );
}
