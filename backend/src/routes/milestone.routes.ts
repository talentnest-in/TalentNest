import { FastifyInstance } from 'fastify';
import {
  getMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  fundMilestone,
  releaseMilestone,
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

  // Fund a milestone
  fastify.post('/contracts/:contractId/milestones/:id/fund', {
    preHandler: [fastify.authenticate],
    handler: fundMilestone,
  });

  // Release milestone funds
  fastify.post('/contracts/:contractId/milestones/:id/release', {
    preHandler: [fastify.authenticate],
    handler: releaseMilestone,
  });
}
