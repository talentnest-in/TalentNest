import { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { BACKEND_URL } from '@/lib/constants';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: Set<string>;
  typingUsers: Map<string, string>; // conversationId -> userId
  unreadNotifCount: number;
  clearUnreadNotifCount: () => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  sendMessage: (conversationId: string, content?: string, attachments?: any[]) => void;
  sendTypingStart: (conversationId: string) => void;
  sendTypingStop: (conversationId: string) => void;
  markAsRead: (conversationId: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  onlineUsers: new Set(),
  typingUsers: new Map(),
  unreadNotifCount: 0,
  clearUnreadNotifCount: () => {},
  joinConversation: () => {},
  leaveConversation: () => {},
  sendMessage: () => {},
  sendTypingStart: () => {},
  sendTypingStop: () => {},
  markAsRead: () => {},
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) return;

    const newSocket = io(BACKEND_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      setIsConnected(false);
    });

    // Online status events
    newSocket.on('user_online', ({ userId }: { userId: string }) => {
      setOnlineUsers((prev) => new Set(prev).add(userId));
    });

    newSocket.on('user_offline', ({ userId }: { userId: string }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    // Typing indicator events
    newSocket.on('user_typing', ({ userId, conversationId }: { userId: string; conversationId: string }) => {
      setTypingUsers((prev) => new Map(prev).set(conversationId, userId));
    });

    newSocket.on('user_stopped_typing', ({ userId, conversationId }: { userId: string; conversationId: string }) => {
      setTypingUsers((prev) => {
        const next = new Map(prev);
        if (next.get(conversationId) === userId) {
          next.delete(conversationId);
        }
        return next;
      });
    });

    // Real-time notification events — bump badge count
    newSocket.on('notification:new', () => {
      setUnreadNotifCount((prev) => prev + 1);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const joinConversation = (conversationId: string) => {
    socket?.emit('join_conversation', { conversationId });
  };

  const leaveConversation = (conversationId: string) => {
    socket?.emit('leave_conversation', { conversationId });
  };

  const sendMessage = (conversationId: string, content?: string, attachments?: any[]) => {
    socket?.emit('send_message', { conversationId, content, attachments });
  };

  const sendTypingStart = (conversationId: string) => {
    socket?.emit('typing_start', { conversationId });
  };

  const sendTypingStop = (conversationId: string) => {
    socket?.emit('typing_stop', { conversationId });
  };

  const markAsRead = (conversationId: string) => {
    socket?.emit('message_read', { conversationId });
  };

  const clearUnreadNotifCount = () => setUnreadNotifCount(0);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineUsers,
        typingUsers,
        unreadNotifCount,
        clearUnreadNotifCount,
        joinConversation,
        leaveConversation,
        sendMessage,
        sendTypingStart,
        sendTypingStop,
        markAsRead,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
