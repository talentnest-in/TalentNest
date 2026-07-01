import { FastifyInstance } from 'fastify';
import { lessonController } from '../controllers/lesson.controller';

export async function lessonRoutes(fastify: FastifyInstance) {
  // Create section
  fastify.post('/courses/:courseId/sections', {
    preHandler: [fastify.authenticate],
    handler: lessonController.createSection,
  });

  // Update section
  fastify.put('/sections/:sectionId', {
    preHandler: [fastify.authenticate],
    handler: lessonController.updateSection,
  });

  // Delete section
  fastify.delete('/sections/:sectionId', {
    preHandler: [fastify.authenticate],
    handler: lessonController.deleteSection,
  });

  // Create lesson
  fastify.post('/sections/:sectionId/lessons', {
    preHandler: [fastify.authenticate],
    handler: lessonController.createLesson,
  });

  // Update lesson
  fastify.put('/lessons/:lessonId', {
    preHandler: [fastify.authenticate],
    handler: lessonController.updateLesson,
  });

  // Upload lesson video
  fastify.post('/lessons/:lessonId/video', {
    preHandler: [fastify.authenticate],
    handler: lessonController.uploadLessonVideo,
  });

  // Delete lesson
  fastify.delete('/lessons/:lessonId', {
    preHandler: [fastify.authenticate],
    handler: lessonController.deleteLesson,
  });

  // Reorder lessons
  fastify.post('/sections/:sectionId/lessons/reorder', {
    preHandler: [fastify.authenticate],
    handler: lessonController.reorderLessons,
  });
}
