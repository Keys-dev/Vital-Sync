import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuthContext }              from '@/contexts/AuthContext';
import { supabase }                   from '@/lib/supabase';

export type UserRole = 'doctor' | 'family';

export interface Profile {
  id:         string;
  email:      string;
  role:       UserRole;
  full_name:  string;
  created_at: string;
}

interface UseProfileReturn {
  profile:        Profile | null;
  loading:        boolean;
  error:          string | null;
  refetchProfile: () => Promise<void>;
  updateProfile:  (data: { full_name?: string; email?: string }) => Promise<void>;
}

export function useProfile(): UseProfileReturn {
  const { user, loading: authLoading } = useAuthContext();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const fetchedForId = useRef<string | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);

    const { data, error: sbError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (sbError) setError(sbError.message);
    else         setProfile(data);

    setLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setProfile(null);
      setLoading(false);
      fetchedForId.current = null;
      return;
    }
    if (fetchedForId.current !== user.id) {
      fetchedForId.current = user.id;
      fetchProfile(user.id);
    }
  }, [user?.id, authLoading, fetchProfile]);

  const updateProfile = useCallback(async (data: { full_name?: string; email?: string }) => {
    if (!user) throw new Error('Not authenticated');

    // Update profiles table
    if (data.full_name !== undefined) {
      const { error: pErr } = await supabase
        .from('profiles')
        .update({ full_name: data.full_name.trim() })
        .eq('id', user.id);
      if (pErr) throw new Error(pErr.message);
    }

    // Update auth email if changed
    if (data.email !== undefined && data.email !== profile?.email) {
      const { error: eErr } = await supabase.auth.updateUser({ email: data.email.trim() });
      if (eErr) throw new Error(eErr.message);
    }

    // Refresh local state
    await fetchProfile(user.id);
  }, [user, profile?.email, fetchProfile]);

  return { profile, loading, error, refetchProfile: () => fetchProfile(user!.id), updateProfile };
}