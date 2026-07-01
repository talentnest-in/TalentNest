import { FastifyInstance } from 'fastify';
import { certificateController } from '../controllers/certificate.controller';

export async function certificateRoutes(fastify: FastifyInstance) {
  // Verify certificate (public)
  fastify.get('/certificates/verify/:code', {
    handler: certificateController.verifyCertificate,
  });

  // Get user's certificates
  fastify.get('/certificates', {
    preHandler: [fastify.authenticate],
    handler: certificateController.getUserCertificates,
  });

  // Get certificate by ID (with authorization)
  fastify.get('/certificates/:id', {
    preHandler: [fastify.authenticate],
    handler: certificateController.getCertificateById,
  });

  // Get certificate for specific enrollment
  fastify.get('/courses/:courseId/certificate', {
    preHandler: [fastify.authenticate],
    handler: certificateController.getEnrollmentCertificate,
  });
}
