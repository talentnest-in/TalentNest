import type { ContractWithDetails } from '@/types';
import { Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ContractTimelineProps {
  contract: ContractWithDetails;
}

export function ContractTimeline({ contract }: ContractTimelineProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const events = [
    {
      label: 'Contract Created',
      date: contract.createdAt,
      icon: Calendar,
      color: 'text-accent',
    },
    {
      label: 'Contract Started',
      date: contract.startedAt,
      icon: CheckCircle,
      color: 'text-success',
    },
    ...(contract.status === 'COMPLETED'
      ? [
          {
            label: 'Contract Completed',
            date: contract.completedAt,
            icon: CheckCircle,
            color: 'text-success',
          },
        ]
      : []),
    ...(contract.status === 'CANCELLED'
      ? [
          {
            label: 'Contract Cancelled',
            date: contract.cancelledAt,
            icon: XCircle,
            color: 'text-error',
          },
        ]
      : []),
    ...(contract.status === 'DISPUTED'
      ? [
          {
            label: 'Contract Disputed',
            date: contract.updatedAt,
            icon: AlertCircle,
            color: 'text-error',
          },
        ]
      : []),
  ].filter((event) => event.date !== null);

  return (
    <div className="bg-surface border border-border/50 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-text mb-4">Contract Timeline</h2>
      <div className="space-y-4">
        {events.map((event, index) => {
          const Icon = event.icon;
          return (
            <div key={index} className="flex items-start gap-3">
              <div className={`mt-1 ${event.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-text">{event.label}</p>
                <p className="text-xs text-text-muted">{formatDate(event.date)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
