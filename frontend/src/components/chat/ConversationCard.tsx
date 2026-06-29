import { useNavigate } from 'react-router-dom';
import { MessageSquare, User } from 'lucide-react';
import type { Conversation } from '@/services/chat.service';

interface ConversationCardProps {
  conversation: Conversation;
  currentUserId: string;
  isActive?: boolean;
}

export function ConversationCard({ conversation, currentUserId, isActive }: ConversationCardProps) {
  const navigate = useNavigate();

  const otherUser = currentUserId === conversation.clientId ? conversation.freelancer : conversation.client;
  const lastMessage = conversation.messages[0];
  const unreadCount = conversation._count?.messages || 0;

  const handleClick = () => {
    navigate(`/conversations/${conversation.id}`);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      onClick={handleClick}
      className={`p-4 rounded-xl cursor-pointer transition-all border ${
        isActive
          ? 'bg-accent/10 border-accent/30'
          : 'bg-surface border-border/50 hover:border-border hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-background border border-border flex items-center justify-center shrink-0">
          {otherUser?.avatar ? (
            <img
              src={otherUser.avatar}
              alt={otherUser.name || 'User'}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <User className="w-6 h-6 text-text-muted" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-text truncate">{otherUser?.name || 'Unknown User'}</h3>
            {lastMessage && (
              <span className="text-xs text-text-muted shrink-0 ml-2">
                {formatTime(lastMessage.createdAt)}
              </span>
            )}
          </div>

          <p className="text-sm text-text-muted mb-2 truncate">
            {conversation.contract?.job?.title || 'Contract'}
          </p>

          {lastMessage ? (
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-text-muted shrink-0" />
              <p className="text-sm text-text-muted truncate flex-1">
                {lastMessage.content}
              </p>
              {unreadCount > 0 && (
                <span className="bg-accent text-white text-xs font-medium px-2 py-0.5 rounded-full shrink-0">
                  {unreadCount}
                </span>
              )}
            </div>
          ) : (
            <p className="text-sm text-text-muted">No messages yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
