import { FastifyInstance } from 'fastify';
import { saveJob, removeSavedJob, getSavedJobs } from '../controllers/saved-job.controller';

/**
 * Saved jobs routes - freelancer only
 * POST /api/v1/jobs/:id/save - Save a job
 * DELETE /api/v1/jobs/:id/save - Remove saved job
 * GET /api/v1/freelancers/saved-jobs - Get all saved jobs
 */
export async function savedJobRoutes(server: FastifyInstance) {
  server.addHook('preValidation', server.authenticate);

  // Save/Unsave job endpoints
  server.post('/jobs/:id/save', saveJob);
  server.delete('/jobs/:id/save', removeSavedJob);

  // Get saved jobs
  server.get('/freelancers/saved-jobs', getSavedJobs);
}
