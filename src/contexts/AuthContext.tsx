import { requestNotificationPermission } from '@/services/notifications';
import {
  createContext, useContext, useEffect, useState, type ReactNode,
} from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/hooks/useProfile';

interface AuthContextValue {
  user:    User    | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null, session: null, profile: null, loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User    | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
  console.log('fetchProfile START', userId);
  
  const { data: { user } } = await supabase.auth.getUser();
  console.log('fetchProfile auth user', user);
  
  if (user) {
    // Get role from profiles table with a short timeout fallback
    const profilePromise = supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: new Error('timeout') }), 3000)
    );

    const { data } = await Promise.race([profilePromise, timeoutPromise]);
    console.log('fetchProfile DONE', data);

    if (data) {
      setProfile(data as Profile);
    } else {
      // Fallback to auth metadata
      console.log('fetchProfile using metadata fallback');
      setProfile({
        id: user.id,
        email: user.email ?? '',
        role: 'doctor',
        full_name: user.user_metadata?.full_name ?? '',
      } as Profile);
    }
  }
  
  setLoading(false);
};

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 5000);

    supabase.auth.getSession().then(async ({ data }) => {
      clearTimeout(timeout);
      const sessionUser = data.session?.user ?? null;
      setSession(data.session);
      setUser(sessionUser);
      if (sessionUser) {
        await fetchProfile(sessionUser.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('onAuthStateChange fired', event, session?.user?.id);

        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }
        if (event !== 'SIGNED_IN') return;

        const sessionUser = session?.user ?? null;
        setSession(session);
        setUser(sessionUser);
        if (sessionUser) {
          await fetchProfile(sessionUser.id);
        }
        if (sessionUser) {
          requestNotificationPermission();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthContext = () => useContext(AuthContext);