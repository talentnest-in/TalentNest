import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';

export const reviewController = {
  // Create course review
  async createReview(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { courseId } = request.params as { courseId: string };
      const body = request.body as any;

      // Check if course exists
      const course = await prisma.course.findUnique({
        where: { id: courseId },
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
      });

      if (!enrollment) {
        return reply.status(403).send({ error: 'You must be enrolled to review this course' });
      }

      // Check if review already exists
      const existingReview = await prisma.courseReview.findUnique({
        where: {
          courseId_studentId: {
            courseId,
            studentId: userId,
          },
        },
      });

      if (existingReview) {
        return reply.status(400).send({ error: 'You have already reviewed this course' });
      }

      const review = await prisma.courseReview.create({
        data: {
          courseId,
          studentId: userId,
          rating: body.rating,
          review: body.review,
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      });

      return reply.status(201).send(review);
    } catch (error) {
      request.log.error(error, 'Failed to create review');
      return reply.status(500).send({ error: 'Failed to create review' });
    }
  },

  // Update review
  async updateReview(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { reviewId } = request.params as { reviewId: string };
      const body = request.body as any;

      const review = await prisma.courseReview.findUnique({
        where: { id: reviewId },
      });

      if (!review) {
        return reply.status(404).send({ error: 'Review not found' });
      }

      if (review.studentId !== userId) {
        return reply.status(403).send({ error: 'You can only edit your own reviews' });
      }

      const updatedReview = await prisma.courseReview.update({
        where: { id: reviewId },
        data: {
          ...(body.rating && { rating: body.rating }),
          ...(body.review && { review: body.review }),
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      });

      return reply.send(updatedReview);
    } catch (error) {
      request.log.error(error, 'Failed to update review');
      return reply.status(500).send({ error: 'Failed to update review' });
    }
  },

  // Delete review
  async deleteReview(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { reviewId } = request.params as { reviewId: string };

      const review = await prisma.courseReview.findUnique({
        where: { id: reviewId },
      });

      if (!review) {
        return reply.status(404).send({ error: 'Review not found' });
      }

      if (review.studentId !== userId) {
        return reply.status(403).send({ error: 'You can only delete your own reviews' });
      }

      await prisma.courseReview.delete({
        where: { id: reviewId },
      });

      return reply.status(204).send();
    } catch (error) {
      request.log.error(error, 'Failed to delete review');
      return reply.status(500).send({ error: 'Failed to delete review' });
    }
  },

  // Reply to review (creator only)
  async replyReview(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { reviewId } = request.params as { reviewId: string };
      const { reply: replyText } = request.body as { reply: string };

      const review = await prisma.courseReview.findUnique({
        where: { id: reviewId },
        include: {
          course: true,
        },
      });

      if (!review) {
        return reply.status(404).send({ error: 'Review not found' });
      }

      if (review.course.creatorId !== userId) {
        return reply.status(403).send({ error: 'Only the course creator can reply to reviews' });
      }

      const updatedReview = await prisma.courseReview.update({
        where: { id: reviewId },
        data: {
          reply: replyText,
          repliedAt: new Date(),
        },
      });

      return reply.send(updatedReview);
    } catch (error) {
      request.log.error(error, 'Failed to reply to review');
      return reply.status(500).send({ error: 'Failed to reply to review' });
    }
  },

  // Get course reviews
  async getCourseReviews(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { courseId } = request.params as { courseId: string };

      const reviews = await prisma.courseReview.findMany({
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
        orderBy: { createdAt: 'desc' },
      });

      // Calculate average rating
      const averageRating = reviews.length
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

      return reply.send({
        reviews,
        averageRating: Math.round(averageRating * 10) / 10,
        reviewCount: reviews.length,
      });
    } catch (error) {
      request.log.error(error, 'Failed to fetch reviews');
      return reply.status(500).send({ error: 'Failed to fetch reviews' });
    }
  },

  // Add to wishlist
  async addToWishlist(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { courseId } = request.params as { courseId: string };

      // Check if course exists
      const course = await prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        return reply.status(404).send({ error: 'Course not found' });
      }

      // Check if already in wishlist - return success if already exists (idempotent)
      let wishlist = await prisma.courseWishlist.findUnique({
        where: {
          courseId_userId: {
            courseId,
            userId,
          },
        },
      });

      if (!wishlist) {
        wishlist = await prisma.courseWishlist.create({
          data: {
            courseId,
            userId,
          },
        });
      }

      return reply.status(200).send(wishlist);
    } catch (error) {
      request.log.error(error, 'Failed to add to wishlist');
      return reply.status(500).send({ error: 'Failed to add to wishlist' });
    }
  },

  // Remove from wishlist
  async removeFromWishlist(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { courseId } = request.params as { courseId: string };

      await prisma.courseWishlist.delete({
        where: {
          courseId_userId: {
            courseId,
            userId,
          },
        },
      });

      return reply.status(204).send();
    } catch (error) {
      request.log.error(error, 'Failed to remove from wishlist');
      return reply.status(500).send({ error: 'Failed to remove from wishlist' });
    }
  },

  // Get user's wishlist
  async getWishlist(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;

      const wishlist = await prisma.courseWishlist.findMany({
        where: { userId },
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
              _count: {
                select: {
                  enrollments: true,
                  reviews: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Calculate average rating for each course
      const wishlistWithRating = await Promise.all(
        wishlist.map(async (item) => {
          const reviews = await prisma.courseReview.findMany({
            where: { courseId: item.course.id },
            select: { rating: true },
          });
          const avgRating = reviews.length 
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
            : 0;
          return {
            ...item,
            course: {
              ...item.course,
              averageRating: Math.round(avgRating * 10) / 10,
              reviewCount: reviews.length,
            },
          };
        })
      );

      return reply.send(wishlistWithRating);
    } catch (error) {
      request.log.error(error, 'Failed to fetch wishlist');
      return reply.status(500).send({ error: 'Failed to fetch wishlist' });
    }
  },

  // Check if course is in wishlist
  async checkWishlist(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { courseId } = request.params as { courseId: string };

      const wishlist = await prisma.courseWishlist.findUnique({
        where: {
          courseId_userId: {
            courseId,
            userId,
          },
        },
      });

      return reply.send({ inWishlist: !!wishlist });
    } catch (error) {
      request.log.error(error, 'Failed to check wishlist');
      return reply.status(500).send({ error: 'Failed to check wishlist' });
    }
  },
};
