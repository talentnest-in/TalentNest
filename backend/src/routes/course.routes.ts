import { FastifyInstance } from 'fastify';
import { courseController } from '../controllers/course.controller';

export async function courseRoutes(fastify: FastifyInstance) {
  // Get all courses (marketplace)
  fastify.get('/courses', {
    handler: courseController.getAllCourses,
  });

  // Get course by slug
  fastify.get('/courses/:slug', {
    handler: courseController.getCourseBySlug,
  });

  // Get course by ID (for creator editing)
  fastify.get('/courses/id/:id', {
    preHandler: [fastify.authenticate],
    handler: courseController.getCourseById,
  });

  // Get creator's courses
  fastify.get('/courses/creator/me', {
    preHandler: [fastify.authenticate],
    handler: courseController.getCreatorCourses,
  });

  // Create course
  fastify.post('/courses', {
    preHandler: [fastify.authenticate],
    handler: courseController.createCourse,
  });

  // Update course
  fastify.put('/courses/:id', {
    preHandler: [fastify.authenticate],
    handler: courseController.updateCourse,
  });

  // Upload course thumbnail
  fastify.post('/courses/:id/thumbnail', {
    preHandler: [fastify.authenticate],
    handler: courseController.uploadThumbnail,
  });

  // Delete course
  fastify.delete('/courses/:id', {
    preHandler: [fastify.authenticate],
    handler: courseController.deleteCourse,
  });

  // Get course categories
  fastify.get('/courses/categories', {
    handler: courseController.getCategories,
  });

  // Get course tags
  fastify.get('/courses/tags', {
    handler: courseController.getTags,
  });
}
