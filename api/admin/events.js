import { ALL_EVENTS } from '../../src/data/eventsData.js';
import { requireAdmin } from '../_lib/admin-auth.js';
import { hasManagedEventsConfig, listManagedEvents, saveManagedEvent } from '../_lib/managed-events.js';

const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const cleanText = (value, max) => typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, max) : '';
const validImage = (value) => typeof value === 'string' && value.length <= 1000
  && (value.startsWith('/') && !value.startsWith('//') || /^https:\/\//i.test(value));

function eventForSave(input, base) {
  const id = cleanText(input?.id, 80).toLowerCase();
  const title = cleanText(input?.title, 120);
  const subtitle = cleanText(input?.subtitle, 220);
  const category = cleanText(input?.category, 60);
  const dates = cleanText(input?.dates, 160);
  const time = cleanText(input?.time, 100);
  const venueName = cleanText(input?.venue, 180);
  const about = typeof input?.about === 'string' ? input.about.trim().slice(0, 5000) : '';
  const coverImage = cleanText(input?.coverImage, 1000);
  const status = ['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(input?.status) ? input.status : 'DRAFT';
  if (!idPattern.test(id) || title.length < 4 || !subtitle || !category || !dates || !time || !venueName || !about || !validImage(coverImage)) return null;

  const event = {
    ...(base || {}),
    id,
    slug: cleanText(input?.slug, 120) || id,
    title,
    subtitle,
    category,
    tags: Array.isArray(base?.tags) ? base.tags : [category],
    dates,
    dateLabel: dates,
    dateSubtitle: dates,
    time,
    price: base?.price ?? null,
    priceLabel: base?.priceLabel || 'Bookings unavailable right now',
    venue: typeof base?.venue === 'object' && base.venue ? { ...base.venue, name: venueName, shortName: venueName, address: venueName } : { name: venueName, shortName: venueName, address: venueName },
    timing: { ...(base?.timing || {}), startsAt: dates, scheduleSubtitle: time },
    availableDates: Array.isArray(base?.availableDates) && base.availableDates.length
      ? base.availableDates.map((date, index) => index === 0 ? { ...date, label: dates, timing: time } : date)
      : base?.availableDates,
    coverImage,
    thumbnail: coverImage,
    gallery: Array.isArray(base?.gallery) ? base.gallery : [],
    about,
    thingsToKnow: Array.isArray(base?.thingsToKnow) ? base.thingsToKnow : ['Event details are supplied by the organiser.'],
    isBookable: base?.isBookable === true && id === 'halloween-affair',
    isFeatured: input?.isFeatured === true,
    badge: status === 'PUBLISHED' ? undefined : 'DRAFT'
  };
  return { id, status, event };
}

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  if (!['GET', 'POST', 'PATCH'].includes(request.method)) return response.status(405).json({ error: 'Method not allowed.' });
  const access = await requireAdmin(request);
  if (access.error) return response.status(access.status).json({ error: access.error });
  if (!hasManagedEventsConfig()) return response.status(503).json({ error: 'Event storage is not configured on the server.' });
  try {
    const rows = await listManagedEvents();
    if (request.method === 'GET') {
      const byId = new Map((rows || []).map((row) => [row.event_id, row]));
      const events = [...ALL_EVENTS.map((event) => ({ event, status: 'PUBLISHED', updatedAt: null, managed: false })),
        ...(rows || []).filter((row) => !ALL_EVENTS.some((event) => event.id === row.event_id)).map((row) => ({ event: row.event_data, status: row.status, updatedAt: row.updated_at, managed: true }))]
        .map((item) => {
          const row = byId.get(item.event.id);
          return row ? { event: row.event_data, status: row.status, updatedAt: row.updated_at, managed: true } : item;
        });
      return response.status(200).json({ events });
    }

    const body = request.body || {};
    const eventId = cleanText(body.id, 80).toLowerCase();
    if (request.method === 'PATCH' && !rows.some((row) => row.event_id === eventId) && !ALL_EVENTS.some((event) => event.id === eventId)) {
      return response.status(404).json({ error: 'Event not found.' });
    }
    const base = rows.find((row) => row.event_id === eventId)?.event_data || ALL_EVENTS.find((event) => event.id === eventId) || null;
    if (request.method === 'POST' && (base || !eventId)) return response.status(409).json({ error: 'That event ID already exists or is invalid.' });
    const saved = eventForSave(body, base);
    if (!saved) return response.status(400).json({ error: 'Complete the event title, summary, category, date, time, venue, description, and a secure image URL.' });
    const [row] = await saveManagedEvent(saved.id, saved.status, saved.event);
    return response.status(request.method === 'POST' ? 201 : 200).json({ event: row?.event_data || saved.event, status: row?.status || saved.status });
  } catch (error) {
    const status = error.status === 404 ? 503 : 503;
    return response.status(status).json({ error: 'Event storage is unavailable. Apply the managed events database migration, then try again.' });
  }
}
