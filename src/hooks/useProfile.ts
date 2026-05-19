import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useSupabase } from './useSupabase';

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
  const { user, isLoaded } = useUser();
  const supabase            = useSupabase();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    const { data, error: sbError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (sbError) setError(sbError.message);
    else         setProfile(data);

    setLoading(false);
  };

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { setProfile(null); setLoading(false); return; }
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isLoaded]);

  return { profile, loading, error, refetchProfile: fetchProfile };
}