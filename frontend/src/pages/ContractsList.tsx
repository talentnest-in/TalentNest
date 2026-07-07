import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { contractService } from '@/services/contract.service';
import { ContractCard } from '@/components/ui/ContractCard';
import { EmptyContractsState } from '@/components/ui/EmptyContractsState';
import type { ContractStatus } from '@/types';
import { ArrowLeft, Filter } from 'lucide-react';

export function ContractsList() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<ContractStatus | ''>('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['contracts', statusFilter, page],
    queryFn: () =>
      contractService.getContracts({
        status: statusFilter || undefined,
        page,
        limit: 10,
      }),
  });

  const handleViewDetails = (id: string) => {
    navigate(`/contracts/${id}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-text-muted">Loading contracts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-error">Error loading contracts</div>
      </div>
    );
  }

  const contracts = data?.contracts || [];
  const pagination = data?.pagination;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-text-muted hover:text-text transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>
      </div>
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-bold text-text mb-2">Contracts</h1>
        <p className="text-sm text-text-muted">View and manage your active and past contracts</p>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-text-muted" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ContractStatus | '')}
            className="px-3 py-2 border border-border/50 rounded-lg bg-background text-text focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="DISPUTED">Disputed</option>
          </select>
        </div>
      </div>

      {contracts.length === 0 ? (
        <EmptyContractsState
          title="No contracts found"
          description={
            statusFilter
              ? 'Try adjusting your filters to see more contracts'
              : 'You don\'t have any contracts yet. Contracts are created when you accept an offer.'
          }
        />
      ) : (
        <>
          <div className="grid gap-4">
            {contracts.map((contract) => (
              <ContractCard
                key={contract.id}
                contract={contract}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>

          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-border/50 rounded-lg bg-background text-text disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-text-muted">
                Page {page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="px-4 py-2 border border-border/50 rounded-lg bg-background text-text disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
