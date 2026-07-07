import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { FastifyInstance } from 'fastify';

interface SocketData {
  userId: string;
  userName: string | null;
}

const onlineUsers = new Map<string, Set<string>>(); // userId -> socketIds
const conversationRooms = new Map<string, Set<string>>(); // conversationId -> userIds

let ioInstance: SocketIOServer | null = null;

export const getIO = () => {
  if (!ioInstance) throw new Error("Socket.io not initialized!");
  return ioInstance;
};

export default async function socketPlugin(fastify: FastifyInstance) {
  const httpServer: HTTPServer = fastify.server;
  
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        
        // Allow configured frontend URL
        const allowedOrigins = [
          process.env.FRONTEND_URL?.replace(/\/$/, ''),
          'http://localhost:5173',
          'https://talentnest-zrk2.onrender.com',
        ].filter(Boolean);
        
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'), false);
        }
      },
      credentials: true,
    },
  });

  ioInstance = io;

  // JWT Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        console.error('Socket auth failed: No token provided');
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { id: string };
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, name: true },
      });

      if (!user) {
        console.error('Socket auth failed: User not found', decoded.id);
        return next(new Error('Authentication error: User not found'));
      }

      socket.data = { userId: user.id, userName: user.name } as SocketData;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = (socket.data as SocketData).userId;
    const userName = (socket.data as SocketData).userName;

    console.log(`User connected: ${userId} (${userName})`);

    // Track online user
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId)!.add(socket.id);

    // Join personal notification room
    socket.join(`user_${userId}`);

    // Broadcast online status
    socket.broadcast.emit('user_online', { userId, userName });

    // ── Join Conversation ─────────────────────────────────────────────
    socket.on('join_conversation', async (data: { conversationId: string }) => {
      try {
        const { conversationId } = data;

        // Verify user belongs to this conversation
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
        });

        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        if (conversation.clientId !== userId && conversation.freelancerId !== userId) {
          socket.emit('error', { message: 'Unauthorized access to conversation' });
          return;
        }

        // Join the conversation room
        socket.join(conversationId);

        // Track conversation membership
        if (!conversationRooms.has(conversationId)) {
          conversationRooms.set(conversationId, new Set());
        }
        conversationRooms.get(conversationId)!.add(userId);

        console.log(`User ${userId} joined conversation ${conversationId}`);
      } catch (error) {
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });

    // ── Leave Conversation ────────────────────────────────────────────
    socket.on('leave_conversation', (data: { conversationId: string }) => {
      const { conversationId } = data;
      socket.leave(conversationId);
      
      conversationRooms.get(conversationId)?.delete(userId);
      console.log(`User ${userId} left conversation ${conversationId}`);
    });

    // ── Send Message ─────────────────────────────────────────────────
    socket.on('send_message', async (data: { 
      conversationId: string; 
      content?: string; 
      type?: 'TEXT' | 'ATTACHMENT';
      attachments?: Array<{ fileName: string; fileUrl: string; mimeType: string; size: number }>;
    }) => {
      try {
        const { conversationId, content, type, attachments } = data;

        // Verify user belongs to this conversation
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
        });

        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        if (conversation.clientId !== userId && conversation.freelancerId !== userId) {
          socket.emit('error', { message: 'Unauthorized to send message' });
          return;
        }

        // Create message in database
        const message = await prisma.message.create({
          data: {
            conversationId,
            senderId: userId,
            content: content || null,
            type: type || 'TEXT',
            ...(attachments && attachments.length > 0 ? {
              attachments: {
                create: attachments.map(att => ({
                  fileName: att.fileName,
                  fileUrl: att.fileUrl,
                  mimeType: att.mimeType,
                  size: att.size,
                })),
              },
            } : {}),
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
            attachments: true,
          },
        });

        // Update conversation timestamp
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });

        // Broadcast to conversation room (excluding sender)
        socket.to(conversationId).emit('receive_message', message);
        
        // Send confirmation to sender
        socket.emit('message_sent', message);

        console.log(`Message sent in conversation ${conversationId} by ${userId}`);
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // ── Typing Indicator ───────────────────────────────────────────────
    socket.on('typing_start', (data: { conversationId: string }) => {
      const { conversationId } = data;
      socket.to(conversationId).emit('user_typing', { userId, userName });
    });

    socket.on('typing_stop', (data: { conversationId: string }) => {
      const { conversationId } = data;
      socket.to(conversationId).emit('user_stopped_typing', { userId });
    });

    // ── Message Read ───────────────────────────────────────────────────
    socket.on('message_read', async (data: { conversationId: string }) => {
      try {
        const { conversationId } = data;

        // Verify user belongs to this conversation
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
        });

        if (!conversation) {
          return;
        }

        if (conversation.clientId !== userId && conversation.freelancerId !== userId) {
          return;
        }

        // Mark all messages from other user as read
        await prisma.message.updateMany({
          where: {
            conversationId,
            senderId: { not: userId },
            isRead: false,
          },
          data: { isRead: true },
        });

        // Broadcast read receipt
        socket.to(conversationId).emit('messages_read', { userId, conversationId });

        console.log(`Messages marked as read in conversation ${conversationId} by ${userId}`);
      } catch (error) {
        console.error('Failed to mark messages as read:', error);
      }
    });

    // ── Join Contract Room ─────────────────────────────────────────────
    socket.on('join_contract', async (data: { contractId: string }) => {
      try {
        const { contractId } = data;

        // Verify user belongs to this contract
        const contract = await prisma.contract.findUnique({
          where: { id: contractId },
        });

        if (!contract) {
          socket.emit('error', { message: 'Contract not found' });
          return;
        }

        if (contract.clientId !== userId && contract.freelancerId !== userId) {
          socket.emit('error', { message: 'Unauthorized access to contract' });
          return;
        }

        // Join the contract room
        socket.join(`contract:${contractId}`);

        console.log(`User ${userId} joined contract ${contractId}`);
      } catch (error) {
        socket.emit('error', { message: 'Failed to join contract' });
      }
    });

    // ── Leave Contract Room ────────────────────────────────────────────
    socket.on('leave_contract', (data: { contractId: string }) => {
      const { contractId } = data;
      socket.leave(`contract:${contractId}`);
      console.log(`User ${userId} left contract ${contractId}`);
    });

    // ── File Uploaded ───────────────────────────────────────────────────
    socket.on('file_uploaded', async (data: { contractId: string; file: any }) => {
      try {
        const { contractId, file } = data;

        // Verify user belongs to this contract
        const contract = await prisma.contract.findUnique({
          where: { id: contractId },
        });

        if (!contract) {
          return;
        }

        if (contract.clientId !== userId && contract.freelancerId !== userId) {
          return;
        }

        // Broadcast file upload to contract room (excluding sender)
        socket.to(`contract:${contractId}`).emit('file_uploaded', file);

        console.log(`File uploaded in contract ${contractId} by ${userId}`);
      } catch (error) {
        console.error('Failed to broadcast file upload:', error);
      }
    });

    // ── File Deleted ───────────────────────────────────────────────────
    socket.on('file_deleted', async (data: { contractId: string; fileId: string }) => {
      try {
        const { contractId, fileId } = data;

        // Verify user belongs to this contract
        const contract = await prisma.contract.findUnique({
          where: { id: contractId },
        });

        if (!contract) {
          return;
        }

        if (contract.clientId !== userId && contract.freelancerId !== userId) {
          return;
        }

        // Broadcast file deletion to contract room (excluding sender)
        socket.to(`contract:${contractId}`).emit('file_deleted', { fileId });

        console.log(`File deleted in contract ${contractId} by ${userId}`);
      } catch (error) {
        console.error('Failed to broadcast file deletion:', error);
      }
    });

    // ── Community & Post Rooms ──────────────────────────────────────────
    socket.on('join_post', (data: { postId: string }) => {
      socket.join(`post:${data.postId}`);
    });

    socket.on('leave_post', (data: { postId: string }) => {
      socket.leave(`post:${data.postId}`);
    });

    socket.on('join_community', (data: { communityId: string }) => {
      socket.join(`community:${data.communityId}`);
    });

    socket.on('leave_community', (data: { communityId: string }) => {
      socket.leave(`community:${data.communityId}`);
    });
    
    // Join a general personal room for notifications
    socket.join(`user_${userId}`);

    // ── Disconnect ────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      // Remove socket from online users
      onlineUsers.get(userId)?.delete(socket.id);
      
      // Check if user is completely offline
      if (onlineUsers.get(userId)?.size === 0) {
        onlineUsers.delete(userId);
        
        // Remove user from all conversation rooms
        conversationRooms.forEach((users, conversationId) => {
          users.delete(userId);
          io.to(conversationId).emit('user_offline', { userId });
        });

        // Broadcast offline status
        socket.broadcast.emit('user_offline', { userId });
        console.log(`User disconnected: ${userId}`);
      }
    });
  });

  // Make io instance accessible to fastify
  fastify.decorate('io', io);
}
