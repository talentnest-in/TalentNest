import type { ContractWithDetails } from '@/types';
import { ContractStatusBadge } from './ContractStatusBadge';
import { DollarSign, Calendar, Clock, FileText } from 'lucide-react';

interface ContractSummaryCardProps {
  contract: ContractWithDetails;
}

export function ContractSummaryCard({ contract }: ContractSummaryCardProps) {
  const { job } = contract;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getProgress = () => {
    if (!contract.startedAt || !contract.deadline) return 0;
    const start = new Date(contract.startedAt).getTime();
    const end = new Date(contract.deadline).getTime();
    const now = Date.now();
    const total = end - start;
    const elapsed = now - start;
    return Math.min(Math.max(Math.round((elapsed / total) * 100), 0), 100);
  };

  const progress = getProgress();

  return (
    <div className="bg-surface border border-border/50 rounded-xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-text">{contract.title}</h3>
          <p className="text-sm text-text-muted mt-1">{job.title}</p>
        </div>
        <ContractStatusBadge status={contract.status} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-text-muted" />
          <div>
            <p className="text-xs text-text-muted">Budget</p>
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

      {contract.status === 'ACTIVE' && contract.deadline && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-text-muted" />
              <p className="text-xs text-text-muted">Progress</p>
            </div>
            <p className="text-xs font-medium text-text">{progress}%</p>
          </div>
          <div className="w-full bg-background rounded-full h-2">
            <div
              className="bg-accent h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 pt-4 border-t border-border/50">
        <FileText className="w-4 h-4 text-text-muted" />
        <p className="text-xs text-text-muted">
          Started: {formatDate(contract.startedAt)}
        </p>
      </div>
    </div>
  );
}
