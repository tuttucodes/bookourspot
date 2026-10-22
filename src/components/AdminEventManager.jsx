import React, { useEffect, useMemo, useState } from 'react';
import { firebaseAuth } from '../utils/firebaseClient';

const emptyForm = () => ({
  id: '', title: '', subtitle: '', category: 'Nightlife', dates: '', time: '', venue: '',
  about: '', coverImage: '', status: 'DRAFT', isFeatured: false
});
const venueText = (venue) => typeof venue === 'string' ? venue : venue?.shortName || venue?.name || '';
const formFromEvent = (event, status) => ({
  id: event.id || '', title: event.title || '', subtitle: event.subtitle || '', category: event.category || '',
  dates: event.dates || event.dateLabel || '', time: event.time || '', venue: venueText(event.venue),
  about: event.about || '', coverImage: event.coverImage || '', status: status || 'PUBLISHED',
  isFeatured: Boolean(event.isFeatured)
});

export default function AdminEventManager() {
  const [events, setEvents] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const selected = useMemo(() => events.find((item) => item.event.id === selectedId), [events, selectedId]);
  const loadEvents = async (preferredId = '') => {
    setLoading(true); setError('');
    try {
      const user = firebaseAuth?.currentUser;
      if (!user) throw new Error('Sign in again to manage events.');
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/events', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Could not load events.');
      const list = Array.isArray(result.events) ? result.events : [];
      setEvents(list);
      const id = preferredId || selectedId || list[0]?.event?.id || '';
      setSelectedId(id);
      const entry = list.find((item) => item.event.id === id);
      if (entry && !isNew) setForm(formFromEvent(entry.event, entry.status));
    } catch (err) { setError(err.message || 'Could not load events.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadEvents(); }, []);

  const chooseEvent = (id) => {
    setSelectedId(id); setIsNew(false); setError(''); setNotice('');
    const entry = events.find((item) => item.event.id === id);
    if (entry) setForm(formFromEvent(entry.event, entry.status));
  };

  const startNew = () => {
    setIsNew(true); setSelectedId(''); setForm(emptyForm()); setError(''); setNotice('');
  };

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    const id = (form.id || form.title).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    try {
      const user = firebaseAuth?.currentUser;
      if (!user) throw new Error('Sign in again to save this event.');
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/events', {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, id })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Could not save event.');
      setNotice(isNew ? 'Event created.' : 'Event updated.');
      setIsNew(false);
      await loadEvents(id);
    } catch (err) { setError(err.message || 'Could not save event.'); }
    finally { setSaving(false); }
  };

  const field = (label, key, options = {}) => <label className={options.className || ''}>
    <span className="mb-1.5 block text-xs font-medium text-zinc-400">{label}</span>
    {options.multiline ? <textarea required={options.required !== false} value={form[key]} onChange={(e) => update(key, e.target.value)} rows={options.rows || 4} maxLength={options.maxLength || 5000} className="w-full resize-y rounded-xl border border-white/10 bg-black/25 px-3.5 py-3 text-sm text-white outline-none focus:border-violet-200/50" />
      : <input required={options.required !== false} type="text" value={form[key]} onChange={(e) => update(key, e.target.value)} maxLength={options.maxLength || 220} className="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3.5 text-sm text-white outline-none focus:border-violet-200/50" />}
  </label>;

  return <section className="mt-7">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-violet-200">Event catalogue</p><h2 className="mt-1 text-xl font-semibold">Create and edit events</h2><p className="mt-1 max-w-2xl text-sm text-zinc-400">Save event details as a draft or publish them to the public discovery feed. Only the Halloween event currently has checkout enabled.</p></div>
      <button type="button" onClick={startNew} className="h-10 shrink-0 rounded-full bg-violet-200 px-5 text-sm font-semibold text-[#201331]">Create event</button>
    </div>

    {error && <p role="alert" className="mt-4 rounded-xl border border-rose-200/15 bg-rose-100/[0.06] px-4 py-3 text-sm text-rose-100">{error}</p>}
    {notice && <p role="status" className="mt-4 rounded-xl border border-emerald-200/15 bg-emerald-100/[0.06] px-4 py-3 text-sm text-emerald-100">{notice}</p>}

    <div className="mt-5 grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-white/10 bg-white/[0.025] p-3">
        <p className="px-2 pb-2 text-[11px] uppercase tracking-[.15em] text-zinc-500">Events · {events.length}</p>
        {loading ? <p className="px-2 py-5 text-sm text-zinc-500">Loading…</p> : <div className="max-h-[540px] space-y-1 overflow-y-auto">
          {events.map((item) => <button type="button" key={item.event.id} onClick={() => chooseEvent(item.event.id)} className={`w-full rounded-xl px-3 py-3 text-left transition ${!isNew && selectedId === item.event.id ? 'bg-violet-200/10 text-white' : 'text-zinc-300 hover:bg-white/5'}`}><span className="block truncate text-sm font-medium">{item.event.title}</span><span className="mt-1 block text-[11px] text-zinc-500">{item.status} · {item.managed ? 'Managed' : 'Seed event'}</span></button>)}
        </div>}
      </aside>

      <form onSubmit={save} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-[.14em] text-zinc-500">{isNew ? 'New event' : selected?.event.id || 'Select an event'}</p><h3 className="mt-1 text-lg font-semibold">{isNew ? 'Event details' : form.title || 'Event details'}</h3></div><span className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-400">{isNew ? 'Not saved' : form.status}</span></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label><span className="mb-1.5 block text-xs font-medium text-zinc-400">Event ID (URL-safe)</span><input type="text" value={form.id} readOnly={!isNew} onChange={(e) => update('id', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 80))} placeholder="Generated from title if blank" maxLength={80} className="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3.5 text-sm text-white outline-none focus:border-violet-200/50 read-only:opacity-65" /></label>
          {field('Category', 'category', { maxLength: 60 })}
          {field('Event title', 'title', { maxLength: 120 })}
          {field('Short summary', 'subtitle', { maxLength: 220 })}
          {field('Date / date range', 'dates', { maxLength: 160 })}
          {field('Time', 'time', { maxLength: 100 })}
          {field('Venue', 'venue', { maxLength: 180 })}
          {field('Cover image URL or site path', 'coverImage', { maxLength: 1000 })}
          {field('Event description', 'about', { multiline: true, className: 'sm:col-span-2', rows: 6 })}
          <label><span className="mb-1.5 block text-xs font-medium text-zinc-400">Visibility</span><select value={form.status} onChange={(e) => update('status', e.target.value)} className="h-11 w-full rounded-xl border border-white/10 bg-[#17141e] px-3.5 text-sm text-white"><option value="DRAFT">Draft · hidden</option><option value="PUBLISHED">Published · public feed</option><option value="ARCHIVED">Archived · hidden</option></select></label>
          <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/15 px-3.5 py-3 text-sm text-zinc-300"><input type="checkbox" checked={form.isFeatured} onChange={(e) => update('isFeatured', e.target.checked)} className="h-4 w-4 accent-violet-300" /> Feature on discovery</label>
        </div>
        <p className="mt-4 rounded-xl border border-amber-100/10 bg-amber-50/[0.035] p-3 text-xs leading-relaxed text-amber-50/75">Creating and publishing event pages is enabled here. Ticket sales remain closed for new events until pricing and inventory are connected to checkout; this prevents publishing a button that takes payment for an unconfigured event.</p>
        <div className="mt-5 flex flex-wrap items-center gap-3"><button disabled={saving || loading} type="submit" className="h-11 rounded-full bg-white px-6 text-sm font-semibold text-black disabled:opacity-50">{saving ? 'Saving…' : isNew ? 'Create event' : 'Save changes'}</button>{!isNew && <button type="button" onClick={() => selected && setForm(formFromEvent(selected.event, selected.status))} className="h-11 rounded-full border border-white/15 px-5 text-sm text-zinc-300">Reset changes</button>}</div>
      </form>
    </div>
  </section>;
}
