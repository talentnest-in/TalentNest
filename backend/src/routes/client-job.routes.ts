import { FastifyInstance } from 'fastify';
import {
  createJob,
  getMyJobs,
  getJob,
  updateJob,
  deleteJob,
} from '../controllers/job.controller';

/**
 * Client job management routes — authenticated, CLIENT role only.
 * GET    /api/v1/client/jobs       → list client's own jobs
 * POST   /api/v1/client/jobs       → create a new job
 * GET    /api/v1/client/jobs/:id   → view a single job (owner check recommended)
 * PUT    /api/v1/client/jobs/:id   → update a job
 * DELETE /api/v1/client/jobs/:id   → delete a job
 */
export async function clientJobRoutes(server: FastifyInstance) {
  server.addHook('preValidation', server.authenticate);

  server.get('/', getMyJobs);
  server.post('/', createJob);
  server.get('/:id', getJob);
  server.put('/:id', updateJob);
  server.delete('/:id', deleteJob);
}
