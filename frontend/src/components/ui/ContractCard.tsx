import type { ContractWithDetails } from '@/types';
import { ContractStatusBadge } from './ContractStatusBadge';
import { Calendar, DollarSign, FileText, User } from 'lucide-react';

interface ContractCardProps {
  contract: ContractWithDetails;
  onViewDetails: (id: string) => void;
}

export function ContractCard({ contract, onViewDetails }: ContractCardProps) {
  const { job, client, freelancer } = contract;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusDate = () => {
    if (contract.status === 'COMPLETED') return contract.completedAt;
    if (contract.status === 'CANCELLED') return contract.cancelledAt;
    return contract.startedAt;
  };

  return (
    <div className="bg-surface border border-border/50 rounded-xl p-5 hover:border-accent/30 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-text text-lg mb-1">{contract.title}</h3>
          <p className="text-sm text-text-muted">{job.title}</p>
        </div>
        <ContractStatusBadge status={contract.status} />
      </div>

      <div className="flex items-center gap-2 mb-4">
        <User className="w-4 h-4 text-text-muted" />
        <span className="text-sm text-text-muted">
          Client: {client.name} • Freelancer: {freelancer.name}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-text-muted" />
          <div>
            <p className="text-xs text-text-muted">Agreed Budget</p>
            <p className="text-sm font-medium text-text">${contract.agreedBudget.toLocaleString()}</p>
          </div>
        </div>
        {contract.deadline && (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-text-muted" />
            <div>
              <p className="text-xs text-text-muted">Deadline</p>
              <p className="text-sm font-medium text-text">{formatDate(contract.deadline)}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-4 h-4 text-text-muted" />
        <div>
          <p className="text-xs text-text-muted">Status Date</p>
          <p className="text-sm font-medium text-text">{formatDate(getStatusDate())}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border/50">
        <span className="text-xs text-text-muted">
          Started: {formatDate(contract.startedAt)}
        </span>
        <button
          onClick={() => onViewDetails(contract.id)}
          className="text-sm font-medium text-accent hover:text-accent/80 transition-colors"
        >
          View Details
        </button>
      </div>
    </div>
  );
}
