import { type ReactNode } from 'react';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { motion } from 'framer-motion';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  showTagline?: boolean;
}

export function AuthLayout({ children, title, subtitle, showTagline = true }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center"
      >
        <BrandLogo size="large" showTagline={showTagline} className="mb-6" />
        <h1 className="text-3xl font-heading font-bold tracking-tight text-primary text-center">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-sm text-text-muted text-center">{subtitle}</p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08, ease: 'easeOut' }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-[440px]"
      >
        <div className="bg-surface border border-border/50 shadow-sm rounded-2xl py-10 px-8 sm:px-12">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
