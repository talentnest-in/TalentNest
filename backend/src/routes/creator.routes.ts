import { FastifyInstance } from 'fastify';
import { creatorController } from '../controllers/creator.controller';

export async function creatorRoutes(fastify: FastifyInstance) {
  // Get or create creator profile
  fastify.get('/creator/profile', {
    preHandler: [fastify.authenticate],
    handler: creatorController.getCreatorProfile,
  });

  // Update creator profile
  fastify.put('/creator/profile', {
    preHandler: [fastify.authenticate],
    handler: creatorController.updateCreatorProfile,
  });

  // Get creator dashboard stats
  fastify.get('/creator/stats', {
    preHandler: [fastify.authenticate],
    handler: creatorController.getCreatorStats,
  });

  // Get public creator profile
  fastify.get('/creators/:creatorId', {
    handler: creatorController.getPublicCreatorProfile,
  });
}
