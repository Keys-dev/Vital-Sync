import { Navigate, Outlet } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useProfile }     from '@/hooks/useProfile';
import type { UserRole }  from '@/hooks/useProfile';

interface Props {
  requiredRole?: UserRole;
  guestOnly?: boolean;
}

export default function ProtectedRoute({ requiredRole, guestOnly }: Props) {
  const { user, loading: authLoading }       = useAuthContext();
  const { profile, loading: profileLoading } = useProfile();

  // Wait for auth to resolve
if (authLoading || profileLoading) {    return (
      <div className="min-h-screen bg-bg-base grid-bg flex items-center justify-center">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-accent-cyan vital-pulse" />
          <span className="text-sm font-mono text-text-muted">Loading…</span>
        </div>
      </div>
    );
  }

  // Guest-only routes (auth page): if already logged in, send to dashboard
  if (guestOnly) {
    if (user && profile) {
      return <Navigate to={profile.role === 'doctor' ? '/dashboard' : '/family'} replace />;
    }
    // Not logged in — show the guest page (AuthPage)
    return <Outlet />;
  }

  // Protected routes: must be signed in
  if (!user) return <Navigate to="/auth" replace />;

  // Role-specific routes
  if (requiredRole && profile?.role !== requiredRole) {
    if (profile) {
      return <Navigate to={profile.role === 'doctor' ? '/dashboard' : '/family'} replace />;
    }
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
}