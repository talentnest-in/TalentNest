import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import type { CreateOfferInput } from '@/types';

const offerSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  proposedBudget: z.number().positive('Budget must be positive'),
  currency: z.string(),
  estimatedDuration: z.string().optional(),
  deadline: z.string().optional(),
});

type OfferForm = z.infer<typeof offerSchema>;

interface OfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateOfferInput) => void;
  isSubmitting?: boolean;
  applicationId: string;
  jobTitle: string;
  freelancerName: string;
}

export function OfferModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  applicationId,
  jobTitle,
  freelancerName,
}: OfferModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<OfferForm>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      title: '',
      message: '',
      proposedBudget: 0,
      currency: 'USD',
      estimatedDuration: '',
      deadline: '',
    },
  });

  if (!isOpen) return null;

  const onFormSubmit = (data: OfferForm) => {
    onSubmit({
      ...data,
      applicationId,
    });
    reset();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl shadow-xl border border-border/50 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <div>
            <h2 className="text-xl font-semibold text-text">Send Offer</h2>
            <p className="text-sm text-text-muted mt-1">
              Send an offer to {freelancerName} for {jobTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-background rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="title" className="block text-sm font-medium text-text">
              Offer Title
            </label>
            <Input
              id="title"
              placeholder="e.g., Web Development Project"
              aria-invalid={!!errors.title}
              {...register('title')}
            />
            {errors.title && <p className="text-xs text-error mt-1">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="message" className="block text-sm font-medium text-text">
              Message
            </label>
            <textarea
              id="message"
              rows={4}
              placeholder="Describe the project scope, expectations, and any other details..."
              className="w-full px-3 py-2 border border-border/50 rounded-lg bg-background text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-transparent resize-none"
              aria-invalid={!!errors.message}
              {...register('message')}
            />
            {errors.message && <p className="text-xs text-error mt-1">{errors.message.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="proposedBudget" className="block text-sm font-medium text-text">
                Budget
              </label>
              <Input
                id="proposedBudget"
                type="number"
                placeholder="1000"
                step="0.01"
                aria-invalid={!!errors.proposedBudget}
                {...register('proposedBudget', { valueAsNumber: true })}
              />
              {errors.proposedBudget && (
                <p className="text-xs text-error mt-1">{errors.proposedBudget.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="currency" className="block text-sm font-medium text-text">
                Currency
              </label>
              <select
                id="currency"
                className="w-full px-3 py-2 border border-border/50 rounded-lg bg-background text-text focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-transparent"
                {...register('currency')}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="estimatedDuration" className="block text-sm font-medium text-text">
              Estimated Duration
            </label>
            <Input
              id="estimatedDuration"
              placeholder="e.g., 2 weeks, 1 month"
              aria-invalid={!!errors.estimatedDuration}
              {...register('estimatedDuration')}
            />
            {errors.estimatedDuration && (
              <p className="text-xs text-error mt-1">{errors.estimatedDuration.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="deadline" className="block text-sm font-medium text-text">
              Deadline
            </label>
            <Input
              id="deadline"
              type="date"
              aria-invalid={!!errors.deadline}
              {...register('deadline')}
            />
            {errors.deadline && <p className="text-xs text-error mt-1">{errors.deadline.message}</p>}
          </div>

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
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Sending...' : 'Send Offer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
