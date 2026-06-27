import type { ApplicationStatus } from '@/types';

const statusConfig: Record<ApplicationStatus, { label: string; color: string }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  REVIEWING: { label: 'Reviewing', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  SHORTLISTED: { label: 'Shortlisted', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  REJECTED: { label: 'Rejected', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  HIRED: { label: 'Hired', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  WITHDRAWN: { label: 'Withdrawn', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
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
