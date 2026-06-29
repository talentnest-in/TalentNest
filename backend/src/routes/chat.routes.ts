import { FastifyInstance } from 'fastify';
import {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  getOrCreateConversation,
} from '../controllers/chat.controller';

export async function chatRoutes(fastify: FastifyInstance) {
  // Get all conversations for the current user
  fastify.get('/conversations', { preValidation: [fastify.authenticate] }, getConversations);

  // Get messages for a specific conversation
  fastify.get<{ Params: { conversationId: string } }>(
    '/conversations/:conversationId/messages',
    { preValidation: [fastify.authenticate] },
    getMessages
  );

  // Send a message to a conversation
  fastify.post<{ Params: { conversationId: string }; Body: { content: string } }>(
    '/conversations/:conversationId/messages',
    { preValidation: [fastify.authenticate] },
    sendMessage
  );

  // Mark messages as read
  fastify.patch<{ Params: { conversationId: string } }>(
    '/conversations/:conversationId/read',
    { preValidation: [fastify.authenticate] },
    markAsRead
  );

  // Get or create conversation for a contract
  fastify.get<{ Params: { contractId: string } }>(
    '/contracts/:contractId/conversation',
    { preValidation: [fastify.authenticate] },
    getOrCreateConversation
  );
}
