import { FastifyInstance } from 'fastify';
import { analyticsController } from '../controllers/analytics.controller';

export async function analyticsRoutes(fastify: FastifyInstance) {
  // Get course analytics
  fastify.get('/courses/:courseId/analytics', {
    preHandler: [fastify.authenticate],
    handler: analyticsController.getCourseAnalytics,
  });

  // Get platform-wide analytics (admin only)
  fastify.get('/analytics/platform', {
    preHandler: [fastify.authenticate],
    handler: analyticsController.getPlatformAnalytics,
  });
}
