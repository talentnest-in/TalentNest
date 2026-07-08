import { useQuery } from '@tanstack/react-query';
import { MessageSquare } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { ConversationList } from '@/components/chat/ConversationList';
import { chatService } from '@/services/chat.service';
import { useAuth } from '@/contexts/AuthContext';

export function Communications() {
  const { user } = useAuth();

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatService.getConversations(),
  });

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-heading font-bold text-text">Messages</h1>
          <p className="text-text-muted mt-1">Communicate with your clients and freelancers</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <MessageSquare className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : (
          <ConversationList conversations={conversations || []} currentUserId={user?.id || ''} />
        )}
      </div>
    </DashboardLayout>
  );
}
