import type { ContractStatus } from '@/types';

interface ContractStatusBadgeProps {
  status: ContractStatus;
}

const statusConfig: Record<ContractStatus, { label: string; className: string }> = {
  ACTIVE: { label: 'Active', className: 'bg-primary/10 text-primary border-primary/20' },
  COMPLETED: { label: 'Completed', className: 'bg-success/10 text-success border-success/20' },
  CANCELLED: { label: 'Cancelled', className: 'bg-text-muted/10 text-text-muted border-text-muted/20' },
  DISPUTED: { label: 'Disputed', className: 'bg-error/10 text-error border-error/20' },
};

export function ContractStatusBadge({ status }: ContractStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
      {config.label}
    </span>
  );
}
