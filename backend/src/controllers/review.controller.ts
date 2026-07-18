import { FastifyRequest, FastifyReply } from 'fastify';
import { createReview as svcCreateReview, updateReview as svcUpdateReview, deleteReview as svcDeleteReview, replyReview as svcReplyReview, getCourseReviews as svcGetCourseReviews, addToWishlist as svcAddToWishlist, removeFromWishlist as svcRemoveFromWishlist, getWishlist as svcGetWishlist, checkWishlist as svcCheckWishlist } from '../services/review.service';
import { AppError } from '../lib/errors';

export const reviewController = {
  async createReview(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { courseId } = request.params as { courseId: string };
      const body = request.body as any;
      const result = await svcCreateReview(userId, courseId, body);
      return reply.status(201).send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      request.log.error(error, 'Failed to create review');
      return reply.status(500).send({ error: 'Failed to create review' });
    }
  },

  async updateReview(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { reviewId } = request.params as { reviewId: string };
      const body = request.body as any;
      const result = await svcUpdateReview(userId, reviewId, body);
      return reply.send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      request.log.error(error, 'Failed to update review');
      return reply.status(500).send({ error: 'Failed to update review' });
    }
  },

  async deleteReview(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { reviewId } = request.params as { reviewId: string };
      await svcDeleteReview(userId, reviewId);
      return reply.status(204).send();
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      request.log.error(error, 'Failed to delete review');
      return reply.status(500).send({ error: 'Failed to delete review' });
    }
  },

  async replyReview(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { reviewId } = request.params as { reviewId: string };
      const { reply: replyText } = request.body as { reply: string };
      const result = await svcReplyReview(userId, reviewId, replyText);
      return reply.send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      request.log.error(error, 'Failed to reply to review');
      return reply.status(500).send({ error: 'Failed to reply to review' });
    }
  },

  async getCourseReviews(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { courseId } = request.params as { courseId: string };
      const query = request.query as any;
      const result = await svcGetCourseReviews(courseId, query);
      return reply.send(result);
    } catch (error) {
      request.log.error(error, 'Failed to fetch reviews');
      return reply.status(500).send({ error: 'Failed to fetch reviews' });
    }
  },

  async addToWishlist(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { courseId } = request.params as { courseId: string };
      const result = await svcAddToWishlist(userId, courseId);
      return reply.status(200).send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      request.log.error(error, 'Failed to add to wishlist');
      return reply.status(500).send({ error: 'Failed to add to wishlist' });
    }
  },

  async removeFromWishlist(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { courseId } = request.params as { courseId: string };
      await svcRemoveFromWishlist(userId, courseId);
      return reply.status(204).send();
    } catch (error) {
      request.log.error(error, 'Failed to remove from wishlist');
      return reply.status(500).send({ error: 'Failed to remove from wishlist' });
    }
  },

  async getWishlist(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const result = await svcGetWishlist(userId);
      return reply.send(result);
    } catch (error) {
      request.log.error(error, 'Failed to fetch wishlist');
      return reply.status(500).send({ error: 'Failed to fetch wishlist' });
    }
  },

  async checkWishlist(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { courseId } = request.params as { courseId: string };
      const result = await svcCheckWishlist(userId, courseId);
      return reply.send(result);
    } catch (error) {
      request.log.error(error, 'Failed to check wishlist');
      return reply.status(500).send({ error: 'Failed to check wishlist' });
    }
  },
};
