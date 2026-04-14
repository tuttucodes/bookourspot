import type { Metadata } from 'next';
import Link from 'next/link';
import {
  CalendarClock,
  CreditCard,
  Users,
  BarChart3,
  BellRing,
  Globe2,
  Star,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'For Business | Booking Software for Salons, Barbershops, Spas & Car Washes',
  description:
    'Grow your service business with BookOurSpot. Get online bookings, staff scheduling, reminders, payments, reporting, and marketplace discovery in one platform.',
  alternates: {
    canonical: '/for-business',
  },
  openGraph: {
    title: 'BookOurSpot For Business',
    description:
      'Modern booking and management software for service businesses in Malaysia.',
    url: 'https://bookourspot.com/for-business',
    type: 'website',
  },
};

const features = [
  {
    icon: CalendarClock,
    title: 'Online booking 24/7',
    description: 'Accept appointments around the clock from your booking page and marketplace listing.',
  },
  {
    icon: Users,
    title: 'Team and schedule management',
    description: 'Set staff availability, assign services, and keep your calendar fully in sync.',
  },
  {
    icon: CreditCard,
    title: 'Payments and checkout',
    description: 'Take secure payments and deposits while reducing no-shows and late cancellations.',
  },
  {
    icon: BellRing,
    title: 'Automated reminders',
    description: 'Send booking confirmations and reminders over WhatsApp and email automatically.',
  },
  {
    icon: BarChart3,
    title: 'Reports and insights',
    description: 'Track revenue, booking trends, customer return rate, and your most popular services.',
  },
  {
    icon: Globe2,
    title: 'Get discovered locally',
    description: 'Appear in BookOurSpot search results and attract nearby customers already looking to book.',
  },
];

const faqs = [
  {
    q: 'How quickly can I start accepting bookings?',
    a: 'Most businesses can set up in under 15 minutes. Add your profile, services, hours, and start taking appointments right away.',
  },
  {
    q: 'Can my team manage their own schedules?',
    a: 'Yes. You can assign team members to services, control working hours, and keep individual appointment calendars organized.',
  },
  {
    q: 'Do I need technical skills to use BookOurSpot?',
    a: 'No. The platform is built for business owners and staff with a simple dashboard and guided onboarding.',
  },
  {
    q: 'Can customers book from their phones?',
    a: 'Absolutely. Booking pages are mobile-first and optimized for fast search, discovery, and checkout.',
  },
];

const comparisonRows = [
  { label: 'Online booking page', bookourspot: true, traditional: false },
  { label: 'Automated WhatsApp reminders', bookourspot: true, traditional: false },
  { label: 'Marketplace discovery traffic', bookourspot: true, traditional: false },
  { label: 'Staff schedule management', bookourspot: true, traditional: true },
  { label: 'Business performance insights', bookourspot: true, traditional: false },
];

export default function ForBusinessPage() {
  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'BookOurSpot For Business',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'MYR',
      description: 'Free starter plan available',
    },
    url: 'https://bookourspot.com/for-business',
    description:
      'Booking and management software for salons, barbershops, spas, and car washes.',
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  return (
    <div className="pb-10 bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <header className="sticky top-0 z-40 border-b border-violet-100 bg-white/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">
          <Link href="/" className="font-semibold text-violet-700 text-lg">BookOurSpot</Link>
          <div className="flex items-center gap-2">
            <Link href="/login?role=merchant" className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700">
              Log in
            </Link>
            <Link href="/signup?role=merchant" className="text-sm px-3 py-1.5 rounded-lg bg-violet-600 text-white font-medium">
              Start free
            </Link>
          </div>
        </div>
      </header>

      <section className="px-5 pt-8 pb-10 bg-gradient-to-b from-violet-950 via-violet-900 to-violet-800 text-white">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <p className="inline-flex items-center gap-2 text-xs bg-white/10 border border-white/20 px-3 py-1.5 rounded-full">
              <Sparkles size={14} /> BookOurSpot for Business
            </p>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight mt-4">
              The all-in-one booking and growth platform for service businesses
            </h1>
            <p className="text-violet-100 text-sm md:text-base mt-3 max-w-xl">
              Replace calls, manual schedules and no-shows with a modern online booking workflow designed for salons,
              barbershops, spas and car washes.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="text-xs bg-white/10 border border-white/20 rounded-full px-3 py-1">Salons</span>
              <span className="text-xs bg-white/10 border border-white/20 rounded-full px-3 py-1">Barbershops</span>
              <span className="text-xs bg-white/10 border border-white/20 rounded-full px-3 py-1">Spas</span>
              <span className="text-xs bg-white/10 border border-white/20 rounded-full px-3 py-1">Car Washes</span>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-2">
              <Link
                href="/signup?role=merchant"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-violet-800 font-semibold"
              >
                Start free <ChevronRight size={16} />
              </Link>
              <Link
                href="/dashboard/onboarding"
                className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-white/25 text-white font-medium"
              >
                View onboarding flow
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur">
            <p className="text-sm text-violet-100">This week on BookOurSpot</p>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="rounded-xl bg-white/10 p-3 border border-white/15">
                <p className="text-2xl font-bold">1,200+</p>
                <p className="text-xs text-violet-100">appointments booked</p>
              </div>
              <div className="rounded-xl bg-white/10 p-3 border border-white/15">
                <p className="text-2xl font-bold">32%</p>
                <p className="text-xs text-violet-100">average repeat rate</p>
              </div>
              <div className="rounded-xl bg-white/10 p-3 border border-white/15">
                <p className="text-2xl font-bold">24/7</p>
                <p className="text-xs text-violet-100">always-on booking</p>
              </div>
              <div className="rounded-xl bg-white/10 p-3 border border-white/15">
                <p className="text-2xl font-bold">4.8★</p>
                <p className="text-xs text-violet-100">merchant satisfaction</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-5 border-y border-gray-100 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs uppercase tracking-wider text-gray-500 mb-3">Trusted by local businesses</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center">
            {['Urban Fade', 'Selene Spa', 'Prime Cuts', 'Glow Studio', 'AutoShine'].map((brand) => (
              <div key={brand} className="rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700">
                {brand}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 mt-7">
        <div className="max-w-6xl mx-auto">
        <h2 className="text-xl font-semibold text-gray-900">Everything in one place</h2>
        <p className="text-sm text-gray-600 mt-1">
          Built to help you book more clients, save admin time, and deliver better experiences.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
          {features.map(({ icon: Icon, title, description }) => (
            <article key={title} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
                <Icon size={18} />
              </div>
              <h3 className="font-semibold text-gray-900 mt-3">{title}</h3>
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            </article>
          ))}
        </div>
        </div>
      </section>

      <section className="px-5 mt-8">
        <div className="max-w-6xl mx-auto rounded-2xl border border-gray-100 bg-gray-50 p-5">
          <h2 className="text-xl font-semibold text-gray-900">How it works</h2>
          <ol className="space-y-3 mt-4">
            <li className="text-sm text-gray-700">
              <span className="font-semibold text-violet-700">1. Set up your business profile</span> with services, pricing, and opening hours.
            </li>
            <li className="text-sm text-gray-700">
              <span className="font-semibold text-violet-700">2. Share your booking page</span> and get discovered on BookOurSpot search.
            </li>
            <li className="text-sm text-gray-700">
              <span className="font-semibold text-violet-700">3. Manage bookings and staff</span> from one dashboard with real-time updates.
            </li>
            <li className="text-sm text-gray-700">
              <span className="font-semibold text-violet-700">4. Grow with insights</span> on bookings, revenue, and repeat customers.
            </li>
          </ol>
        </div>
      </section>

      <section className="px-5 mt-8">
        <div className="max-w-6xl mx-auto">
        <h2 className="text-xl font-semibold text-gray-900">Simple pricing</h2>
        <div className="grid md:grid-cols-2 gap-3 mt-4">
          <article className="rounded-2xl border border-violet-200 bg-violet-50 p-5">
            <p className="text-sm font-semibold text-violet-800">Starter</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">RM 0</p>
            <p className="text-xs text-gray-600 mt-1">Perfect for getting started</p>
            <ul className="mt-4 space-y-2">
              <li className="text-sm text-gray-700 inline-flex items-center gap-2"><CheckCircle2 size={14} className="text-violet-600" /> Online booking page</li>
              <li className="text-sm text-gray-700 inline-flex items-center gap-2"><CheckCircle2 size={14} className="text-violet-600" /> Service and team setup</li>
              <li className="text-sm text-gray-700 inline-flex items-center gap-2"><CheckCircle2 size={14} className="text-violet-600" /> Basic reporting</li>
            </ul>
          </article>
          <article className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-sm font-semibold text-gray-900">Growth</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">RM 79<span className="text-base font-medium">/month</span></p>
            <p className="text-xs text-gray-600 mt-1">For scaling teams and multi-staff operations</p>
            <ul className="mt-4 space-y-2">
              <li className="text-sm text-gray-700 inline-flex items-center gap-2"><CheckCircle2 size={14} className="text-violet-600" /> Advanced analytics</li>
              <li className="text-sm text-gray-700 inline-flex items-center gap-2"><CheckCircle2 size={14} className="text-violet-600" /> Enhanced reminders</li>
              <li className="text-sm text-gray-700 inline-flex items-center gap-2"><CheckCircle2 size={14} className="text-violet-600" /> Priority support</li>
            </ul>
          </article>
        </div>
        </div>
      </section>

      <section className="px-5 mt-8">
        <div className="max-w-6xl mx-auto">
        <h2 className="text-xl font-semibold text-gray-900">Why merchants switch to BookOurSpot</h2>
        <div className="rounded-2xl border border-gray-100 overflow-hidden mt-4">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-3 font-medium text-gray-600">Capability</th>
                <th className="text-left py-3 px-3 font-medium text-violet-700">BookOurSpot</th>
                <th className="text-left py-3 px-3 font-medium text-gray-500">Traditional setup</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.label} className="border-t border-gray-100">
                  <td className="py-3 px-3 text-gray-700">{row.label}</td>
                  <td className="py-3 px-3">{row.bookourspot ? '✅' : '—'}</td>
                  <td className="py-3 px-3">{row.traditional ? '✅' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid gap-3 mt-6 md:grid-cols-2">
          <article className="rounded-2xl border border-gray-100 bg-white p-4">
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Star key={idx} size={13} className="fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-sm text-gray-700 mt-2">
              BookOurSpot helped us fill weekday slots and reduced no-shows significantly.
            </p>
            <p className="text-xs text-gray-500 mt-2">— Urban Fade Barbershop, Kuala Lumpur</p>
          </article>
          <article className="rounded-2xl border border-gray-100 bg-white p-4">
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Star key={idx} size={13} className="fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-sm text-gray-700 mt-2">
              Setup was simple, and clients love the smooth booking experience from mobile.
            </p>
            <p className="text-xs text-gray-500 mt-2">— Selene Spa Studio, Cyberjaya</p>
          </article>
        </div>
        </div>
      </section>

      <section className="px-5 mt-8">
        <div className="max-w-6xl mx-auto rounded-2xl border border-gray-100 bg-white p-5">
          <h2 className="text-xl font-semibold text-gray-900">Frequently asked questions</h2>
          <div className="space-y-4 mt-4">
            {faqs.map((item) => (
              <article key={item.q}>
                <h3 className="font-medium text-gray-900">{item.q}</h3>
                <p className="text-sm text-gray-600 mt-1">{item.a}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 mt-8 mb-4">
        <div className="max-w-6xl mx-auto rounded-2xl bg-gradient-to-r from-violet-700 to-violet-600 p-5 text-white">
          <p className="inline-flex items-center gap-2 text-xs bg-white/15 border border-white/20 px-3 py-1 rounded-full">
            <ShieldCheck size={13} /> Merchant-ready
          </p>
          <h2 className="text-2xl font-semibold mt-3">Ready to grow with BookOurSpot?</h2>
          <p className="text-sm text-violet-100 mt-2">
            Join now and start taking online bookings in minutes.
          </p>
          <div className="mt-4 flex gap-2">
            <Link
              href="/signup?role=merchant"
              className="flex-1 text-center px-4 py-2.5 rounded-xl bg-white text-violet-700 font-semibold"
            >
              Create merchant account
            </Link>
            <Link
              href="/login?role=merchant"
              className="flex-1 text-center px-4 py-2.5 rounded-xl border border-white/30 text-white font-medium"
            >
              Merchant login
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
