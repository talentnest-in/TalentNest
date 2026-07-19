import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { getCourseAnalytics, getPlatformAnalytics } from '../services/analytics.service';
import { AppError } from '../lib/errors';

export const analyticsController = {
  async getCourseAnalytics(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { courseId } = z.object({ courseId: z.string().uuid('Invalid course ID') }).parse(request.params);
      const result = await getCourseAnalytics(userId, courseId);
      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send({ message: 'Invalid course ID format' });
      if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
      request.log.error(error, 'getCourseAnalytics failed');
      return reply.status(500).send({ message: 'Failed to fetch analytics' });
    }
  },

  async getPlatformAnalytics(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const result = await getPlatformAnalytics(userId);
      return reply.send(result);
    } catch (error) {
      request.log.error(error, 'getPlatformAnalytics failed');
      return reply.status(500).send({ message: 'Failed to fetch platform analytics' });
    }
  },
};
