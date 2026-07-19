import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { enrollCourse as svcEnrollCourse, getUserEnrollments, getEnrollment, updateLessonProgressByEnrollment, cancelEnrollment } from '../services/enrollment.service';
import { AppError } from '../lib/errors';

const courseIdSchema = z.object({ courseId: z.string().uuid('Invalid course ID') });
const enrollmentIdSchema = z.object({ enrollmentId: z.string().uuid('Invalid enrollment ID') });
const lessonProgressSchema = z.object({
  lessonId: z.string().uuid('Invalid lesson ID'),
  completed: z.boolean().optional(),
  timeSpent: z.number().int().min(0).optional(),
});

export const enrollmentController = {
  async enrollCourse(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { courseId } = courseIdSchema.parse(request.params);
      const result = await svcEnrollCourse(userId, courseId);
      return reply.status(201).send(result);
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send({ message: 'Invalid course ID format' });
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
      const { courseId } = courseIdSchema.parse(request.params);
      const result = await getEnrollment(userId, courseId);
      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send({ message: 'Invalid course ID format' });
      if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
      request.log.error(error, 'getEnrollment failed');
      return reply.status(500).send({ message: 'Failed to fetch enrollment' });
    }
  },

  async updateLessonProgress(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { lessonId, completed, timeSpent } = lessonProgressSchema.parse(request.body);
      const progressData: { completed?: boolean; timeSpent?: number } = {};
      if (completed !== undefined) progressData.completed = completed;
      if (timeSpent !== undefined) progressData.timeSpent = timeSpent;
      const result = await updateLessonProgressByEnrollment(userId, lessonId, progressData);
      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send({ message: 'Invalid request body' });
      if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
      request.log.error(error, 'updateLessonProgress failed');
      return reply.status(500).send({ message: 'Failed to update progress' });
    }
  },

  async cancelEnrollment(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { enrollmentId } = enrollmentIdSchema.parse(request.params);
      await cancelEnrollment(userId, enrollmentId);
      return reply.send({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send({ message: 'Invalid enrollment ID format' });
      if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
      request.log.error(error, 'cancelEnrollment failed');
      return reply.status(500).send({ message: 'Failed to cancel enrollment' });
    }
  },
};
