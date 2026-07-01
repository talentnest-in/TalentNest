import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';

export const analyticsController = {
  // Get course analytics
  async getCourseAnalytics(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { courseId } = request.params as { courseId: string };

      // Check if course exists and user is the creator
      const course = await prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        return reply.status(404).send({ error: 'Course not found' });
      }

      if (course.creatorId !== userId) {
        return reply.status(403).send({ error: 'You can only view analytics for your own courses' });
      }

      let analytics = await prisma.courseAnalytics.findUnique({
        where: { courseId },
      });

      if (!analytics) {
        analytics = await prisma.courseAnalytics.create({
          data: { courseId },
        });
      }

      // Get additional stats
      const [enrollments, reviews, revenue] = await Promise.all([
        prisma.enrollment.findMany({
          where: { courseId },
          include: {
            student: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
          orderBy: { enrolledAt: 'desc' },
          take: 10,
        }),
        prisma.courseReview.findMany({
          where: { courseId },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
        prisma.coursePurchase.aggregate({
          _sum: { amount: true },
          where: { courseId },
        }),
      ]);

      // Calculate completion rate
      const completedEnrollments = await prisma.enrollment.count({
        where: {
          courseId,
          status: 'COMPLETED',
        },
      });

      const totalEnrollments = await prisma.enrollment.count({
        where: { courseId },
      });

      const completionRate = totalEnrollments > 0 
        ? (completedEnrollments / totalEnrollments) * 100 
        : 0;

      return reply.send({
        ...analytics,
        completionRate,
        recentEnrollments: enrollments,
        recentReviews: reviews,
        totalRevenue: revenue._sum.amount || 0,
      });
    } catch (error) {
      request.log.error(error, 'Failed to fetch course analytics');
      return reply.status(500).send({ error: 'Failed to fetch course analytics' });
    }
  },

  // Get platform-wide analytics (admin only)
  async getPlatformAnalytics(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;

      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (user?.role !== 'ADMIN') {
        return reply.status(403).send({ error: 'Admin access required' });
      }

      const [totalCourses, totalEnrollments, totalRevenue, totalCreators, totalStudents] = await Promise.all([
        prisma.course.count({ where: { status: 'PUBLISHED' } }),
        prisma.enrollment.count(),
        prisma.coursePurchase.aggregate({
          _sum: { amount: true },
        }),
        prisma.creatorProfile.count(),
        prisma.enrollment.groupBy({
          by: ['studentId'],
        }),
      ]);

      const topCourses = await prisma.course.findMany({
        where: { status: 'PUBLISHED' },
        include: {
          _count: {
            select: {
              enrollments: true,
            },
          },
        },
        orderBy: {
          enrollments: {
            _count: 'desc',
          },
        },
        take: 10,
      });

      return reply.send({
        totalCourses,
        totalEnrollments,
        totalRevenue: totalRevenue._sum.amount || 0,
        totalCreators,
        totalStudents: totalStudents.length,
        topCourses,
      });
    } catch (error) {
      request.log.error(error, 'Failed to fetch platform analytics');
      return reply.status(500).send({ error: 'Failed to fetch platform analytics' });
    }
  },
};
