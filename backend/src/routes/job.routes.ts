import { FastifyInstance } from 'fastify';
import { getOpenJobs, getJob, getRecommendedJobs } from '../controllers/job.controller';

/**
 * Freelancer marketplace routes — authenticated, any role.
 * GET /api/v1/jobs              → browse all OPEN jobs
 * GET /api/v1/jobs/recommended  → personalized job recommendations
 * GET /api/v1/jobs/:id          → view a single job's details
 */
export async function jobRoutes(server: FastifyInstance) {
  server.addHook('preValidation', server.authenticate);

  server.get('/', getOpenJobs);
  server.get('/recommended', getRecommendedJobs);
  server.get('/:id', getJob);
}
