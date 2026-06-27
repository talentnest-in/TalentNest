import type { OfferStatus } from '@/types';

interface OfferStatusBadgeProps {
  status: OfferStatus;
}

const statusConfig: Record<OfferStatus, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  ACCEPTED: { label: 'Accepted', className: 'bg-green-100 text-green-800 border-green-200' },
  DECLINED: { label: 'Declined', className: 'bg-red-100 text-red-800 border-red-200' },
  EXPIRED: { label: 'Expired', className: 'bg-gray-100 text-gray-800 border-gray-200' },
  CANCELLED: { label: 'Cancelled', className: 'bg-gray-100 text-gray-800 border-gray-200' },
};

export function OfferStatusBadge({ status }: OfferStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
      {config.label}
    </span>
  );
}
