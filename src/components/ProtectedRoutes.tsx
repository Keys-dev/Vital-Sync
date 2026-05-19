import { Navigate, Outlet } from 'react-router-dom';
import { useAuth }           from '@clerk/clerk-react';
import { useProfile }        from '@/hooks/useProfile';
import type { UserRole }     from '@/types';

interface Props { requiredRole?: UserRole; }

export default function ProtectedRoute({ requiredRole }: Props) {
  const { isSignedIn, isLoaded } = useAuth();
  const { profile, loading }     = useProfile();

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-bg-base grid-bg flex items-center justify-center">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-accent-cyan vital-pulse" />
          <span className="text-sm font-mono text-text-muted">Loading…</span>
        </div>
      </div>
    );
  }

  if (!isSignedIn)  return <Navigate to="/auth"         replace />;
  if (!profile)     return <Navigate to="/onboarding"   replace />;
  if (requiredRole && profile.role !== requiredRole)
                    return <Navigate to="/unauthorized"  replace />;

  return <Outlet />;
}