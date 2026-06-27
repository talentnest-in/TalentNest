import type { ContractStatus } from '@/types';

interface ContractStatusBadgeProps {
  status: ContractStatus;
}

const statusConfig: Record<ContractStatus, { label: string; className: string }> = {
  ACTIVE: { label: 'Active', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  COMPLETED: { label: 'Completed', className: 'bg-green-100 text-green-800 border-green-200' },
  CANCELLED: { label: 'Cancelled', className: 'bg-gray-100 text-gray-800 border-gray-200' },
  DISPUTED: { label: 'Disputed', className: 'bg-red-100 text-red-800 border-red-200' },
};

export function ContractStatusBadge({ status }: ContractStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
      {config.label}
    </span>
  );
}
