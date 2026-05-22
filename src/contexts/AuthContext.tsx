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
  loading: boolean;   // true until BOTH auth AND profile are resolved
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
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  console.log('fetchProfile result:', { data, error, userId });  // already there
  setProfile(data ?? null);
  setLoading(false);  // ← ADD THIS LINE
};

  useEffect(() => {
  // Safety net — never stay loading more than 5 seconds
  const timeout = setTimeout(() => setLoading(false), 5000);

  // Get initial session + profile together
  supabase.auth.getSession().then(async ({ data }) => {
    clearTimeout(timeout);
    const sessionUser = data.session?.user ?? null;
    setSession(data.session);
    setUser(sessionUser);

    if (sessionUser) {
      await fetchProfile(sessionUser.id);
    }
    setLoading(false);
  });

  // Listen for auth changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (_event, session) => {
      const sessionUser = session?.user ?? null;
      setSession(session);
      setUser(sessionUser);

      if (sessionUser) {
        await fetchProfile(sessionUser.id);
      } else {
        setProfile(null);
      }
      setLoading(false);

      // inside onAuthStateChange, after setLoading(false):
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