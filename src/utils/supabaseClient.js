import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || 'https://zthpbzpevdvnbxmmlxay.supabase.co';
const supabaseKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY) || 'sb_publishable_FCWQmtAWx1NlYdU2h4rDbA_WFsBRhXu';

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Synchronize passes to Supabase cloud database
 */
export async function syncPassesToSupabase(passes) {
  if (!passes || passes.length === 0) return { success: true };

  try {
    const records = passes.map(p => ({
      id: p.id,
      guest_name: p.guestName,
      guest_phone: p.guestPhone || p.phone,
      booker_name: p.bookerName,
      phone: p.phone,
      instagram: p.instagram || null,
      tier_name: p.tierName,
      tier_type: p.tierType,
      price: p.price,
      utr: p.utr,
      status: p.status || 'LOGGED_PENDING_AUDIT',
      created_at: p.issuedAt || new Date().toISOString(),
      admitted_at: p.admittedAt || null
    }));

    const { data, error } = await supabase
      .from('passes')
      .upsert(records, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase sync warning (table might need creation in SQL editor):', error.message);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.warn('Supabase sync error (handled safely):', err);
    return { success: false, error: err };
  }
}

/**
 * Update admission status in Supabase cloud
 */
export async function updateAdmissionInSupabase(passId, isAdmitted) {
  try {
    const { data, error } = await supabase
      .from('passes')
      .update({
        status: isAdmitted ? 'ADMITTED' : 'LOGGED_PENDING_AUDIT',
        admitted_at: isAdmitted ? new Date().toISOString() : null
      })
      .eq('id', passId);

    if (error) {
      console.warn('Supabase admission update warning:', error.message);
    }
    return { success: !error, data };
  } catch (err) {
    console.warn('Supabase admission update error:', err);
    return { success: false, error: err };
  }
}

/**
 * Fetch all passes from Supabase cloud database
 */
export async function fetchPassesFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('passes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return null;
    }

    // Map database snake_case back to frontend camelCase
    return data.map(r => ({
      id: r.id,
      guestName: r.guest_name,
      guestPhone: r.guest_phone,
      bookerName: r.booker_name,
      phone: r.phone,
      instagram: r.instagram,
      tierName: r.tier_name,
      tierType: r.tier_type,
      price: r.price,
      utr: r.utr,
      status: r.status,
      issuedAt: r.created_at,
      admittedAt: r.admitted_at
    }));
  } catch (err) {
    return null;
  }
}
