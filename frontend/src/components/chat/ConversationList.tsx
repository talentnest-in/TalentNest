import { MessageSquare } from 'lucide-react';
import { ConversationCard } from './ConversationCard';
import type { Conversation } from '@/services/chat.service';

interface ConversationListProps {
  conversations: Conversation[];
  currentUserId: string;
  activeConversationId?: string;
}

export function ConversationList({ conversations, currentUserId, activeConversationId }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <MessageSquare className="w-16 h-16 text-text-muted mb-4" />
        <h3 className="text-lg font-semibold text-text mb-2">No conversations yet</h3>
        <p className="text-sm text-text-muted">
          Start a conversation by accepting a contract offer.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {conversations.map((conversation) => (
        <ConversationCard
          key={conversation.id}
          conversation={conversation}
          currentUserId={currentUserId}
          isActive={conversation.id === activeConversationId}
        />
      ))}
    </div>
  );
}
