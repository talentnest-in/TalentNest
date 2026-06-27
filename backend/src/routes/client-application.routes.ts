import { FastifyInstance } from 'fastify';
import {
  getAllClientApplicants,
  getJobApplicants,
  getApplicantDetails,
  updateApplicationStatus,
} from '../controllers/client-application.controller';

export async function clientApplicationRoutes(fastify: FastifyInstance) {
  fastify.addHook('preValidation', fastify.authenticate);

  // Get all applicants for client (across all jobs)
  fastify.get('/client/applications', getAllClientApplicants);

  // Get applicants for a job
  fastify.get('/client/jobs/:jobId/applications', getJobApplicants);

  // Get applicant details
  fastify.get('/client/applications/:id', getApplicantDetails);

  // Update application status
  fastify.patch('/client/applications/:id/status', updateApplicationStatus);
}
