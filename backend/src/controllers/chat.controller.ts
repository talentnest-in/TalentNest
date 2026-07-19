import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { getConversations as svcGetConversations, getMessages as svcGetMessages, sendMessage as svcSendMessage, markAsRead as svcMarkAsRead, getOrCreateConversation as svcGetOrCreateConversation } from '../services/chat.service';
import { AppError } from '../lib/errors';

export const getConversations = async (request: FastifyRequest<{ Querystring: { page?: string; limit?: string } }>, reply: FastifyReply) => {
  try {
    const result = await svcGetConversations(request.user.id, request.query);
    return reply.send(result);
  } catch (error) {
    request.log.error(error, 'getConversations failed');
    return reply.status(500).send({ error: 'Failed to fetch conversations' });
  }
};

export const getMessages = async (request: FastifyRequest<{ Params: { conversationId: string } }>, reply: FastifyReply) => {
  try {
    const conversationId = z.string().uuid('Invalid conversation ID').parse(request.params.conversationId);
    const query = request.query as { cursor?: string; limit?: string };
    const result = await svcGetMessages(request.user.id, conversationId, query);
    return reply.send(result);
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ error: 'Invalid conversation ID format' });
    if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
    request.log.error(error, 'getMessages failed');
    return reply.status(500).send({ error: 'Failed to fetch messages' });
  }
};

export const sendMessage = async (request: FastifyRequest<{ Params: { conversationId: string } }>, reply: FastifyReply) => {
  try {
    const conversationId = z.string().uuid('Invalid conversation ID').parse(request.params.conversationId);
    const result = await svcSendMessage(request.user.id, conversationId, request.body);
    return reply.status(201).send(result);
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ error: 'Invalid conversation ID format' });
    if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
    request.log.error(error, 'sendMessage failed');
    return reply.status(500).send({ error: 'Failed to send message' });
  }
};

export const markAsRead = async (request: FastifyRequest<{ Params: { conversationId: string } }>, reply: FastifyReply) => {
  try {
    const conversationId = z.string().uuid('Invalid conversation ID').parse(request.params.conversationId);
    const result = await svcMarkAsRead(request.user.id, conversationId);
    return reply.send(result);
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ error: 'Invalid conversation ID format' });
    if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
    request.log.error(error, 'markAsRead failed');
    return reply.status(500).send({ error: 'Failed to mark messages as read' });
  }
};

export const getOrCreateConversation = async (request: FastifyRequest<{ Params: { contractId: string } }>, reply: FastifyReply) => {
  try {
    const contractId = z.string().uuid('Invalid contract ID').parse(request.params.contractId);
    const result = await svcGetOrCreateConversation(request.user.id, contractId);
    return reply.send(result);
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ error: 'Invalid contract ID format' });
    if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
    request.log.error(error, 'getOrCreateConversation failed');
    return reply.status(500).send({ error: 'Failed to get or create conversation' });
  }
};
