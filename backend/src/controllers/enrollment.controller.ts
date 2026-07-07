import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';
import crypto from 'crypto';

export const enrollmentController = {
  // Enroll in course
  async enrollCourse(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { courseId } = request.params as { courseId: string };

      // Check if course exists and is published
      const course = await prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        return reply.status(404).send({ error: 'Course not found' });
      }

      if (course.status !== 'PUBLISHED') {
        return reply.status(400).send({ error: 'Course is not available for enrollment' });
      }

      // Check if already enrolled
      const existingEnrollment = await prisma.enrollment.findUnique({
        where: {
          courseId_studentId: {
            courseId,
            studentId: userId,
          },
        },
      });

      if (existingEnrollment) {
        return reply.status(400).send({ error: 'Already enrolled in this course' });
      }

      // Create enrollment
      const enrollment = await prisma.enrollment.create({
        data: {
          courseId,
          studentId: userId,
          status: 'ACTIVE',
        },
        include: {
          course: {
            include: {
              creator: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      // Create purchase record
      await prisma.coursePurchase.create({
        data: {
          courseId,
          studentId: userId,
          amount: course.discountPrice || course.price,
          currency: 'USD',
          discountAmount: course.discountPrice ? course.price - course.discountPrice : 0,
        },
      });

      // Update course analytics
      await prisma.courseAnalytics.upsert({
        where: { courseId },
        create: {
          courseId,
          totalEnrollments: 1,
        },
        update: {
          totalEnrollments: {
            increment: 1,
          },
        },
      });

      return reply.status(201).send(enrollment);
    } catch (error) {
      request.log.error(error, 'Failed to enroll in course');
      return reply.status(500).send({ error: 'Failed to enroll in course' });
    }
  },

  // Get user's enrollments
  async getUserEnrollments(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { status } = request.query as any;

      const where: any = { studentId: userId };
      if (status) {
        where.status = status;
      }

      const enrollments = await prisma.enrollment.findMany({
        where,
        include: {
          course: {
            include: {
              creator: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                },
              },
              category: true,
            },
          },
          progressRecords: true,
        },
        orderBy: { enrolledAt: 'desc' },
      });

      return reply.send(enrollments);
    } catch (error) {
      request.log.error(error, 'Failed to fetch enrollments');
      return reply.status(500).send({ error: 'Failed to fetch enrollments' });
    }
  },

  // Get enrollment details
  async getEnrollment(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { courseId } = request.params as { courseId: string };

      // Check if course exists
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          category: true,
          sections: {
            orderBy: { order: 'asc' },
            include: {
              lessons: {
                orderBy: { order: 'asc' },
              },
            },
          },
        },
      });

      if (!course) {
        return reply.status(404).send({ error: 'Course not found' });
      }

      // Check if user is enrolled
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          courseId_studentId: {
            courseId,
            studentId: userId,
          },
        },
        include: {
          progressRecords: true,
          certificate: true,
        },
      });

      if (!enrollment) {
        // User is not enrolled - return course with enrollment status
        return reply.send({
          enrolled: false,
          progress: 0,
          completed: false,
          enrollmentId: null,
          course,
          progressRecords: [],
        });
      }

      // Fetch lesson progress separately
      const lessonProgress = await prisma.lessonProgress.findMany({
        where: { enrollmentId: enrollment.id },
      });

      // Attach progress to lessons
      const courseWithProgress = {
        ...enrollment,
        course: {
          ...course,
          sections: course.sections.map(section => ({
            ...section,
            lessons: section.lessons.map(lesson => ({
              ...lesson,
              progress: lessonProgress.find(p => p.lessonId === lesson.id) || null,
            })),
          })),
        },
      };

      // Calculate progress based on completed lessons only
      const totalLessons = course.sections.flatMap(s => s.lessons).length;
      const completedLessons = lessonProgress.filter(p => p.completed).length;
      const lessonProgressPercent = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

      // Course is complete when all lessons are done (100% progress)
      const isCourseComplete = completedLessons === totalLessons;

      // Update enrollment status if course is complete
      if (isCourseComplete && enrollment.status !== 'COMPLETED') {
        await prisma.enrollment.update({
          where: { id: enrollment.id },
          data: { status: 'COMPLETED', completedAt: new Date() },
        });
      }

      return reply.send({
        ...courseWithProgress,
        enrolled: true,
        progress: Math.round(lessonProgressPercent),
        completed: isCourseComplete,
      });
    } catch (error) {
      request.log.error(error, 'Failed to fetch enrollment');
      return reply.status(500).send({ error: 'Failed to fetch enrollment' });
    }
  },

  // Update lesson progress
  async updateLessonProgress(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { lessonId } = request.params as { lessonId: string };
      const { completed, timeSpent } = request.body as any;

      // Get lesson and verify enrollment
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
          section: {
            include: {
              course: true,
            },
          },
        },
      });

      if (!lesson) {
        return reply.status(404).send({ error: 'Lesson not found' });
      }

      const enrollment = await prisma.enrollment.findUnique({
        where: {
          courseId_studentId: {
            courseId: lesson.section.courseId,
            studentId: userId,
          },
        },
        include: {
          certificate: true,
        },
      });

      if (!enrollment) {
        return reply.status(403).send({ error: 'Not enrolled in this course' });
      }

      // Update or create lesson progress
      const progress = await prisma.lessonProgress.upsert({
        where: {
          enrollmentId_lessonId: {
            enrollmentId: enrollment.id,
            lessonId,
          },
        },
        create: {
          enrollmentId: enrollment.id,
          lessonId,
          completed: completed || false,
          completedAt: completed ? new Date() : null,
          timeSpent: timeSpent || 0,
        },
        update: {
          ...(completed !== undefined && { completed }),
          ...(completed !== undefined && { completedAt: completed ? new Date() : null }),
          ...(timeSpent !== undefined && { timeSpent: { increment: timeSpent } }),
          lastAccessedAt: new Date(),
        },
      });

      // Calculate overall course progress
      const allLessons = await prisma.lesson.findMany({
        where: {
          section: {
            courseId: lesson.section.courseId,
          },
        },
      });

      const completedLessons = await prisma.lessonProgress.count({
        where: {
          enrollmentId: enrollment.id,
          completed: true,
        },
      });

      const progressPercentage = (completedLessons / allLessons.length) * 100;

      // Auto-complete enrollment when progress reaches 100%
      const isCourseComplete = completedLessons === allLessons.length;
      const updateData: any = {
        progress: progressPercentage,
        lastAccessedAt: new Date(),
      };

      if (isCourseComplete && enrollment.status !== 'COMPLETED') {
        updateData.status = 'COMPLETED';
        updateData.completedAt = new Date();
        
        // Generate certificate automatically on course completion
        const existingCertificate = await prisma.certificate.findUnique({
          where: { enrollmentId: enrollment.id },
        });

        if (!existingCertificate) {
          const certificateId = `TN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          const verificationCode = crypto.randomBytes(16).toString('hex').toUpperCase();
          
          await prisma.certificate.create({
            data: {
              enrollmentId: enrollment.id,
              certificateId,
              verificationCode,
            },
          });
        }
      }

      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: updateData,
      });

      return reply.send({
        progress,
        courseProgress: progressPercentage,
      });
    } catch (error) {
      request.log.error(error, 'Failed to update progress');
      return reply.status(500).send({ error: 'Failed to update progress' });
    }
  },

  // Cancel enrollment
  async cancelEnrollment(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { courseId } = request.params as { courseId: string };

      const enrollment = await prisma.enrollment.findUnique({
        where: {
          courseId_studentId: {
            courseId,
            studentId: userId,
          },
        },
      });

      if (!enrollment) {
        return reply.status(404).send({ error: 'Enrollment not found' });
      }

      if (enrollment.status === 'CANCELLED') {
        return reply.status(400).send({ error: 'Enrollment already cancelled' });
      }

      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: {
          status: 'CANCELLED',
        },
      });

      return reply.status(204).send();
    } catch (error) {
      request.log.error(error, 'Failed to cancel enrollment');
      return reply.status(500).send({ error: 'Failed to cancel enrollment' });
    }
  },
};
