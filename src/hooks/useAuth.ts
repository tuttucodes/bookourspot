'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@/lib/types';
import type { User as AuthUser } from '@supabase/supabase-js';

export function useAuth() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase.from('users').select('*').eq('id', userId).single();
    setProfile(data as User | null);
  }, [supabase]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setAuthUser(user);
      if (user) await fetchProfile(user.id);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setAuthUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile]);

  const refetchProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await fetchProfile(user.id);
  }, [supabase, fetchProfile]);

  return { authUser, profile, loading, refetchProfile };
}
