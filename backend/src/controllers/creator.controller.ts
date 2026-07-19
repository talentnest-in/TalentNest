import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { getCreatorProfile as svcGetCreatorProfile, updateCreatorProfile as svcUpdateCreatorProfile, getCreatorStats as svcGetCreatorStats, getPublicCreatorProfile as svcGetPublicCreatorProfile } from '../services/creator.service';
import { AppError } from '../lib/errors';

export const creatorController = {
  async getCreatorProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const result = await svcGetCreatorProfile(userId);
      return reply.send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
      return reply.status(500).send({ message: 'Failed to fetch creator profile' });
    }
  },

  async updateCreatorProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const result = await svcUpdateCreatorProfile(userId, request.body as any);
      return reply.send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
      return reply.status(500).send({ message: 'Failed to update creator profile' });
    }
  },

  async getCreatorStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const result = await svcGetCreatorStats(userId);
      return reply.send(result);
    } catch (error) {
      request.log.error(error, 'getCreatorStats failed');
      return reply.status(500).send({ message: 'Failed to fetch stats' });
    }
  },

  async getPublicCreatorProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { creatorId } = z.object({ creatorId: z.string().uuid('Invalid creator ID') }).parse(request.params);
      const result = await svcGetPublicCreatorProfile(creatorId);
      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send({ message: 'Invalid creator ID format' });
      if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
      return reply.status(500).send({ message: 'Failed to fetch creator profile' });
    }
  },
};


