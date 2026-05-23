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
    setProfile({
      id: userId,
      email: '',
      role: 'doctor',
      full_name: '',
    } as Profile);
    setLoading(false);
    console.log('fetchProfile DONE - hardcoded');
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