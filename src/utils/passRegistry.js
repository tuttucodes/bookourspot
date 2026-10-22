// Persistent Pass Registry & Verification Engine with Supabase Cloud Backend
import { syncPassesToSupabase, updateAdmissionInSupabase, fetchPassesFromSupabase } from './supabaseClient.js';

const STORAGE_KEY = 'bookourspot_passes_v2';

export function getStoredPasses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read passes from storage:', err);
    return [];
  }
}

export function clearStoredPasses() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('halloween_affair_passes_v1');
    window.dispatchEvent(new Event('pass_registry_updated'));
  } catch (err) {
    console.error('Failed to clear passes:', err);
  }
}

export function savePasses(newPasses) {
  try {
    const existing = getStoredPasses();
    const combined = [...newPasses, ...existing];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(combined));
    
    // Dispatch local storage event so all components/tabs update immediately
    window.dispatchEvent(new Event('pass_registry_updated'));

    // Asynchronously push each new pass to Supabase cloud database
    syncPassesToSupabase(newPasses).catch(err => {
      console.warn('Background Supabase sync notice:', err);
    });

    return combined;
  } catch (err) {
    console.error('Failed to save passes to storage:', err);
    return [];
  }
}

export function generateUniquePassId(index = 1, total = 1) {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 5; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const suffix = String(index).padStart(2, '0');
  return `BOS-${rand}-P${suffix}`;
}

export function markPassAdmitted(passId) {
  try {
    const passes = getStoredPasses();
    let isNowAdmitted = false;
    const updated = passes.map(p => {
      if (p.id === passId) {
        isNowAdmitted = p.status !== 'ADMITTED';
        return {
          ...p,
          status: isNowAdmitted ? 'ADMITTED' : 'VALID',
          admittedAt: isNowAdmitted ? new Date().toISOString() : null
        };
      }
      return p;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('pass_registry_updated'));

    // Sync door admission status to Supabase cloud
    updateAdmissionInSupabase(passId, isNowAdmitted).catch(err => {
      console.warn('Background Supabase admission sync notice:', err);
    });

    return updated;
  } catch (err) {
    console.error('Failed to update pass status:', err);
    return [];
  }
}

/**
 * Sync fresh passes from Supabase cloud into local storage for the host terminal
 */
export async function refreshFromSupabase() {
  try {
    const cloudPasses = await fetchPassesFromSupabase();
    if (cloudPasses && cloudPasses.length > 0) {
      const local = getStoredPasses();
      // Merge unique passes by id
      const map = new Map();
      local.forEach(p => map.set(p.id, p));
      cloudPasses.forEach(p => map.set(p.id, p));
      const merged = Array.from(map.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      window.dispatchEvent(new Event('pass_registry_updated'));
      return merged;
    }
  } catch (err) {
    console.warn('Could not refresh from Supabase cloud:', err);
  }
  return getStoredPasses();
}

export function exportGuestListCsv(passes) {
  if (!passes || passes.length === 0) {
    alert('No passes issued yet to export.');
    return;
  }

  const headers = ['Pass ID', 'Guest Name', 'Guest Phone', 'Booker Name', 'Instagram', 'Tier', 'Amount (INR)', 'UTR', 'Status', 'Issued At', 'Admitted At'];
  const rows = passes.map(p => [
    `"${p.id}"`,
    `"${p.guestName}"`,
    `"${p.guestPhone || p.phone || ''}"`,
    `"${p.bookerName}"`,
    `"${p.instagram || ''}"`,
    `"${p.tierName}"`,
    p.price,
    `"${p.utr}"`,
    `"${p.status}"`,
    `"${new Date(p.issuedAt).toLocaleString('en-IN')}"`,
    `"${p.admittedAt ? new Date(p.admittedAt).toLocaleString('en-IN') : 'N/A'}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Halloween_Affair_Door_Guestlist_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
