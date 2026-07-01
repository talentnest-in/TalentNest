import { FastifyInstance } from 'fastify';
import { reviewController } from '../controllers/review.controller';

export async function reviewRoutes(fastify: FastifyInstance) {
  // Create course review
  fastify.post('/courses/:courseId/reviews', {
    preHandler: [fastify.authenticate],
    handler: reviewController.createReview,
  });

  // Update review
  fastify.put('/reviews/:reviewId', {
    preHandler: [fastify.authenticate],
    handler: reviewController.updateReview,
  });

  // Delete review
  fastify.delete('/reviews/:reviewId', {
    preHandler: [fastify.authenticate],
    handler: reviewController.deleteReview,
  });

  // Reply to review
  fastify.post('/reviews/:reviewId/reply', {
    preHandler: [fastify.authenticate],
    handler: reviewController.replyReview,
  });

  // Get course reviews
  fastify.get('/courses/:courseId/reviews', {
    handler: reviewController.getCourseReviews,
  });

  // Add to wishlist
  fastify.post('/courses/:courseId/wishlist', {
    preHandler: [fastify.authenticate],
    handler: reviewController.addToWishlist,
  });

  // Remove from wishlist
  fastify.delete('/courses/:courseId/wishlist', {
    preHandler: [fastify.authenticate],
    handler: reviewController.removeFromWishlist,
  });

  // Get user's wishlist
  fastify.get('/wishlist', {
    preHandler: [fastify.authenticate],
    handler: reviewController.getWishlist,
  });

  // Check if course is in wishlist
  fastify.get('/courses/:courseId/wishlist/check', {
    preHandler: [fastify.authenticate],
    handler: reviewController.checkWishlist,
  });
}
