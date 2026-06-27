import type { ContractWithDetails } from '@/types';
import { ContractStatusBadge } from './ContractStatusBadge';
import { Calendar, DollarSign, User } from 'lucide-react';

interface ContractHeaderProps {
  contract: ContractWithDetails;
}

export function ContractHeader({ contract }: ContractHeaderProps) {
  const { job, client, freelancer } = contract;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="bg-surface border border-border/50 rounded-xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-text mb-2">{contract.title}</h1>
          <p className="text-sm text-text-muted">{job.title}</p>
        </div>
        <ContractStatusBadge status={contract.status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
          <User className="w-5 h-5 text-text-muted" />
          <div>
            <p className="text-xs text-text-muted">Client</p>
            <p className="text-sm font-medium text-text">{client.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
          <User className="w-5 h-5 text-text-muted" />
          <div>
            <p className="text-xs text-text-muted">Freelancer</p>
            <p className="text-sm font-medium text-text">{freelancer.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
          <DollarSign className="w-5 h-5 text-text-muted" />
          <div>
            <p className="text-xs text-text-muted">Agreed Budget</p>
            <p className="text-sm font-medium text-text">${contract.agreedBudget.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {contract.deadline && (
          <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
            <Calendar className="w-5 h-5 text-text-muted" />
            <div>
              <p className="text-xs text-text-muted">Deadline</p>
              <p className="text-sm font-medium text-text">{formatDate(contract.deadline)}</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
          <Calendar className="w-5 h-5 text-text-muted" />
          <div>
            <p className="text-xs text-text-muted">Started</p>
            <p className="text-sm font-medium text-text">{formatDate(contract.startedAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
