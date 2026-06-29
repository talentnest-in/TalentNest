import { MessageSquare } from 'lucide-react';

interface ChatEmptyStateProps {
  userName?: string | null;
}

export function ChatEmptyState({ userName }: ChatEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-20 h-20 rounded-full bg-background border border-border flex items-center justify-center mb-4">
        <MessageSquare className="w-10 h-10 text-text-muted" />
      </div>
      <h3 className="text-lg font-semibold text-text mb-2">
        {userName ? `Start chatting with ${userName}` : 'Start a conversation'}
      </h3>
      <p className="text-sm text-text-muted max-w-md">
        Send a message to begin discussing the contract. Messages are saved and can be viewed at any time.
      </p>
    </div>
  );
}
