import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { contractService } from '@/services/contract.service';
import { chatService } from '@/services/chat.service';
import { WorkspaceSidebar } from '@/components/ui/WorkspaceSidebar';
import { ContractSummaryCard } from '@/components/ui/ContractSummaryCard';
import { WorkspaceChat } from '@/components/workspace/WorkspaceChat';
import { WorkspaceFiles } from '@/components/workspace/WorkspaceFiles';
import { WorkspaceMilestones } from '@/components/workspace/WorkspaceMilestones';
import { WorkspaceNotes } from '@/components/workspace/WorkspaceNotes';
import { MessageSquare, Loader2 } from 'lucide-react';

export function ProjectWorkspace() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('overview');


  const { data, isLoading, error } = useQuery({
    queryKey: ['contract', id],
    queryFn: () => contractService.getContractDetails(id!),
    enabled: !!id,
  });

  const { data: conversation, isLoading: isLoadingConversation } = useQuery({
    queryKey: ['conversation', id],
    queryFn: () => chatService.getOrCreateConversation(id!),
    enabled: !!id && activeTab === 'messages',
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
          <div className="bg-surface border border-border/50 rounded-xl h-[calc(100vh-12rem)]">
            {isLoadingConversation ? (
              <div className="flex flex-col items-center justify-center h-full py-16">
                <Loader2 className="w-8 h-8 text-accent animate-spin mb-4" />
                <h3 className="text-lg font-semibold text-text mb-2">Loading messages...</h3>
              </div>
            ) : conversation ? (
              <WorkspaceChat conversationId={conversation.id} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-16">
                <MessageSquare className="w-12 h-12 text-text-muted mb-4" />
                <h3 className="text-lg font-semibold text-text mb-2">No Conversation</h3>
                <p className="text-sm text-text-muted text-center max-w-sm">
                  Conversation could not be loaded.
                </p>
              </div>
            )}
          </div>
        );
      case 'files':
        return (
          <div className="bg-surface border border-border/50 rounded-xl h-[calc(100vh-12rem)]">
            <WorkspaceFiles contractId={id!} />
          </div>
        );
      case 'milestones':
        return (
          <div className="bg-surface border border-border/50 rounded-xl h-[calc(100vh-12rem)]">
            <WorkspaceMilestones contractId={id!} />
          </div>
        );
      case 'notes':
        return (
          <div className="bg-surface border border-border/50 rounded-xl h-[calc(100vh-12rem)]">
            <WorkspaceNotes contractId={id!} />
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
            <h1 className="text-2xl font-heading font-bold text-text mb-2">{contract.title}</h1>
            <p className="text-sm text-text-muted">Project Workspace</p>
          </div>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
