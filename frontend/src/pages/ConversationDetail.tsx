import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useRef, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { MessageInput } from '@/components/chat/MessageInput';
import { ChatEmptyState } from '@/components/chat/ChatEmptyState';
import { chatService, type Message } from '@/services/chat.service';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';

export function ConversationDetail() {
  const { id: conversationId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { socket, onlineUsers, typingUsers, joinConversation, leaveConversation, sendMessage, sendTypingStart, sendTypingStop, markAsRead } = useSocket();
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => chatService.getMessages(conversationId!),
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
    const typingUserId = typingUsers.get(conversationId || '');
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
    if (conversationId) {
      sendMessage(conversationId, content || undefined, attachments || undefined);
      sendTypingStop(conversationId);
    }
  };

  const handleTypingStart = () => {
    if (conversationId) {
      sendTypingStart(conversationId);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingStop(conversationId);
      }, 1000);
    }
  };

  if (messagesLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-7rem)] lg:h-[calc(100vh-9rem)] -mx-2 flex flex-col bg-surface border border-border rounded-xl overflow-hidden">
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
                <div className="flex items-end gap-2">
                  {otherUser?.avatar ? (
                    <img src={otherUser.avatar} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">
                      {otherUser?.name?.charAt(0) || '?'}
                    </div>
                  )}
                  <div className="bg-surface border border-border rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-text-muted mr-1">{otherUser?.name?.split(' ')[0]} is typing</span>
                      <div className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
          disabled={!socket?.connected}
        />
      </div>
    </DashboardLayout>
  );
}
