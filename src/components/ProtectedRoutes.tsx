import { Navigate, Outlet } from 'react-router-dom';
import { useAuthContext }    from '@/contexts/AuthContext';
import type { UserRole }     from '@/hooks/useProfile';

interface Props {
  requiredRole?: UserRole;
  guestOnly?: boolean;
}

export default function ProtectedRoute({ requiredRole, guestOnly }: Props) {
  const { user, profile, loading } = useAuthContext();

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

  if (guestOnly) {
    if (user && profile) {
      return <Navigate to={profile.role === 'doctor' ? '/dashboard' : '/family'} replace />;
    }
    return <Outlet />;
  }

  if (!user) return <Navigate to="/auth" replace />;

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

  if (requiredRole && profile.role !== requiredRole) {
    return <Navigate to={profile.role === 'doctor' ? '/dashboard' : '/family'} replace />;
  }

  return <Outlet />;
}