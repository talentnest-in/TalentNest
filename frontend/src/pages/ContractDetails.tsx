import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { contractService } from '@/services/contract.service';
import { ContractHeader } from '@/components/ui/ContractHeader';
import { ContractTimeline } from '@/components/ui/ContractTimeline';
import { ActivityTimeline } from '@/components/ui/ActivityTimeline';
import { ContractSummaryCard } from '@/components/ui/ContractSummaryCard';
import { ArrowLeft, FolderOpen } from 'lucide-react';

export function ContractDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['contract', id],
    queryFn: () => contractService.getContractDetails(id!),
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => contractService.updateContractStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract', id] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['clientDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['freelancerDashboard'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-text-muted">Loading contract details...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-error">Error loading contract details</div>
      </div>
    );
  }

  const contract = data.contract;

  const activities: Array<{ id: string; type: 'offer_sent' | 'offer_accepted' | 'offer_declined' | 'contract_created' | 'contract_completed' | 'contract_cancelled'; description: string; timestamp: string; userName?: string }> = [
    {
      id: '1',
      type: 'contract_created',
      description: 'Contract created from accepted offer',
      timestamp: contract.createdAt,
      userName: contract.client.name,
    },
  ];

  if (contract.startedAt) {
    activities.push({
      id: '2',
      type: 'contract_created',
      description: 'Contract started',
      timestamp: contract.startedAt,
      userName: contract.client.name,
    });
  }

  if (contract.status === 'COMPLETED' && contract.completedAt) {
    activities.push({
      id: '3',
      type: 'contract_completed',
      description: 'Contract marked as completed',
      timestamp: contract.completedAt,
      userName: contract.client.name,
    });
  }

  if (contract.status === 'CANCELLED' && contract.cancelledAt) {
    activities.push({
      id: '4',
      type: 'contract_cancelled',
      description: 'Contract cancelled',
      timestamp: contract.cancelledAt,
      userName: contract.client.name,
    });
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/contracts')}
        className="flex items-center gap-2 text-sm text-text-muted hover:text-text mb-6 transition-colors font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Contracts
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ContractHeader contract={contract} />
          <ContractTimeline contract={contract} />
          <ActivityTimeline activities={activities} />
        </div>

        <div className="space-y-6">
          <ContractSummaryCard contract={contract} />

          {contract.status === 'ACTIVE' && (
            <div className="bg-surface border border-border/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-text mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate(`/workspace/${contract.id}`)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-colors"
                >
                  <FolderOpen className="w-4 h-4" />
                  Open Workspace
                </button>
                {updateStatusMutation.isPending ? (
                  <div className="text-sm text-text-muted text-center">Updating...</div>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => updateStatusMutation.mutate('COMPLETED')}
                      className="w-full px-4 py-2 border border-success/50 text-success rounded-lg font-medium hover:bg-success/10 transition-colors"
                    >
                      Mark as Completed
                    </button>
                    <button
                      onClick={() => updateStatusMutation.mutate('CANCELLED')}
                      className="w-full px-4 py-2 border border-error/50 text-error rounded-lg font-medium hover:bg-error/10 transition-colors"
                    >
                      Cancel Contract
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
