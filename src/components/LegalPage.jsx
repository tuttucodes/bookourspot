import React from 'react';
import { ArrowLeft } from 'lucide-react';

const updated = '22 October 2026';

export default function LegalPage({ kind }) {
  const privacy = kind === 'privacy';
  return <main className="bos-page min-h-screen px-5 py-8 sm:px-8">
    <div className="mx-auto max-w-3xl">
      <a href="/" className="inline-flex items-center gap-2 text-sm text-zinc-300 hover:text-white"><ArrowLeft size={16} /> Back to BookOutSpot</a>
      <p className="mt-10 text-xs font-bold uppercase tracking-[.2em] text-violet-200">BookOutSpot · Chennai</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">{privacy ? 'Privacy policy' : 'Terms of service'}</h1>
      <p className="mt-3 text-sm text-zinc-400">Effective {updated}</p>
      <article className="mt-8 space-y-7 rounded-3xl border border-white/10 bg-white/[.035] p-6 text-sm leading-7 text-zinc-300 sm:p-9">
        {privacy ? <>
          <section><h2 className="text-lg font-semibold text-white">Information we use</h2><p>When you use BookOutSpot, we process your verified mobile number and, if provided through sign-in, your name, email address and profile image. For a booking, we also process event and ticket selections, attendee names and phone numbers, payment amount, booking reference and any UPI reference number you submit.</p></section>
          <section><h2 className="text-lg font-semibold text-white">Why we use it</h2><p>We use this information to create and secure your account, reserve bookings, verify reported payments, issue passes after approval, help with support requests, prevent abuse and meet applicable legal and accounting requirements. Event organisers receive the attendee details needed to manage entry and deliver the event.</p></section>
          <section><h2 className="text-lg font-semibold text-white">Payments and service providers</h2><p>Payments are initiated by you in your chosen UPI app and are manually checked against the receiving account. BookOutSpot does not ask for or collect your UPI PIN, bank password or payment OTP. Firebase provides authentication; Supabase stores booking records; Vercel hosts the website and server endpoints. Your bank and UPI app process payment information under their own policies.</p></section>
          <section><h2 className="text-lg font-semibold text-white">Retention and your choices</h2><p>We retain booking and payment records for as long as needed to operate the service, resolve disputes and meet legal obligations. You can ask to access, correct or delete account information by writing to <a className="text-violet-200 underline" href="mailto:hello@bookourspot.com">hello@bookourspot.com</a>. Some transaction records may need to be retained where law requires.</p></section>
          <section><h2 className="text-lg font-semibold text-white">Security and changes</h2><p>We use access controls and service-provider safeguards to protect information, though no online service can promise absolute security. We may update this policy; the current version and effective date will be posted here.</p></section>
        </> : <>
          <section><h2 className="text-lg font-semibold text-white">Using BookOutSpot</h2><p>BookOutSpot helps you discover and book events and experiences. You must provide accurate account, attendee and payment-reference details, keep your sign-in credentials secure, and meet the eligibility rules shown on each event page. A verified mobile number is required to book.</p></section>
          <section><h2 className="text-lg font-semibold text-white">Bookings and payment status</h2><p>A booking is not confirmed when you create it or submit a UPI transfer. It remains <strong className="text-white">pending</strong> until BookOutSpot verifies the credit and approves it. A pass is issued only after approval. Submit the correct UTR/reference and do not pay again while the booking is pending. If a transfer cannot be matched, contact <a className="text-violet-200 underline" href="mailto:hello@bookourspot.com">hello@bookourspot.com</a> with your booking reference.</p></section>
          <section><h2 className="text-lg font-semibold text-white">Event details and eligibility</h2><p>Event dates, venue, age or other eligibility requirements, inclusions and entry conditions are displayed on the event page and may be set by the organiser. For “A little Halloween affair,” the organiser has specified 23 October, 7 PM till late, a secret location shared with invited guests, and eligibility for fourth-year students only. The listed ticket options are ₹1,500 per person and ₹2,800 for a duo. Check the latest event details before paying.</p></section>
          <section><h2 className="text-lg font-semibold text-white">Changes, cancellations and refunds</h2><p>Event-specific cancellation, rescheduling and refund terms shown at checkout apply to that booking, subject to applicable consumer law. If an event is changed or cancelled, contact BookOutSpot at <a className="text-violet-200 underline" href="mailto:hello@bookourspot.com">hello@bookourspot.com</a>; we will coordinate with the organiser and communicate the applicable resolution. Do not assume a booking is refundable unless its displayed terms say so.</p></section>
          <section><h2 className="text-lg font-semibold text-white">Support and updates</h2><p>For booking, account or privacy questions, email <a className="text-violet-200 underline" href="mailto:hello@bookourspot.com">hello@bookourspot.com</a>. These terms may be updated by posting a revised version here. The version in effect when you book applies, except where law requires otherwise.</p></section>
        </>}
        <section className="border-t border-white/10 pt-5 text-xs leading-6 text-zinc-500"><p>BookOutSpot · Chennai · <a className="text-violet-200 underline" href="mailto:hello@bookourspot.com">hello@bookourspot.com</a></p></section>
      </article>
      <nav className="flex gap-5 py-6 text-sm text-zinc-400"><a href="/terms" className="hover:text-white">Terms</a><a href="/privacy" className="hover:text-white">Privacy</a><a href="mailto:hello@bookourspot.com" className="hover:text-white">Support</a></nav>
    </div>
  </main>;
}
