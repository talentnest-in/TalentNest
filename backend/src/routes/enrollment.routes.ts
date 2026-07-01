import { FastifyInstance } from 'fastify';
import { enrollmentController } from '../controllers/enrollment.controller';

export async function enrollmentRoutes(fastify: FastifyInstance) {
  // Enroll in course
  fastify.post('/courses/:courseId/enroll', {
    preHandler: [fastify.authenticate],
    handler: enrollmentController.enrollCourse,
  });

  // Get user's enrollments
  fastify.get('/enrollments', {
    preHandler: [fastify.authenticate],
    handler: enrollmentController.getUserEnrollments,
  });

  // Get enrollment details
  fastify.get('/courses/:courseId/enrollment', {
    preHandler: [fastify.authenticate],
    handler: enrollmentController.getEnrollment,
  });

  // Update lesson progress
  fastify.post('/lessons/:lessonId/progress', {
    preHandler: [fastify.authenticate],
    handler: enrollmentController.updateLessonProgress,
  });

  // Cancel enrollment
  fastify.delete('/courses/:courseId/enrollment', {
    preHandler: [fastify.authenticate],
    handler: enrollmentController.cancelEnrollment,
  });
}
