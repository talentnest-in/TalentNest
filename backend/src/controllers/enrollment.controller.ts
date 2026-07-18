import { FastifyRequest, FastifyReply } from 'fastify';
import { enrollCourse as svcEnrollCourse, getUserEnrollments, getEnrollment, updateLessonProgress, cancelEnrollment } from '../services/enrollment.service';
import { AppError } from '../lib/errors';

export const enrollmentController = {
  async enrollCourse(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { courseId } = request.params as { courseId: string };
      const result = await svcEnrollCourse(userId, courseId);
      return reply.status(201).send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
      request.log.error(error, 'enrollCourse failed');
      return reply.status(500).send({ message: 'Failed to enroll' });
    }
  },

  async getUserEnrollments(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { status } = request.query as { status?: string };
      const result = await getUserEnrollments(userId, status);
      return reply.send(result);
    } catch (error) {
      request.log.error(error, 'getUserEnrollments failed');
      return reply.status(500).send({ message: 'Failed to fetch enrollments' });
    }
  },

  async getEnrollment(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { courseId } = request.params as { courseId: string };
      const result = await getEnrollment(userId, courseId);
      return reply.send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
      request.log.error(error, 'getEnrollment failed');
      return reply.status(500).send({ message: 'Failed to fetch enrollment' });
    }
  },

  async updateLessonProgress(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { enrollmentId } = request.params as { enrollmentId: string };
      const body = request.body as any;
      const result = await updateLessonProgress(userId, enrollmentId, body);
      return reply.send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
      request.log.error(error, 'updateLessonProgress failed');
      return reply.status(500).send({ message: 'Failed to update progress' });
    }
  },

  async cancelEnrollment(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { enrollmentId } = request.params as { enrollmentId: string };
      await cancelEnrollment(userId, enrollmentId);
      return reply.send({ success: true });
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
      request.log.error(error, 'cancelEnrollment failed');
      return reply.status(500).send({ message: 'Failed to cancel enrollment' });
    }
  },
};
