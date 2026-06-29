import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useEffect, useState } from 'react';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { MessageInput } from '@/components/chat/MessageInput';
import { ChatEmptyState } from '@/components/chat/ChatEmptyState';
import { chatService, type Message } from '@/services/chat.service';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';

interface WorkspaceChatProps {
  conversationId: string;
}

export function WorkspaceChat({ conversationId }: WorkspaceChatProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { socket, onlineUsers, typingUsers, joinConversation, leaveConversation, sendMessage, sendTypingStart, sendTypingStop, markAsRead } = useSocket();
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => chatService.getMessages(conversationId),
    enabled: !!conversationId,
  });

  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatService.getConversations(),
  });

  const currentConversation = conversations?.find(c => c.id === conversationId);

  // Join conversation room and set up socket listeners
  useEffect(() => {
    if (!socket || !conversationId) return;

    joinConversation(conversationId);

    // Listen for new messages
    socket.on('receive_message', (newMessage: Message) => {
      queryClient.setQueryData(['messages', conversationId], (oldData: Message[] | undefined) => {
        return [...(oldData || []), newMessage];
      });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });

    // Listen for message sent confirmation
    socket.on('message_sent', (sentMessage: Message) => {
      queryClient.setQueryData(['messages', conversationId], (oldData: Message[] | undefined) => {
        return [...(oldData || []), sentMessage];
      });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });

    // Listen for messages read
    socket.on('messages_read', ({ userId, conversationId: readConversationId }: { userId: string; conversationId: string }) => {
      if (readConversationId === conversationId) {
        queryClient.setQueryData(['messages', conversationId], (oldData: Message[] | undefined) => {
          return oldData?.map(msg => 
            msg.senderId === userId ? { ...msg, isRead: true } : msg
          );
        });
      }
    });

    return () => {
      leaveConversation(conversationId);
      socket.off('receive_message');
      socket.off('message_sent');
      socket.off('messages_read');
    };
  }, [socket, conversationId, joinConversation, leaveConversation, queryClient]);

  // Mark messages as read when opening conversation
  useEffect(() => {
    if (conversationId && currentConversation) {
      markAsRead(conversationId);
    }
  }, [conversationId, currentConversation, markAsRead]);

  // Update typing indicator state based on socket events
  useEffect(() => {
    const typingUserId = typingUsers.get(conversationId);
    setIsTyping(typingUserId !== undefined && typingUserId !== user?.id);
  }, [typingUsers, conversationId, user?.id]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getOtherUser = () => {
    if (!currentConversation) return null;
    return user?.id === currentConversation.clientId ? currentConversation.freelancer : currentConversation.client;
  };

  const otherUser = getOtherUser();
  const isOtherUserOnline = otherUser ? onlineUsers.has(otherUser.id) : false;

  const handleSendMessage = (content?: string, attachments?: any[]) => {
    sendMessage(conversationId, content || undefined, attachments || undefined);
    sendTypingStop(conversationId);
  };

  const handleTypingStart = () => {
    sendTypingStart(conversationId);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStop(conversationId);
    }, 1000);
  };

  if (messagesLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-text-muted">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <ChatHeader
        userName={otherUser?.name || 'Unknown User'}
        userAvatar={otherUser?.avatar}
        contractTitle={currentConversation?.contract?.job?.title}
        isOnline={isOtherUserOnline}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {!messages || messages.length === 0 ? (
          <ChatEmptyState userName={otherUser?.name} />
        ) : (
          <>
            {messages.map((msg) => (
              <ChatBubble
                key={msg.id}
                message={msg}
                isOwn={msg.senderId === user?.id}
              />
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-surface border border-border rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <MessageInput
        onSendMessage={handleSendMessage}
        onTypingStart={handleTypingStart}
      />
    </div>
  );
}
