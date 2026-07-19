import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { uploadToCloudinary, uploadVideoToCloudinary } from '../lib/cloudinary';
import { createSection as svcCreateSection, updateSection as svcUpdateSection, deleteSection as svcDeleteSection, createLesson as svcCreateLesson, updateLesson as svcUpdateLesson, deleteLesson as svcDeleteLesson, reorderLessons as svcReorderLessons } from '../services/lesson.service';
import { AppError } from '../lib/errors';

const courseIdSchema = z.object({ courseId: z.string().uuid('Invalid course ID') });
const sectionIdSchema = z.object({ sectionId: z.string().uuid('Invalid section ID') });
const lessonIdSchema = z.object({ lessonId: z.string().uuid('Invalid lesson ID') });

export const lessonController = {
  async createSection(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { courseId } = courseIdSchema.parse(request.params);
      const result = await svcCreateSection(userId, courseId, request.body as any);
      return reply.status(201).send(result);
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send({ message: 'Invalid course ID format' });
      if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
      request.log.error(error, 'createSection failed');
      return reply.status(500).send({ message: 'Failed to create section' });
    }
  },

  async updateSection(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { sectionId } = sectionIdSchema.parse(request.params);
      const result = await svcUpdateSection(userId, sectionId, request.body as any);
      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send({ message: 'Invalid section ID format' });
      if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
      request.log.error(error, 'updateSection failed');
      return reply.status(500).send({ message: 'Failed to update section' });
    }
  },

  async deleteSection(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { sectionId } = sectionIdSchema.parse(request.params);
      await svcDeleteSection(userId, sectionId);
      return reply.send({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send({ message: 'Invalid section ID format' });
      if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
      request.log.error(error, 'deleteSection failed');
      return reply.status(500).send({ message: 'Failed to delete section' });
    }
  },

  async createLesson(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { sectionId } = sectionIdSchema.parse(request.params);
      const result = await svcCreateLesson(userId, sectionId, request.body as any);
      return reply.status(201).send(result);
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send({ message: 'Invalid section ID format' });
      if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
      request.log.error(error, 'createLesson failed');
      return reply.status(500).send({ message: 'Failed to create lesson' });
    }
  },

  async updateLesson(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { lessonId } = lessonIdSchema.parse(request.params);
      const result = await svcUpdateLesson(userId, lessonId, request.body as any);
      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send({ message: 'Invalid lesson ID format' });
      if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
      request.log.error(error, 'updateLesson failed');
      return reply.status(500).send({ message: 'Failed to update lesson' });
    }
  },

  async deleteLesson(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { lessonId } = lessonIdSchema.parse(request.params);
      await svcDeleteLesson(userId, lessonId);
      return reply.send({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send({ message: 'Invalid lesson ID format' });
      if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
      request.log.error(error, 'deleteLesson failed');
      return reply.status(500).send({ message: 'Failed to delete lesson' });
    }
  },

  async reorderLessons(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { sectionId } = sectionIdSchema.parse(request.params);
      const result = await svcReorderLessons(userId, sectionId, request.body as any);
      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send({ message: 'Invalid section ID format' });
      if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
      request.log.error(error, 'reorderLessons failed');
      return reply.status(500).send({ message: 'Failed to reorder lessons' });
    }
  },

  async uploadLessonVideo(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { lessonId } = lessonIdSchema.parse(request.params);
      const file = await request.file();
      if (!file) return reply.status(400).send({ message: 'No file uploaded' });
      const result = await uploadVideoToCloudinary(file.file, file.filename, file.mimetype, 'lesson_video');
      const updated = await svcUpdateLesson(userId, lessonId, { videoUrl: result.secure_url });
      return reply.send(updated);
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send({ message: 'Invalid lesson ID format' });
      if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
      request.log.error(error, 'uploadLessonVideo failed');
      return reply.status(500).send({ message: 'Failed to upload video' });
    }
  },

  async uploadLessonPdf(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { lessonId } = lessonIdSchema.parse(request.params);
      const file = await request.file();
      if (!file) return reply.status(400).send({ message: 'No file uploaded' });
      const result = await uploadToCloudinary(await file.toBuffer(), file.filename, file.mimetype, 'lesson_pdf');
      const lesson = await svcUpdateLesson(userId, lessonId, { attachments: [result.secure_url] });
      return reply.send(lesson);
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send({ message: 'Invalid lesson ID format' });
      if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
      request.log.error(error, 'uploadLessonPdf failed');
      return reply.status(500).send({ message: 'Failed to upload PDF' });
    }
  },
};
