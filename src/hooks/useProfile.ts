import { useEffect, useRef, useState } from 'react';
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
}

export function useProfile(): UseProfileReturn {
  const { user, loading: authLoading } = useAuthContext();

  const [profile,      setProfile]      = useState<Profile | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  // Track which userId we last fetched for — prevents double-fetches
  const fetchedForId = useRef<string | null>(null);

  const fetchProfile = async (userId: string) => {
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
  };

  useEffect(() => {
    // Still waiting for Supabase to resolve the session — stay in loading
    if (authLoading) return;

    // Auth resolved and there is no user
    if (!user) {
      setProfile(null);
      setLoading(false);
      fetchedForId.current = null;
      return;
    }

    // Already fetched for this user — don't fetch again
    if (fetchedForId.current === user.id) return;

    fetchedForId.current = user.id;
    fetchProfile(user.id);
  }, [user?.id, authLoading]);

  const refetchProfile = async () => {
    if (user) {
      fetchedForId.current = null; // force a fresh fetch
      await fetchProfile(user.id);
    }
  };

  return { profile, loading, error, refetchProfile };
}