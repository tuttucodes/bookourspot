import { ALL_EVENTS } from '../../src/data/eventsData.js';

const databaseConfig = () => {
  const rawUrl = process.env.SUPABASE_URL;
  let url = '';
  try {
    const parsed = new URL(rawUrl || '');
    if (parsed.protocol === 'https:') url = parsed.origin;
  } catch {}
  return { url, key: process.env.SUPABASE_SERVICE_ROLE_KEY };
};

export function hasManagedEventsConfig() {
  const { url, key } = databaseConfig();
  return Boolean(url && key);
}

async function tableRequest(path, options = {}) {
  const { url, key } = databaseConfig();
  if (!url || !key) throw new Error('Event storage is not configured.');
  const response = await fetch(`${url}/rest/v1/managed_events${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Accept-Profile': 'public',
      'Content-Profile': 'public',
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    cache: 'no-store'
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(body?.message || 'Event storage is unavailable.');
    error.status = response.status;
    error.code = body?.code;
    throw error;
  }
  return body;
}

export async function listManagedEvents() {
  return tableRequest('?select=event_id,status,event_data,updated_at&order=updated_at.desc');
}

export async function saveManagedEvent(eventId, status, eventData) {
  const query = `?on_conflict=event_id`;
  return tableRequest(query, {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify([{ event_id: eventId, status, event_data: eventData }])
  });
}

export function mergePublicEvents(rows) {
  const events = new Map(ALL_EVENTS.map((event) => [event.id, event]));
  for (const row of rows || []) {
    if (row.status === 'PUBLISHED') events.set(row.event_id, row.event_data);
    else events.delete(row.event_id);
  }
  return [...events.values()];
}
