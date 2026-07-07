import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth.service';
import { motion } from 'framer-motion';

export function OAuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const err = params.get('error');

    if (err) {
      setError(err);
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    if (!token) {
      setError('No token received');
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    // Set the token temporarily so getMe() works
    localStorage.setItem('access_token', token);

    // Fetch user profile with the new token
    authService.getMe()
      .then((user) => {
        login(token, user);
        const needsOnboarding = !user.onboardingCompleted || user.role === null;
        if (needsOnboarding) {
          navigate('/onboarding/select-role', { replace: true });
        } else if (user.role === 'CLIENT') {
          navigate('/client-dashboard', { replace: true });
        } else if (user.role === 'ADMIN') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/freelancer-dashboard', { replace: true });
        }
      })
      .catch(() => {
        setError('Failed to fetch user profile');
        localStorage.removeItem('access_token');
        setTimeout(() => navigate('/login'), 3000);
      });
  }, [location, navigate, login]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      {error ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-error/10 border border-error/20 p-6 rounded-xl max-w-sm text-center"
        >
          <div className="text-error font-semibold mb-2">Authentication Failed</div>
          <p className="text-sm text-error/80">{error}</p>
          <p className="text-xs text-text-muted mt-4">Redirecting to login...</p>
        </motion.div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-4 border-accent border-t-transparent animate-spin" />
          <h2 className="text-lg font-medium text-text">Completing login...</h2>
          <p className="text-sm text-text-muted">Please wait while we set up your session.</p>
        </div>
      )}
    </div>
  );
}
