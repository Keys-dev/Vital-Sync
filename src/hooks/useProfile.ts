import { useEffect, useState, useRef } from 'react';
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

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true); // stay true until we know for sure
  const [error,   setError]   = useState<string | null>(null);
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
    // Still waiting for auth to initialise — stay in loading state
    if (authLoading) return;

    // Auth resolved: no user logged in
    if (!user) {
      setProfile(null);
      setLoading(false);
      fetchedForId.current = null;
      return;
    }

    // User is logged in — fetch profile if we haven't already for this user
    if (fetchedForId.current !== user.id) {
      fetchedForId.current = user.id;
      fetchProfile(user.id);
    }
  }, [user?.id, authLoading]);

  return { profile, loading, error, refetchProfile: () => fetchProfile(user!.id) };
}