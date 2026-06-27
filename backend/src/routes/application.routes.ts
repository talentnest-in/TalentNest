import { FastifyInstance } from 'fastify';
import {
  applyForJob,
  getMyApplications,
  getApplicationDetails,
  withdrawApplication,
} from '../controllers/application.controller';

export async function applicationRoutes(fastify: FastifyInstance) {
  fastify.addHook('preValidation', fastify.authenticate);

  // Apply for a job
  fastify.post('/jobs/:id/apply', applyForJob);

  // Get my applications
  fastify.get('/freelancers/applications', getMyApplications);

  // Get application details
  fastify.get('/freelancers/applications/:id', getApplicationDetails);

  // Withdraw application
  fastify.put('/freelancers/applications/:id/withdraw', withdrawApplication);
}
