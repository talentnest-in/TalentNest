import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyCertificate, getUserCertificates, getEnrollmentCertificate, getCertificateById } from '../services/certificate.service';
import { AppError } from '../lib/errors';

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
      const { enrollmentId } = request.params as { enrollmentId: string };
      const result = await getEnrollmentCertificate(userId, enrollmentId);
      return reply.send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
      request.log.error(error, 'getEnrollmentCertificate failed');
      return reply.status(500).send({ message: 'Failed to fetch certificate' });
    }
  },

  async getCertificateById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id } = request.params as { id: string };
      const result = await getCertificateById(userId, id);
      return reply.send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
      request.log.error(error, 'getCertificateById failed');
      return reply.status(500).send({ message: 'Failed to fetch certificate' });
    }
  },
};
