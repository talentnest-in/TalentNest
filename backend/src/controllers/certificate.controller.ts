import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { verifyCertificate, getUserCertificates, getEnrollmentCertificate, getCertificateById } from '../services/certificate.service';
import { AppError } from '../lib/errors';

const certIdSchema = z.object({ id: z.string().uuid('Invalid certificate ID') });

export const certificateController = {
  async verifyCertificate(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { code } = request.params as { code: string };
      const result = await verifyCertificate(code);
      return reply.send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
      request.log.error(error, 'verifyCertificate failed');
      return reply.status(500).send({ message: 'Failed to verify certificate' });
    }
  },

  async getUserCertificates(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const result = await getUserCertificates(userId);
      return reply.send(result);
    } catch (error) {
      request.log.error(error, 'getUserCertificates failed');
      return reply.status(500).send({ message: 'Failed to fetch certificates' });
    }
  },

  async getEnrollmentCertificate(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { courseId } = z.object({ courseId: z.string().uuid('Invalid course ID') }).parse(request.params);
      const result = await getEnrollmentCertificate(userId, courseId);
      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send({ message: 'Invalid course ID format' });
      if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
      request.log.error(error, 'getEnrollmentCertificate failed');
      return reply.status(500).send({ message: 'Failed to fetch certificate' });
    }
  },

  async getCertificateById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id } = certIdSchema.parse(request.params);
      const result = await getCertificateById(userId, id);
      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send({ message: 'Invalid certificate ID format' });
      if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
      request.log.error(error, 'getCertificateById failed');
      return reply.status(500).send({ message: 'Failed to fetch certificate' });
    }
  },
};
