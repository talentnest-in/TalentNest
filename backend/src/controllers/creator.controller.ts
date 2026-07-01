import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';

export const creatorController = {
  // Get or create creator profile
  async getCreatorProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;

      let profile = await prisma.creatorProfile.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      });

      if (!profile) {
        profile = await prisma.creatorProfile.create({
          data: { userId },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        });
      }

      return reply.send(profile);
    } catch (error) {
      request.log.error(error, 'Failed to fetch creator profile');
      return reply.status(500).send({ error: 'Failed to fetch creator profile' });
    }
  },

  // Update creator profile
  async updateCreatorProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const body = request.body as any;

      const profile = await prisma.creatorProfile.update({
        where: { userId },
        data: {
          ...(body.bio !== undefined && { bio: body.bio }),
          ...(body.website && { website: body.website }),
          ...(body.socialLinks && { socialLinks: body.socialLinks }),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      });

      return reply.send(profile);
    } catch (error) {
      request.log.error(error, 'Failed to update creator profile');
      return reply.status(500).send({ error: 'Failed to update creator profile' });
    }
  },

  // Get creator dashboard stats
  async getCreatorStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;

      const [totalCourses, publishedCourses, draftCourses, totalEnrollments, totalRevenue, averageRating] = await Promise.all([
        prisma.course.count({ where: { creatorId: userId } }),
        prisma.course.count({ where: { creatorId: userId, status: 'PUBLISHED' } }),
        prisma.course.count({ where: { creatorId: userId, status: 'DRAFT' } }),
        prisma.enrollment.count({
          where: {
            course: { creatorId: userId },
          },
        }),
        prisma.coursePurchase.aggregate({
          _sum: { amount: true },
          where: {
            course: { creatorId: userId },
          },
        }),
        prisma.courseReview.aggregate({
          _avg: { rating: true },
          where: {
            course: { creatorId: userId },
          },
        }),
      ]);

      return reply.send({
        totalCourses,
        publishedCourses,
        draftCourses,
        totalEnrollments,
        totalRevenue: totalRevenue._sum.amount || 0,
        averageRating: averageRating._avg.rating || 0,
      });
    } catch (error) {
      request.log.error(error, 'Failed to fetch creator stats');
      return reply.status(500).send({ error: 'Failed to fetch creator stats' });
    }
  },

  // Get public creator profile
  async getPublicCreatorProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { creatorId } = request.params as { creatorId: string };

      const profile = await prisma.creatorProfile.findUnique({
        where: { userId: creatorId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      });

      if (!profile) {
        return reply.status(404).send({ error: 'Creator profile not found' });
      }

      const courses = await prisma.course.findMany({
        where: {
          creatorId,
          status: 'PUBLISHED',
        },
        include: {
          category: true,
          _count: {
            select: {
              enrollments: true,
              reviews: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 6,
      });

      // Calculate average rating for each course
      const coursesWithRating = await Promise.all(
        courses.map(async (course) => {
          const reviews = await prisma.courseReview.findMany({
            where: { courseId: course.id },
            select: { rating: true },
          });
          const avgRating = reviews.length 
            ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length 
            : 0;
          return {
            ...course,
            averageRating: Math.round(avgRating * 10) / 10,
            reviewCount: reviews.length,
          };
        })
      );

      return reply.send({
        ...profile,
        courses: coursesWithRating,
      });
    } catch (error) {
      request.log.error(error, 'Failed to fetch public creator profile');
      return reply.status(500).send({ error: 'Failed to fetch public creator profile' });
    }
  },
};
