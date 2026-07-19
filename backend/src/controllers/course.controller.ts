import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { uploadToCloudinary } from '../lib/cloudinary';
import { getAllCourses, getCourseBySlug, getCourseById, getCreatorCourses, createCourse as svcCreateCourse, updateCourse as svcUpdateCourse, deleteCourse as svcDeleteCourse, getCategories, getTags, createCourseSchema, updateCourseSchema } from '../services/course.service';
import { AppError } from '../lib/errors';

const courseIdSchema = z.object({ id: z.string().uuid('Invalid course ID') });

export const courseController = {
  async getAllCourses(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await getAllCourses(request.query as any);
      return reply.send(result);
    } catch (error) {
      request.log.error(error, 'getAllCourses failed');
      return reply.status(500).send({ message: 'Failed to fetch courses' });
    }
  },

  async getCourseBySlug(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { slug } = request.params as { slug: string };
      if (!slug || typeof slug !== 'string') {
        return reply.status(400).send({ message: 'Invalid course slug' });
      }
      const result = await getCourseBySlug(slug);
      return reply.send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
      request.log.error(error, 'getCourseBySlug failed');
      return reply.status(500).send({ message: 'Failed to fetch course' });
    }
  },

  async getCourseById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id } = courseIdSchema.parse(request.params);
      const result = await getCourseById(id, userId);
      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send({ message: 'Invalid course ID format' });
      if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
      request.log.error(error, 'getCourseById failed');
      return reply.status(500).send({ message: 'Failed to fetch course' });
    }
  },

  async getCreatorCourses(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const result = await getCreatorCourses(userId, request.query as any);
      return reply.send(result);
    } catch (error) {
      request.log.error(error, 'getCreatorCourses failed');
      return reply.status(500).send({ message: 'Failed to fetch courses' });
    }
  },

  async createCourse(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const data = createCourseSchema.parse(request.body);
      const result = await svcCreateCourse(userId, data);
      return reply.status(201).send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
      request.log.error(error, 'createCourse failed');
      return reply.status(500).send({ message: 'Failed to create course' });
    }
  },

  async updateCourse(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id } = courseIdSchema.parse(request.params);
      const data = updateCourseSchema.parse(request.body);
      const result = await svcUpdateCourse(userId, id, data);
      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send({ message: 'Invalid course ID format' });
      if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
      request.log.error(error, 'updateCourse failed');
      return reply.status(500).send({ message: 'Failed to update course' });
    }
  },

  async deleteCourse(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id } = courseIdSchema.parse(request.params);
      await svcDeleteCourse(userId, id);
      return reply.status(204).send();
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send({ message: 'Invalid course ID format' });
      if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
      request.log.error(error, 'deleteCourse failed');
      return reply.status(500).send({ message: 'Failed to delete course' });
    }
  },

  async getCategories(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const categories = await getCategories();
      return reply.send(categories);
    } catch (error) {
      return reply.status(500).send({ message: 'Failed to fetch categories' });
    }
  },

  async getTags(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const tags = await getTags();
      return reply.send(tags);
    } catch (error) {
      return reply.status(500).send({ message: 'Failed to fetch tags' });
    }
  },

  async uploadThumbnail(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id } = courseIdSchema.parse(request.params);
      const file = await request.file();
      if (!file) return reply.status(400).send({ message: 'No file uploaded' });
      const result = await uploadToCloudinary(await file.toBuffer(), file.filename, file.mimetype, 'course_thumbnail');
      const updated = await svcUpdateCourse(userId, id, { thumbnail: result.secure_url });
      return reply.send(updated);
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send({ message: 'Invalid course ID format' });
      if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
      request.log.error(error, 'uploadThumbnail failed');
      return reply.status(500).send({ message: 'Failed to upload thumbnail' });
    }
  },
};
