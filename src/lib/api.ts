import { createClient } from './supabase/client';
import { getPublicSiteUrl } from './env';
import type { Business, Service, Appointment, User, StaffMember } from './types';

// Lazy client — avoids module-level initialization during SSR/prerender
function supabase() {
  return createClient();
}

// ============================================
// AUTH
// ============================================
export async function signUp(email: string, password: string, name: string, role: 'customer' | 'merchant' = 'customer') {
  const { data, error } = await supabase().auth.signUp({
    email,
    password,
    options: { data: { name, role } },
  });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase().auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

function oauthRedirectBase(): string {
  if (typeof window === 'undefined') return '';
  const canonical = getPublicSiteUrl();
  return canonical || window.location.origin;
}

export async function signInWithGoogle(
  redirectTo?: string,
  userMetadata?: { name?: string; role?: 'customer' | 'merchant' }
) {
  const base = oauthRedirectBase();
  const fallback = `${base}/auth/callback`;
  const { data, error } = await supabase().auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectTo || fallback,
      // Force Google account picker every time. Without prompt=select_account,
      // Google auto-selects the last-used account, which surprises users who
      // just signed out expecting to pick a different identity.
      queryParams: {
        prompt: 'select_account',
        access_type: 'offline',
      },
      ...(userMetadata && Object.keys(userMetadata).length > 0
        ? { data: userMetadata }
        : {}),
    },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase().auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase().auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase()
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile as User | null;
}

// ============================================
// BUSINESSES
// ============================================
export async function getBusinesses(category?: string, search?: string) {
  let query = supabase().from('businesses').select('*').eq('is_active', true);
  if (category && category !== 'all') query = query.eq('category', category);
  if (search) query = query.ilike('name', `%${search}%`);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data as Business[];
}

export async function getBusiness(id: string) {
  const { data, error } = await supabase()
    .from('businesses')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Business;
}

export async function getBusinessBySlug(slug: string) {
  const { data, error } = await supabase()
    .from('businesses')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();
  if (error) throw error;
  return data as Business;
}

export async function getMyBusiness() {
  const sb = supabase();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;

  // First: business they legally own.
  const owned = await sb
    .from('businesses')
    .select('*')
    .eq('owner_id', user.id)
    .maybeSingle();
  if (owned.data) return owned.data as Business;

  // Fallback: business they collaborate on (e.g. co-manager / staff-level access).
  const { data: collab } = await sb
    .from('business_collaborators')
    .select('business:businesses(*)')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();
  const collabBiz = (collab?.business ?? null) as Business | Business[] | null;
  if (Array.isArray(collabBiz)) return (collabBiz[0] ?? null) as Business | null;
  return collabBiz;
}

export async function createBusiness(business: Partial<Business>) {
  const { data, error } = await supabase().from('businesses').insert(business).select().single();
  if (error) throw error;
  return data as Business;
}

export async function updateBusiness(id: string, updates: Partial<Business>) {
  const { data, error } = await supabase()
    .from('businesses')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Business;
}

// ============================================
// SERVICES
// ============================================
export async function getServices(businessId: string) {
  const { data, error } = await supabase()
    .from('services')
    .select('*')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .order('price', { ascending: true });
  if (error) throw error;
  return data as Service[];
}

export async function createService(service: Partial<Service>) {
  const { data, error } = await supabase().from('services').insert(service).select().single();
  if (error) throw error;
  return data as Service;
}

export async function updateService(id: string, updates: Partial<Service>) {
  const { data, error } = await supabase()
    .from('services')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Service;
}

export async function deleteService(id: string) {
  const { error } = await supabase().from('services').update({ is_active: false }).eq('id', id);
  if (error) throw error;
}

// ============================================
// STAFF
// ============================================
export async function getBusinessStaff(businessId: string) {
  const { data, error } = await supabase()
    .from('business_staff')
    .select('*')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as StaffMember[];
}

export async function createStaffMember(staff: Partial<StaffMember>) {
  const { data, error } = await supabase().from('business_staff').insert(staff).select().single();
  if (error) throw error;
  return data as StaffMember;
}

export async function updateStaffMember(id: string, updates: Partial<StaffMember>) {
  const { data, error } = await supabase()
    .from('business_staff')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as StaffMember;
}

export async function deleteStaffMember(id: string) {
  const { error } = await supabase().from('business_staff').update({ is_active: false }).eq('id', id);
  if (error) throw error;
}

// ============================================
// APPOINTMENTS
// ============================================
export async function getAvailableSlots(businessId: string, date: string) {
  const { data, error } = await supabase()
    .from('appointments')
    .select('start_time, end_time, status')
    .eq('business_id', businessId)
    .eq('date', date)
    .neq('status', 'cancelled');
  if (error) throw error;
  return data;
}

export async function bookAppointment(appointment: {
  business_id: string;
  service_id: string;
  date: string;
  start_time: string;
  end_time: string;
  notes?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
}) {
  const response = await fetch('/api/appointments/book', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(appointment),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload && typeof payload.error === 'string'
      ? payload.error
      : 'Failed to book appointment.';
    throw new Error(message);
  }

  return payload.data as Appointment;
}

export async function getMyBookings(userId: string) {
  const { data, error } = await supabase()
    .from('appointments')
    .select('*, service:services(*), business:businesses(*)')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (error) throw error;
  return data as Appointment[];
}

export async function getBusinessAppointments(businessId: string, date?: string) {
  let query = supabase()
    .from('appointments')
    .select('*, service:services(*), user:users(*)')
    .eq('business_id', businessId);
  if (date) query = query.eq('date', date);
  const { data, error } = await query.order('date', { ascending: true }).order('start_time', { ascending: true });
  if (error) throw error;
  return data as Appointment[];
}

export async function cancelAppointment(id: string) {
  const { data, error } = await supabase()
    .from('appointments')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Appointment;
}

export async function markAsCompleted(id: string) {
  const sb = supabase();
  const { data, error } = await sb
    .from('appointments')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;

  const { error: txErr } = await sb
    .from('transactions')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('appointment_id', id);
  if (txErr) throw txErr;

  return data as Appointment;
}

// ============================================
// DASHBOARD STATS
// ============================================
export async function getDashboardStats(businessId: string) {
  const sb = supabase();
  const today = new Date().toISOString().split('T')[0];

  // Revenue pulls directly via transactions.business_id (backfilled by
  // migration 20260419190000). Avoids the old pattern of fetching every
  // appointment id and passing them as an IN list — that scaled linearly with
  // booking history and was the main cause of slow dashboards.
  const [totalRes, todayRes, completedRes, revenueRes] = await Promise.all([
    sb
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId),
    sb
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('date', today)
      .eq('status', 'booked'),
    sb
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('status', 'completed'),
    sb
      .from('transactions')
      .select('amount')
      .eq('business_id', businessId)
      .eq('status', 'completed'),
  ]);

  const totalRevenue =
    revenueRes.data?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

  return {
    totalBookings: totalRes.count || 0,
    todayBookings: todayRes.count || 0,
    completedServices: completedRes.count || 0,
    totalRevenue,
  };
}

export async function getBusinessCustomers(businessId: string) {
  const { data, error } = await supabase()
    .from('appointments')
    .select('user:users(id, name, email, phone), date, status, service:services(name, price)')
    .eq('business_id', businessId)
    .order('date', { ascending: false });
  if (error) throw error;
  return data;
}

// ============================================
// USER PROFILE
// ============================================
export async function updateUserProfile(id: string, updates: Partial<User>) {
  const { data, error } = await supabase()
    .from('users')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as User;
}
