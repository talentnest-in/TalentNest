import type { ApplicationStatus } from '@/types';

const statusConfig: Record<ApplicationStatus, { label: string; color: string }> = {
  PENDING: { label: 'Pending', color: 'bg-warning/10 text-warning border-warning/20' },
  REVIEWING: { label: 'Reviewing', color: 'bg-primary/10 text-primary border-primary/20' },
  SHORTLISTED: { label: 'Shortlisted', color: 'bg-accent/10 text-accent border-accent/20' },
  REJECTED: { label: 'Rejected', color: 'bg-error/10 text-error border-error/20' },
  HIRED: { label: 'Hired', color: 'bg-success/10 text-success border-success/20' },
  WITHDRAWN: { label: 'Withdrawn', color: 'bg-text-muted/10 text-text-muted border-text-muted/20' },
};

interface ApplicationStatusBadgeProps {
  status: ApplicationStatus;
}

export function ApplicationStatusBadge({ status }: ApplicationStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
      {config.label}
    </span>
  );
}
