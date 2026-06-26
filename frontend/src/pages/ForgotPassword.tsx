import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Mail } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authService } from '@/services/auth.service';

const forgotSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});
type ForgotForm = z.infer<typeof forgotSchema>;

export function ForgotPassword() {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotForm>({ resolver: zodResolver(forgotSchema) });

  const mutation = useMutation({
    mutationFn: (data: ForgotForm) => authService.forgotPassword(data.email),
    onSuccess: () => setSent(true),
  });

  const onSubmit = (data: ForgotForm) => mutation.mutate(data);

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
          {sent ? 'Check your inbox' : 'Forgot password?'}
        </h1>
        <p className="mt-2 text-sm text-text-muted text-center max-w-xs">
          {sent
            ? `We've sent a password reset link to ${getValues('email')}`
            : "No worries, we'll send you a link to reset it."}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08, ease: 'easeOut' }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-[440px]"
      >
        <div className="bg-surface border border-border/50 shadow-sm rounded-2xl py-10 px-8 sm:px-12">
          {sent ? (
            /* ── Success state ── */
            <div className="flex flex-col items-center text-center">
              <div className="h-14 w-14 rounded-full bg-success/10 flex items-center justify-center mb-5">
                <Mail className="h-6 w-6 text-success" />
              </div>
              <p className="text-sm text-text-muted mb-6">
                Didn't receive the email? Check your spam folder, or{' '}
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="text-accent font-medium hover:underline"
                >
                  try again
                </button>
                .
              </p>
              <Link to="/login">
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to login
                </Button>
              </Link>
            </div>
          ) : (
            /* ── Form state ── */
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
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
                {errors.email && (
                  <p className="text-xs text-error mt-1">{errors.email.message}</p>
                )}
              </div>

              <Button
                type="submit"
                variant="accent"
                className="w-full text-base font-semibold"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <span className="flex items-center gap-2 justify-center">
                    <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Sending…
                  </span>
                ) : (
                  'Send reset link'
                )}
              </Button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
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
