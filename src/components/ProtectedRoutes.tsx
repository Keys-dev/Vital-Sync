import { Navigate, Outlet } from 'react-router-dom';
import { useAuthContext }    from '@/contexts/AuthContext';
import { useProfile }        from '@/hooks/useProfile';
import type { UserRole }     from '@/hooks/useProfile';

interface Props {
  requiredRole?: UserRole;
  /** Pass true for routes that should only be shown to logged-OUT users */
  guestOnly?: boolean;
}

export default function ProtectedRoute({ requiredRole, guestOnly }: Props) {
  const { user, loading: authLoading } = useAuthContext();
  const { profile, loading: profileLoading } = useProfile();

  // Wait for both auth state and profile fetch to resolve
  if (authLoading || (user && profileLoading)) {
    return (
      <div className="min-h-screen bg-bg-base grid-bg flex items-center justify-center">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-accent-cyan vital-pulse" />
          <span className="text-sm font-mono text-text-muted">Loading…</span>
        </div>
      </div>
    );
  }

  // Guest-only routes (auth page): redirect logged-in users to their dashboard
  if (guestOnly && user && profile) {
    return <Navigate to={profile.role === 'doctor' ? '/dashboard' : '/family'} replace />;
  }

  // Protected routes: must be signed in
  if (!user) return <Navigate to="/auth" replace />;

  // Role-specific routes: must have matching profile role
  if (requiredRole && profile?.role !== requiredRole) {
    // Has a profile but wrong role → send to their correct dashboard
    if (profile) {
      return <Navigate to={profile.role === 'doctor' ? '/dashboard' : '/family'} replace />;
    }
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
}