import { useMemo } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { makeSupabaseClient } from '@/lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Returns a stable Supabase client bound to the current Clerk session.
 * Rebuilt only when the logged-in user changes.
 */
export function useSupabase(): SupabaseClient {
  const { getToken, userId } = useAuth();

  return useMemo(() => {
    return makeSupabaseClient(async () => {
      return await getToken({ template: 'supabase' });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);
}