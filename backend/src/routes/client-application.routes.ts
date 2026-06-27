import { FastifyInstance } from 'fastify';
import {
  getJobApplicants,
  getApplicantDetails,
  updateApplicationStatus,
} from '../controllers/client-application.controller';

export async function clientApplicationRoutes(fastify: FastifyInstance) {
  fastify.addHook('preValidation', fastify.authenticate);

  // Get applicants for a job
  fastify.get('/client/jobs/:jobId/applications', getJobApplicants);

  // Get applicant details
  fastify.get('/client/applications/:id', getApplicantDetails);

  // Update application status
  fastify.patch('/client/applications/:id/status', updateApplicationStatus);
}
