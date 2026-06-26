import { FastifyInstance } from 'fastify';
import { getOpenJobs, getJob } from '../controllers/job.controller';

/**
 * Freelancer marketplace routes — authenticated, any role.
 * GET /api/v1/jobs        → browse all OPEN jobs
 * GET /api/v1/jobs/:id    → view a single job's details
 */
export async function jobRoutes(server: FastifyInstance) {
  server.addHook('preValidation', server.authenticate);

  server.get('/', getOpenJobs);
  server.get('/:id', getJob);
}
