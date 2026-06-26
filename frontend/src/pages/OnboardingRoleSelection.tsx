import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { Briefcase, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/contexts/AuthContext';
import type { ApiError } from '@/types';
import { AxiosError } from 'axios';

export function OnboardingRoleSelection() {
  const [selectedRole, setSelectedRole] = useState<'FREELANCER' | 'CLIENT' | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const mutation = useMutation({
    mutationFn: authService.selectRole,
    onSuccess: (data) => {
      // Re-login with the new token to update context
      login(data.token, data.user);
      if (data.user.role === 'CLIENT') {
        navigate('/client-dashboard', { replace: true });
      } else if (data.user.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/freelancer-dashboard', { replace: true });
      }
    },
  });

  const apiError = (mutation.error as AxiosError<ApiError>)?.response?.data?.message;

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        <h2 className="text-center text-3xl font-bold tracking-tight text-text">
          Welcome to TalentNest 👋
        </h2>
        <p className="mt-2 text-center text-sm text-text-muted">
          How would you like to use TalentNest?
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.05, ease: 'easeOut' }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-[32rem]"
      >
        <div className="bg-surface py-8 px-4 shadow-xl border border-border/50 sm:rounded-3xl sm:px-10">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSelectedRole('FREELANCER')}
                className={`relative flex flex-col items-center p-4 rounded-2xl border-2 transition-all ${
                  selectedRole === 'FREELANCER'
                    ? 'border-accent bg-accent/5'
                    : 'border-border/50 bg-background hover:border-accent/50'
                }`}
              >
                <Briefcase className={`w-8 h-8 mb-3 ${selectedRole === 'FREELANCER' ? 'text-accent' : 'text-text-muted'}`} />
                <span className={`font-semibold ${selectedRole === 'FREELANCER' ? 'text-accent' : 'text-text'}`}>I'm a Freelancer</span>
                <span className="text-xs text-text-muted text-center mt-2 leading-relaxed">Find freelance projects, showcase your portfolio, and grow your career.</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('CLIENT')}
                className={`relative flex flex-col items-center p-4 rounded-2xl border-2 transition-all ${
                  selectedRole === 'CLIENT'
                    ? 'border-accent bg-accent/5'
                    : 'border-border/50 bg-background hover:border-accent/50'
                }`}
              >
                <Building2 className={`w-8 h-8 mb-3 ${selectedRole === 'CLIENT' ? 'text-accent' : 'text-text-muted'}`} />
                <span className={`font-semibold ${selectedRole === 'CLIENT' ? 'text-accent' : 'text-text'}`}>I'm Hiring Talent</span>
                <span className="text-xs text-text-muted text-center mt-2 leading-relaxed">Hire talented freelancers and manage projects efficiently.</span>
              </button>
            </div>

            {apiError && (
              <div className="p-3 bg-error/10 border border-error/20 rounded-xl flex items-start gap-3">
                <p className="text-sm text-error font-medium">{apiError}</p>
              </div>
            )}

            <Button
              type="button"
              className="w-full"
              size="lg"
              disabled={mutation.isPending || !selectedRole}
              onClick={() => {
                if (selectedRole) {
                  mutation.mutate({ role: selectedRole });
                }
              }}
            >
              {mutation.isPending ? 'Saving...' : 'Continue'}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
