import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';
import { uploadToCloudinary } from '../lib/cloudinary';

export const lessonController = {
  // Create section
  async createSection(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { courseId } = request.params as { courseId: string };
      const body = request.body as any;

      // Check if course exists and user is the creator
      const course = await prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        return reply.status(404).send({ error: 'Course not found' });
      }

      if (course.creatorId !== userId) {
        return reply.status(403).send({ error: 'You can only edit your own courses' });
      }

      // Get max order for this course
      const maxOrder = await prisma.courseSection.findFirst({
        where: { courseId },
        orderBy: { order: 'desc' },
      });

      const section = await prisma.courseSection.create({
        data: {
          courseId,
          title: body.title,
          description: body.description,
          order: (maxOrder?.order || 0) + 1,
        },
      });

      return reply.status(201).send(section);
    } catch (error) {
      request.log.error(error, 'Failed to create section');
      return reply.status(500).send({ error: 'Failed to create section' });
    }
  },

  // Update section
  async updateSection(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { sectionId } = request.params as { sectionId: string };
      const body = request.body as any;

      // Check if section exists and user is the course creator
      const section = await prisma.courseSection.findUnique({
        where: { id: sectionId },
        include: { course: true },
      });

      if (!section) {
        return reply.status(404).send({ error: 'Section not found' });
      }

      if (section.course.creatorId !== userId) {
        return reply.status(403).send({ error: 'You can only edit your own courses' });
      }

      const updatedSection = await prisma.courseSection.update({
        where: { id: sectionId },
        data: {
          ...(body.title && { title: body.title }),
          ...(body.description !== undefined && { description: body.description }),
          ...(body.order !== undefined && { order: body.order }),
        },
      });

      return reply.send(updatedSection);
    } catch (error) {
      request.log.error(error, 'Failed to update section');
      return reply.status(500).send({ error: 'Failed to update section' });
    }
  },

  // Delete section
  async deleteSection(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { sectionId } = request.params as { sectionId: string };

      // Check if section exists and user is the course creator
      const section = await prisma.courseSection.findUnique({
        where: { id: sectionId },
        include: { course: true },
      });

      if (!section) {
        return reply.status(404).send({ error: 'Section not found' });
      }

      if (section.course.creatorId !== userId) {
        return reply.status(403).send({ error: 'You can only edit your own courses' });
      }

      await prisma.courseSection.delete({
        where: { id: sectionId },
      });

      return reply.status(204).send();
    } catch (error) {
      request.log.error(error, 'Failed to delete section');
      return reply.status(500).send({ error: 'Failed to delete section' });
    }
  },

  // Create lesson
  async createLesson(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { sectionId } = request.params as { sectionId: string };
      const body = request.body as any;

      // Check if section exists and user is the course creator
      const section = await prisma.courseSection.findUnique({
        where: { id: sectionId },
        include: { course: true },
      });

      if (!section) {
        return reply.status(404).send({ error: 'Section not found' });
      }

      if (section.course.creatorId !== userId) {
        return reply.status(403).send({ error: 'You can only edit your own courses' });
      }

      // Get max order for this section
      const maxOrder = await prisma.lesson.findFirst({
        where: { sectionId },
        orderBy: { order: 'desc' },
      });

      const lesson = await prisma.lesson.create({
        data: {
          sectionId,
          title: body.title,
          description: body.description,
          content: body.content,
          videoUrl: body.videoUrl,
          attachments: body.attachments || [],
          duration: body.duration,
          type: body.type || 'VIDEO',
          order: (maxOrder?.order || 0) + 1,
          isPreview: body.isPreview || false,
        },
      });

      return reply.status(201).send(lesson);
    } catch (error) {
      request.log.error(error, 'Failed to create lesson');
      return reply.status(500).send({ error: 'Failed to create lesson' });
    }
  },

  // Update lesson
  async updateLesson(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { lessonId } = request.params as { lessonId: string };
      const body = request.body as any;

      // Check if lesson exists and user is the course creator
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
          section: {
            include: { course: true },
          },
        },
      });

      if (!lesson) {
        return reply.status(404).send({ error: 'Lesson not found' });
      }

      if (lesson.section.course.creatorId !== userId) {
        return reply.status(403).send({ error: 'You can only edit your own courses' });
      }

      const updatedLesson = await prisma.lesson.update({
        where: { id: lessonId },
        data: {
          ...(body.title && { title: body.title }),
          ...(body.description !== undefined && { description: body.description }),
          ...(body.content !== undefined && { content: body.content }),
          ...(body.videoUrl !== undefined && { videoUrl: body.videoUrl }),
          ...(body.attachments !== undefined && { attachments: body.attachments }),
          ...(body.duration !== undefined && { duration: body.duration }),
          ...(body.type && { type: body.type }),
          ...(body.order !== undefined && { order: body.order }),
          ...(body.isPreview !== undefined && { isPreview: body.isPreview }),
        },
      });

      return reply.send(updatedLesson);
    } catch (error) {
      request.log.error(error, 'Failed to update lesson');
      return reply.status(500).send({ error: 'Failed to update lesson' });
    }
  },

  // Upload lesson video
  async uploadLessonVideo(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { lessonId } = request.params as { lessonId: string };
      const data = await request.file();

      if (!data) {
        return reply.status(400).send({ error: 'No file uploaded' });
      }

      // Check if lesson exists and user is the course creator
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
          section: {
            include: { course: true },
          },
        },
      });

      if (!lesson) {
        return reply.status(404).send({ error: 'Lesson not found' });
      }

      if (lesson.section.course.creatorId !== userId) {
        return reply.status(403).send({ error: 'You can only edit your own courses' });
      }

      // Validate file type (video)
      const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
      if (!data.mimetype || !allowedTypes.includes(data.mimetype)) {
        return reply.status(400).send({ error: 'Invalid file type. Only MP4, WEBP, MOV allowed' });
      }

      const buffer = await data.toBuffer();

      // Upload to Cloudinary
      const result = await uploadToCloudinary(
        buffer,
        data.filename,
        data.mimetype,
        'talentnest/lesson-videos'
      );

      // Update lesson video URL
      const updatedLesson = await prisma.lesson.update({
        where: { id: lessonId },
        data: { videoUrl: result.secure_url },
      });

      return reply.send({ videoUrl: result.secure_url });
    } catch (error) {
      request.log.error(error, 'Failed to upload video');
      return reply.status(500).send({ error: 'Failed to upload video' });
    }
  },

  // Delete lesson
  async deleteLesson(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { lessonId } = request.params as { lessonId: string };

      // Check if lesson exists and user is the course creator
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
          section: {
            include: { course: true },
          },
        },
      });

      if (!lesson) {
        return reply.status(404).send({ error: 'Lesson not found' });
      }

      if (lesson.section.course.creatorId !== userId) {
        return reply.status(403).send({ error: 'You can only edit your own courses' });
      }

      await prisma.lesson.delete({
        where: { id: lessonId },
      });

      return reply.status(204).send();
    } catch (error) {
      request.log.error(error, 'Failed to delete lesson');
      return reply.status(500).send({ error: 'Failed to delete lesson' });
    }
  },

  // Reorder lessons
  async reorderLessons(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { sectionId } = request.params as { sectionId: string };
      const { lessons } = request.body as { lessons: { id: string; order: number }[] };

      // Check if section exists and user is the course creator
      const section = await prisma.courseSection.findUnique({
        where: { id: sectionId },
        include: { course: true },
      });

      if (!section) {
        return reply.status(404).send({ error: 'Section not found' });
      }

      if (section.course.creatorId !== userId) {
        return reply.status(403).send({ error: 'You can only edit your own courses' });
      }

      // Update order for each lesson
      await Promise.all(
        lessons.map(({ id, order }) =>
          prisma.lesson.update({
            where: { id },
            data: { order },
          })
        )
      );

      return reply.send({ success: true });
    } catch (error) {
      request.log.error(error, 'Failed to reorder lessons');
      return reply.status(500).send({ error: 'Failed to reorder lessons' });
    }
  },
};
