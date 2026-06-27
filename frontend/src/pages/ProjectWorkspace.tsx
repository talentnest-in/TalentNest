import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { contractService } from '@/services/contract.service';
import { WorkspaceSidebar } from '@/components/ui/WorkspaceSidebar';
import { ContractSummaryCard } from '@/components/ui/ContractSummaryCard';
import { Folder, MessageSquare, CheckSquare, FileText } from 'lucide-react';

export function ProjectWorkspace() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('overview');

  const { data, isLoading, error } = useQuery({
    queryKey: ['contract', id],
    queryFn: () => contractService.getContractDetails(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-text-muted">Loading workspace...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-error">Error loading workspace</div>
      </div>
    );
  }

  const contract = data.contract;

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="bg-surface border border-border/50 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-text mb-4">Contract Overview</h2>
              <ContractSummaryCard contract={contract} />
            </div>
            <div className="bg-surface border border-border/50 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-text mb-4">Description</h2>
              <p className="text-sm text-text-muted whitespace-pre-wrap">{contract.description}</p>
            </div>
          </div>
        );
      case 'messages':
        return (
          <div className="bg-surface border border-border/50 rounded-xl p-6">
            <div className="flex flex-col items-center justify-center py-16">
              <MessageSquare className="w-12 h-12 text-text-muted mb-4" />
              <h3 className="text-lg font-semibold text-text mb-2">Messages</h3>
              <p className="text-sm text-text-muted text-center max-w-sm">
                Messaging feature coming soon. This will allow you to communicate with your project partner.
              </p>
            </div>
          </div>
        );
      case 'files':
        return (
          <div className="bg-surface border border-border/50 rounded-xl p-6">
            <div className="flex flex-col items-center justify-center py-16">
              <Folder className="w-12 h-12 text-text-muted mb-4" />
              <h3 className="text-lg font-semibold text-text mb-2">Files</h3>
              <p className="text-sm text-text-muted text-center max-w-sm">
                File sharing feature coming soon. This will allow you to upload and share project files.
              </p>
            </div>
          </div>
        );
      case 'milestones':
        return (
          <div className="bg-surface border border-border/50 rounded-xl p-6">
            <div className="flex flex-col items-center justify-center py-16">
              <CheckSquare className="w-12 h-12 text-text-muted mb-4" />
              <h3 className="text-lg font-semibold text-text mb-2">Milestones</h3>
              <p className="text-sm text-text-muted text-center max-w-sm">
                Milestone tracking feature coming soon. This will help you track project progress.
              </p>
            </div>
          </div>
        );
      case 'notes':
        return (
          <div className="bg-surface border border-border/50 rounded-xl p-6">
            <div className="flex flex-col items-center justify-center py-16">
              <FileText className="w-12 h-12 text-text-muted mb-4" />
              <h3 className="text-lg font-semibold text-text mb-2">Notes</h3>
              <p className="text-sm text-text-muted text-center max-w-sm">
                Notes feature coming soon. This will allow you to keep project notes and documentation.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen">
      <WorkspaceSidebar
        contractId={id!}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <div className="flex-1 overflow-y-auto bg-background">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-text mb-2">{contract.title}</h1>
            <p className="text-sm text-text-muted">Project Workspace</p>
          </div>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
