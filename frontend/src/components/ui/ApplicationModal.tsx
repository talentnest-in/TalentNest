import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { X, FileText, DollarSign, Clock } from 'lucide-react';

const applicationSchema = z.object({
  coverLetter: z.string().min(10, 'Cover letter must be at least 10 characters').max(5000, 'Cover letter must be less than 5000 characters'),
  proposedRate: z.number().positive('Proposed rate must be greater than 0').optional().or(z.literal('')),
  estimatedDuration: z.string().max(200, 'Estimated duration must be less than 200 characters').optional(),
  resumeUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ApplicationFormData) => void;
  isSubmitting: boolean;
  jobTitle: string;
}

export function ApplicationModal({ isOpen, onClose, onSubmit, isSubmitting, jobTitle }: ApplicationModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      coverLetter: '',
      proposedRate: undefined,
      estimatedDuration: '',
      resumeUrl: '',
    },
  });

  const handleFormSubmit = (data: ApplicationFormData) => {
    onSubmit(data);
    reset();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-text">Apply for Job</h2>
            <p className="text-sm text-text-muted mt-1">{jobTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-6">
          {/* Cover Letter */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-text mb-2">
              <FileText className="w-4 h-4" />
              Cover Letter <span className="text-error">*</span>
            </label>
            <textarea
              {...register('coverLetter')}
              placeholder="Tell the client why you're the best fit for this job..."
              rows={6}
              className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-background resize-none"
            />
            {errors.coverLetter && (
              <p className="text-xs text-error mt-1">{errors.coverLetter.message}</p>
            )}
          </div>

          {/* Proposed Rate */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-text mb-2">
              <DollarSign className="w-4 h-4" />
              Proposed Rate (USD/hr) <span className="text-text-muted">(Optional)</span>
            </label>
            <input
              type="number"
              {...register('proposedRate', { valueAsNumber: true })}
              placeholder="e.g., 50"
              className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-background"
            />
            {errors.proposedRate && (
              <p className="text-xs text-error mt-1">{errors.proposedRate.message}</p>
            )}
          </div>

          {/* Estimated Duration */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-text mb-2">
              <Clock className="w-4 h-4" />
              Estimated Duration <span className="text-text-muted">(Optional)</span>
            </label>
            <input
              type="text"
              {...register('estimatedDuration')}
              placeholder="e.g., 2-3 weeks, 1 month"
              className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-background"
            />
            {errors.estimatedDuration && (
              <p className="text-xs text-error mt-1">{errors.estimatedDuration.message}</p>
            )}
          </div>

          {/* Resume URL */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-text mb-2">
              <FileText className="w-4 h-4" />
              Resume URL <span className="text-text-muted">(Optional)</span>
            </label>
            <input
              type="url"
              {...register('resumeUrl')}
              placeholder="https://..."
              className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-background"
            />
            {errors.resumeUrl && (
              <p className="text-xs text-error mt-1">{errors.resumeUrl.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="accent"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
