import { hasManagedEventsConfig, listManagedEvents, mergePublicEvents } from './_lib/managed-events.js';
import { ALL_EVENTS } from '../src/data/eventsData.js';

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  if (request.method !== 'GET') return response.status(405).json({ error: 'Method not allowed.' });
  if (!hasManagedEventsConfig()) return response.status(200).json({ events: ALL_EVENTS });
  try {
    const rows = await listManagedEvents();
    return response.status(200).json({ events: mergePublicEvents(rows) });
  } catch {
    // Keep discovery available during a temporary database outage.
    return response.status(200).json({ events: ALL_EVENTS, source: 'fallback' });
  }
}
