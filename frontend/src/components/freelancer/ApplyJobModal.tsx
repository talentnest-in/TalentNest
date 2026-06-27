import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, DollarSign, Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { ApplyJobInput } from '@/types';

const applyJobSchema = z.object({
  coverLetter: z.string().min(10, 'Cover letter must be at least 10 characters').max(5000, 'Cover letter must be less than 5000 characters'),
  proposedRate: z.number().positive('Proposed rate must be greater than 0').optional(),
  estimatedDuration: z.string().max(200, 'Estimated duration must be less than 200 characters').optional(),
  resumeUrl: z.string().url().optional().or(z.literal('')),
});

interface ApplyJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ApplyJobInput) => void;
  isLoading?: boolean;
}

export function ApplyJobModal({ isOpen, onClose, onSubmit, isLoading }: ApplyJobModalProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<z.infer<typeof applyJobSchema>>({
    resolver: zodResolver(applyJobSchema),
  });

  const coverLetterValue = watch('coverLetter');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-text">Apply for Job</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Cover Letter */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Cover Letter <span className="text-error">*</span>
            </label>
            <textarea
              {...register('coverLetter')}
              placeholder="Tell the client why you're the perfect fit for this job..."
              rows={6}
              className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              disabled={isLoading}
            />
            {errors.coverLetter && (
              <p className="text-sm text-error mt-1">{errors.coverLetter.message}</p>
            )}
            <p className="text-xs text-text-muted mt-1">
              {coverLetterValue?.length || 0} / 5000 characters
            </p>
          </div>

          {/* Proposed Rate */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Proposed Rate ($/hr)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="number"
                {...register('proposedRate', { valueAsNumber: true })}
                placeholder="Your hourly rate"
                className="w-full pl-10 pr-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                disabled={isLoading}
              />
            </div>
            {errors.proposedRate && (
              <p className="text-sm text-error mt-1">{errors.proposedRate.message}</p>
            )}
          </div>

          {/* Estimated Duration */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Estimated Duration
            </label>
            <div className="relative">
              <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                {...register('estimatedDuration')}
                placeholder="e.g., 2-3 weeks, 1 month"
                className="w-full pl-10 pr-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                disabled={isLoading}
              />
            </div>
            {errors.estimatedDuration && (
              <p className="text-sm text-error mt-1">{errors.estimatedDuration.message}</p>
            )}
          </div>

          {/* Resume URL */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Resume URL (Optional)
            </label>
            <div className="relative">
              <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                {...register('resumeUrl')}
                placeholder="https://..."
                className="w-full pl-10 pr-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                disabled={isLoading}
              />
            </div>
            {errors.resumeUrl && (
              <p className="text-sm text-error mt-1">{errors.resumeUrl.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="accent"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
