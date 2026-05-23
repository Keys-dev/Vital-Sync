import { Navigate, Outlet } from 'react-router-dom';
import { useAuthContext }    from '@/contexts/AuthContext';
import type { UserRole }     from '@/hooks/useProfile';

interface Props {
  requiredRole?: UserRole;
  guestOnly?: boolean;
}

export default function ProtectedRoute({ requiredRole, guestOnly }: Props) {
  const { user, profile, loading } = useAuthContext();

  // Wait for auth + profile to fully resolve before making any routing decision
  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base grid-bg flex items-center justify-center">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-accent-cyan vital-pulse" />
          <span className="text-sm font-mono text-text-muted">Loading…</span>
        </div>
      </div>
    );
  }

  // Guest-only (auth page): redirect logged-in users to their dashboard
  if (guestOnly) {
    if (user && profile) {
      return <Navigate to={profile.role === 'doctor' ? '/dashboard' : '/family'} replace />;
    }
    return <Outlet />;
  }

  // Protected: must be signed in
// Protected: must be signed in
if (!user) return <Navigate to="/auth" replace />;

// Wait for profile to load before making role decisions
if (!profile) {
  return (
    <div className="min-h-screen bg-bg-base grid-bg flex items-center justify-center">
      <div className="flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-accent-cyan vital-pulse" />
        <span className="text-sm font-mono text-text-muted">Loading…</span>
      </div>
    </div>
  );
}

// Role-specific: must have matching role
if (requiredRole && profile.role !== requiredRole) {
  return <Navigate to={profile.role === 'doctor' ? '/dashboard' : '/family'} replace />;
}
}