import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

function getDashboardPath(role: string | null | undefined): string {
  if (role === 'CLIENT') return '/client-dashboard';
  if (role === 'ADMIN') return '/admin';
  return '/freelancer-dashboard';
}

/** Main auth guard — redirects unauthenticated users to /login and handles onboarding flow */
export function ProtectedRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          <p className="text-sm text-text-muted">Loading session…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isOnboardingRoute = location.pathname === '/onboarding/select-role';
  const needsOnboarding = !user.onboardingCompleted || user.role === 'ONBOARDING';

  if (needsOnboarding && !isOnboardingRoute) {
    return <Navigate to="/onboarding/select-role" replace />;
  }

  if (!needsOnboarding && isOnboardingRoute) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return <Outlet />;
}

/** Guard that allows only FREELANCER role — redirects others to their dashboard */
export function FreelancerRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  if (!user || user.role !== 'FREELANCER') {
    return <Navigate to={getDashboardPath(user?.role)} replace />;
  }

  return <Outlet />;
}

/** Guard that allows only CLIENT role — redirects others to their dashboard */
export function ClientRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  if (!user || user.role !== 'CLIENT') {
    return <Navigate to={getDashboardPath(user?.role)} replace />;
  }

  return <Outlet />;
}
