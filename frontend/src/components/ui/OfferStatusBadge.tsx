import type { OfferStatus } from '@/types';

interface OfferStatusBadgeProps {
  status: OfferStatus;
}

const statusConfig: Record<OfferStatus, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: 'bg-warning/10 text-warning border-warning/20' },
  ACCEPTED: { label: 'Accepted', className: 'bg-success/10 text-success border-success/20' },
  DECLINED: { label: 'Declined', className: 'bg-error/10 text-error border-error/20' },
  EXPIRED: { label: 'Expired', className: 'bg-text-muted/10 text-text-muted border-text-muted/20' },
  CANCELLED: { label: 'Cancelled', className: 'bg-text-muted/10 text-text-muted border-text-muted/20' },
};

export function OfferStatusBadge({ status }: OfferStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
      {config.label}
    </span>
  );
}
