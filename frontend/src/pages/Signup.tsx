import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, Briefcase, Building2 } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/contexts/AuthContext';
import type { ApiError } from '@/types';
import { AxiosError } from 'axios';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/\d/, 'Must contain a number')
    .regex(/[A-Z]/, 'Must contain an uppercase letter'),
  role: z.enum(['FREELANCER', 'CLIENT'], {
    message: 'Please select an account type',
  }),
});
type SignupForm = z.infer<typeof signupSchema>;

export function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SignupForm>({ resolver: zodResolver(signupSchema) });

  const mutation = useMutation({
    mutationFn: authService.register,
    onSuccess: (data) => {
      login(data.token, data.user);
      const needsOnboarding = !data.user.onboardingCompleted || data.user.role === null;
      
      if (needsOnboarding) {
        navigate('/onboarding/select-role', { replace: true });
      } else if (data.user.role === 'CLIENT') {
        navigate('/client-dashboard', { replace: true });
      } else if (data.user.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/freelancer-dashboard', { replace: true });
      }
    },
  });

  const password = watch('password', '');
  const selectedRole = watch('role');
  
  const hasLength = (password?.length ?? 0) >= 8;
  const hasNumber = /\d/.test(password ?? '');
  const hasUpper = /[A-Z]/.test(password ?? '');

  const onSubmit = (data: SignupForm) => mutation.mutate(data);

  const apiError = (mutation.error as AxiosError<ApiError>)?.response?.data?.message;

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="flex justify-center mb-6">
          <Logo className="h-10" withText />
        </div>
        <h2 className="text-center text-3xl font-bold tracking-tight text-text">
          Create an account
        </h2>
        <p className="mt-2 text-center text-sm text-text-muted">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-accent hover:text-accent-hover transition-colors"
          >
            Sign in
          </Link>
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.05, ease: 'easeOut' }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-[32rem]"
      >
        <div className="bg-surface py-8 px-4 shadow-xl border border-border/50 sm:rounded-3xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            
            {/* ── Role Selection ── */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-text text-center mb-4">How would you like to use TalentNest?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setValue('role', 'FREELANCER')}
                  className={`relative flex flex-col items-center p-4 rounded-2xl border-2 transition-all ${
                    selectedRole === 'FREELANCER'
                      ? 'border-accent bg-accent/5'
                      : 'border-border/50 bg-background hover:border-accent/50'
                  }`}
                >
                  <Briefcase className={`w-8 h-8 mb-3 ${selectedRole === 'FREELANCER' ? 'text-accent' : 'text-text-muted'}`} />
                  <span className={`font-semibold ${selectedRole === 'FREELANCER' ? 'text-accent' : 'text-text'}`}>I'm a Freelancer</span>
                  <span className="text-xs text-text-muted text-center mt-2 leading-relaxed">Find freelance projects, build your portfolio, and grow your career.</span>
                </button>

                <button
                  type="button"
                  onClick={() => setValue('role', 'CLIENT')}
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
              {errors.role && <p className="text-xs text-error mt-2 text-center">{errors.role.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="name" className="block text-sm font-medium text-text">
                Full name
              </label>
              <Input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="John Doe"
                aria-invalid={!!errors.name}
                {...register('name')}
              />
              {errors.name && <p className="text-xs text-error mt-1">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-text">
                Email address
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                aria-invalid={!!errors.email}
                {...register('email')}
              />
              {errors.email && <p className="text-xs text-error mt-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-text">
                Password
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="Create a strong password"
                aria-invalid={!!errors.password}
                {...register('password')}
              />
              {/* Password strength hints */}
              <div className="space-y-1.5 pt-1">
                {[
                  { met: hasLength, label: 'At least 8 characters' },
                  { met: hasNumber, label: 'Contains a number' },
                  { met: hasUpper, label: 'Contains an uppercase letter' },
                ].map(({ met, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <CheckCircle2
                      className={`h-4 w-4 transition-colors ${met ? 'text-success' : 'text-border'}`}
                    />
                    <span className={`text-xs transition-colors ${met ? 'text-text' : 'text-text-muted'}`}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {apiError && (
              <div className="p-3 bg-error/10 border border-error/20 rounded-xl flex items-start gap-3">
                <p className="text-sm text-error font-medium">{apiError}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={mutation.isPending || !selectedRole}
            >
              {mutation.isPending ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm font-medium leading-6">
                <span className="bg-surface px-6 text-text-muted">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="w-full h-11"
                onClick={() => window.location.href = 'http://localhost:3001/api/v1/auth/google'}
              >
                <svg className="h-5 w-5 mr-2" aria-hidden="true" viewBox="0 0 24 24">
                  <path
                    d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                    fill="#EA4335"
                  />
                  <path
                    d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                    fill="#4285F4"
                  />
                  <path
                    d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26538 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
                    fill="#34A853"
                  />
                </svg>
                Google
              </Button>

              <Button
                variant="outline"
                className="w-full h-11"
                onClick={() => window.location.href = 'http://localhost:3001/api/v1/auth/github'}
              >
                <svg className="h-5 w-5 mr-2 text-text" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
                GitHub
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
