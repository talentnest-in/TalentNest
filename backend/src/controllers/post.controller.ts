import { FastifyRequest, FastifyReply } from 'fastify';
import { getPosts as svcGetPosts, getCommunityPosts as svcGetCommunityPosts, createPost as svcCreatePost, getPostById as svcGetPostById, updatePost as svcUpdatePost, deletePost as svcDeletePost, toggleLike as svcToggleLike, addComment as svcAddComment, deleteComment as svcDeleteComment, reportPost as svcReportPost, pinPost as svcPinPost, hidePost as svcHidePost } from '../services/post.service';
import { AppError } from '../lib/errors';

const postController = {
  async getPosts(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await svcGetPosts(request.query as any);
      return reply.send(result);
    } catch (error) {
      request.log.error(error, 'getPosts failed');
      return reply.status(500).send({ error: 'Failed to fetch posts' });
    }
  },

  async getCommunityPosts(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user?.id;
      const { id } = request.params as { id: string };
      const result = await svcGetCommunityPosts(id, userId, request.query as any);
      return reply.send(result);
    } catch (error) {
      request.log.error(error, 'getCommunityPosts failed');
      return reply.status(500).send({ error: 'Failed to fetch posts' });
    }
  },

  async createPost(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const result = await svcCreatePost(userId, request.body);
      return reply.status(201).send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      request.log.error(error, 'createPost failed');
      return reply.status(500).send({ error: 'Failed to create post' });
    }
  },

  async getPostById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { postId } = request.params as { postId: string };
      const userId = (request as any).user?.id;
      const result = await svcGetPostById(postId, userId);
      return reply.send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      request.log.error(error, 'getPostById failed');
      return reply.status(500).send({ error: 'Failed to fetch post' });
    }
  },

  async updatePost(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { postId } = request.params as { postId: string };
      const result = await svcUpdatePost(userId, postId, request.body);
      return reply.send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      request.log.error(error, 'updatePost failed');
      return reply.status(500).send({ error: 'Failed to update post' });
    }
  },

  async deletePost(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { postId } = request.params as { postId: string };
      await svcDeletePost(userId, postId);
      return reply.send({ success: true });
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      request.log.error(error, 'deletePost failed');
      return reply.status(500).send({ error: 'Failed to delete post' });
    }
  },

  async toggleLike(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { postId } = request.params as { postId: string };
      const result = await svcToggleLike(userId, postId);
      return reply.send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      request.log.error(error, 'toggleLike failed');
      return reply.status(500).send({ error: 'Failed to toggle like' });
    }
  },

  async addComment(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { postId } = request.params as { postId: string };
      const result = await svcAddComment(userId, postId, request.body);
      return reply.status(201).send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      request.log.error(error, 'addComment failed');
      return reply.status(500).send({ error: 'Failed to add comment' });
    }
  },

  async deleteComment(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id, cId } = request.params as { id: string; cId: string };
      await svcDeleteComment(id, cId, userId);
      return reply.send({ success: true });
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      request.log.error(error, 'deleteComment failed');
      return reply.status(500).send({ error: 'Failed to delete comment' });
    }
  },

  async reportPost(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { postId } = request.params as { postId: string };
      const result = await svcReportPost(userId, postId, request.body);
      return reply.send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      request.log.error(error, 'reportPost failed');
      return reply.status(500).send({ error: 'Failed to report post' });
    }
  },

  async pinPost(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { postId } = request.params as { postId: string };
      const result = await svcPinPost(userId, postId);
      return reply.send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      request.log.error(error, 'pinPost failed');
      return reply.status(500).send({ error: 'Failed to pin post' });
    }
  },

  async hidePost(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { postId } = request.params as { postId: string };
      const result = await svcHidePost(userId, postId);
      return reply.send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      request.log.error(error, 'hidePost failed');
      return reply.status(500).send({ error: 'Failed to hide post' });
    }
  },
};

export const {
  getPosts, getCommunityPosts, createPost, getPostById, updatePost, deletePost,
  toggleLike, addComment, deleteComment, reportPost, pinPost, hidePost,
} = postController;
