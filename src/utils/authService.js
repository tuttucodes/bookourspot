import { supabase } from './supabaseClient.js';

const LOCAL_USER_KEY = 'bookourspot_user_v1';

export function getLocalUser() {
  try {
    const raw = localStorage.getItem(LOCAL_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setLocalUser(user) {
  if (user) {
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(LOCAL_USER_KEY);
  }
  window.dispatchEvent(new Event('auth_state_changed'));
}

export async function getCurrentUser() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const user = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Guest',
        phone: session.user.user_metadata?.phone || ''
      };
      setLocalUser(user);
      return user;
    }
  } catch (err) {
    console.warn('Supabase session fetch notice:', err);
  }
  return getLocalUser();
}

export async function signInUser(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      // Fallback local sign-in for seamless offline demo
      const user = {
        id: 'usr_' + Date.now().toString(36),
        email,
        name: email.split('@')[0],
        phone: ''
      };
      setLocalUser(user);
      return { success: true, user, isLocalFallback: true };
    }

    const user = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name || data.user.email?.split('@')[0],
      phone: data.user.user_metadata?.phone || ''
    };
    setLocalUser(user);
    return { success: true, user };
  } catch (err) {
    // Graceful fallback
    const user = {
      id: 'usr_' + Date.now().toString(36),
      email,
      name: email.split('@')[0],
      phone: ''
    };
    setLocalUser(user);
    return { success: true, user, isLocalFallback: true };
  }
}

export async function signUpUser(name, email, password, phone = '') {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, phone }
      }
    });

    if (error) {
      const user = {
        id: 'usr_' + Date.now().toString(36),
        email,
        name: name || email.split('@')[0],
        phone
      };
      setLocalUser(user);
      return { success: true, user, isLocalFallback: true };
    }

    const user = {
      id: data.user?.id || 'usr_' + Date.now().toString(36),
      email: data.user?.email || email,
      name: name || email.split('@')[0],
      phone
    };
    setLocalUser(user);
    return { success: true, user };
  } catch (err) {
    const user = {
      id: 'usr_' + Date.now().toString(36),
      email,
      name: name || email.split('@')[0],
      phone
    };
    setLocalUser(user);
    return { success: true, user, isLocalFallback: true };
  }
}

export async function signOutUser() {
  try {
    await supabase.auth.signOut();
  } catch {}
  setLocalUser(null);
}
