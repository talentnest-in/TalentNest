import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authService } from '@/services/auth.service';
import type { ApiError } from '@/types';
import { AxiosError } from 'axios';

const resetSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ResetForm = z.infer<typeof resetSchema>;

export function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetForm>({ resolver: zodResolver(resetSchema) });

  const mutation = useMutation({
    mutationFn: (data: ResetForm) => authService.resetPassword(token as string, data.password),
    onSuccess: () => setSuccess(true),
  });

  const onSubmit = (data: ResetForm) => mutation.mutate(data);
  const apiError = (mutation.error as AxiosError<ApiError>)?.response?.data?.message;

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center"
      >
        <Logo className="h-10 mb-6" />
        <h1 className="text-3xl font-heading font-bold tracking-tight text-primary text-center">
          {success ? 'Password Reset' : 'Create new password'}
        </h1>
        <p className="mt-2 text-sm text-text-muted text-center max-w-xs">
          {success
            ? "Your password has been successfully reset. You can now log in."
            : "Your new password must be different from previous used passwords."}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08, ease: 'easeOut' }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-[440px]"
      >
        <div className="bg-surface border border-border/50 shadow-sm rounded-2xl py-10 px-8 sm:px-12">
          {success ? (
            /* ── Success state ── */
            <div className="flex flex-col items-center text-center">
              <div className="h-14 w-14 rounded-full bg-success/10 flex items-center justify-center mb-5">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <p className="text-sm text-text-muted mb-6">
                You can now log in with your new password.
              </p>
              <Button onClick={() => navigate('/login')} variant="accent" className="w-full">
                Go to login
              </Button>
            </div>
          ) : (
            /* ── Form state ── */
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              {apiError && (
                <div className="rounded-xl bg-error/5 border border-error/20 px-4 py-3 text-sm text-error">
                  {apiError}
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-text">
                  New password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter new password"
                  aria-invalid={!!errors.password}
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-xs text-error mt-1">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-text">
                  Confirm new password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  aria-invalid={!!errors.confirmPassword}
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-error mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              <Button
                type="submit"
                variant="accent"
                className="w-full text-base font-semibold"
                disabled={mutation.isPending || !token}
              >
                {mutation.isPending ? (
                  <span className="flex items-center gap-2 justify-center">
                    <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Resetting…
                  </span>
                ) : (
                  'Reset password'
                )}
              </Button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text transition-colors"
                >
                  Back to login
                </Link>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
