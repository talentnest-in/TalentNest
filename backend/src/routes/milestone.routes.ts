import { FastifyInstance } from 'fastify';
import {
  getMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
} from '../controllers/milestone.controller';

export async function milestoneRoutes(fastify: FastifyInstance) {
  // Get all milestones for a contract
  fastify.get('/contracts/:contractId/milestones', {
    preHandler: [fastify.authenticate],
    handler: getMilestones,
  });

  // Create a milestone
  fastify.post('/contracts/:contractId/milestones', {
    preHandler: [fastify.authenticate],
    handler: createMilestone,
  });

  // Update a milestone
  fastify.patch('/contracts/:contractId/milestones/:id', {
    preHandler: [fastify.authenticate],
    handler: updateMilestone,
  });

  // Delete a milestone
  fastify.delete('/contracts/:contractId/milestones/:id', {
    preHandler: [fastify.authenticate],
    handler: deleteMilestone,
  });
}
