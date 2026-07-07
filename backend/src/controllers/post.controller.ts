import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { getIO } from '../plugins/socket';
import { prisma } from '../lib/prisma';
import DOMPurify from 'isomorphic-dompurify';

const createPostSchema = z.object({
  content: z.string().min(1, "Content is required"),
  type: z.enum(['TEXT', 'IMAGE', 'PDF', 'LINK']).default('TEXT'),
  mediaUrls: z.array(z.string()).optional().default([]),
  linkUrl: z.string().url("Invalid link URL").optional().or(z.literal('').transform(() => undefined)),
  communityId: z.string().uuid("Invalid community ID").optional().or(z.literal('').transform(() => undefined)),
});

const updatePostSchema = z.object({
  content: z.string().min(1, "Content is required").optional(),
  mediaUrls: z.array(z.string()).optional(),
  linkUrl: z.string().url("Invalid link URL").optional().or(z.literal('').transform(() => undefined)),
});

export const getPosts = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { page = '1', limit = '10', filter = 'newest' } = request.query as any;
    const pageStr = Array.isArray(page) ? page[0] : page;
    const limitStr = Array.isArray(limit) ? limit[0] : limit;
    const filterStr = Array.isArray(filter) ? filter[0] : filter;

    const pageNum = parseInt(pageStr) || 1;
    const limitNum = parseInt(limitStr) || 10;
    const skip = Math.max(0, (pageNum - 1) * limitNum);

    // Filter can be 'newest' or 'popular'
    let orderBy: any = { createdAt: 'desc' };
    if (filter === 'popular') {
      orderBy = { likes: { _count: 'desc' } };
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: {
          isHidden: false,
          communityId: null, // Global feed
        },
        skip,
        take: limitNum,
        orderBy,
        include: {
          author: { select: { id: true, name: true, avatar: true } },
          _count: { select: { likes: true, comments: true } },
        },
      }),
      prisma.post.count({ where: { isHidden: false, communityId: null } }),
    ]);

    return reply.send({
      statusCode: 200,
      data: posts,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ statusCode: 500, error: 'Internal Server Error' });
  }
};

export const getCommunityPosts = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id: communityId } = request.params as { id: string };
    const { page = '1', limit = '10', filter = 'newest' } = request.query as any;
    const pageStr = Array.isArray(page) ? page[0] : page;
    const limitStr = Array.isArray(limit) ? limit[0] : limit;
    const filterStr = Array.isArray(filter) ? filter[0] : filter;

    const pageNum = parseInt(pageStr) || 1;
    const limitNum = parseInt(limitStr) || 10;
    const skip = Math.max(0, (pageNum - 1) * limitNum);

    // Filter can be 'newest' or 'popular'
    let orderBy: any = { createdAt: 'desc' };
    if (filter === 'popular') {
      orderBy = { likes: { _count: 'desc' } };
    }

    // Check if community is private
    const community = await prisma.community.findUnique({ where: { id: communityId } });
    if (!community) {
      return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Community not found' });
    }

    if (community.type === 'PRIVATE') {
      const userId = request.user?.id;
      if (!userId) {
        return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Must be logged in to view private community posts' });
      }
      const member = await prisma.communityMember.findUnique({
        where: { communityId_userId: { communityId, userId } },
      });
      if (!member) {
        return reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: 'Must be a member to view private community posts' });
      }
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: { communityId, isHidden: false },
        skip,
        take: limitNum,
        orderBy,
        include: {
          author: { select: { id: true, name: true, avatar: true } },
          _count: { select: { likes: true, comments: true } },
        },
      }),
      prisma.post.count({ where: { communityId, isHidden: false } }),
    ]);

    return reply.send({
      statusCode: 200,
      data: posts,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ statusCode: 500, error: 'Internal Server Error' });
  }
};


export const createPost = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = request.user.id;
    const data = createPostSchema.parse(request.body);

    // If communityId is provided, verify membership
    if (data.communityId) {
      const member = await prisma.communityMember.findUnique({
        where: { communityId_userId: { communityId: data.communityId, userId } },
      });
      if (!member) {
        return reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: 'Must be a member to post in a community' });
      }
    }

    const post = await prisma.post.create({
      data: {
        content: DOMPurify.sanitize(data.content),
        type: data.type,
        mediaUrls: data.mediaUrls ?? [],
        linkUrl: data.linkUrl ?? null,
        communityId: data.communityId ?? null,
        authorId: userId,
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        _count: { select: { likes: true, comments: true } },
      }
    });

    return reply.status(201).send({ statusCode: 201, message: 'Post created successfully', data: post });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
      return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message });
    }
    request.log.error(error);
    return reply.status(500).send({ statusCode: 500, error: 'Internal Server Error' });
  }
};

export const getPostById = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        community: { select: { id: true, name: true, slug: true, type: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });

    if (!post) {
      return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Post not found' });
    }

    if (post.community?.type === 'PRIVATE') {
      const userId = request.user?.id;
      if (!userId) {
        return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Must be logged in to view private community posts' });
      }
      const member = await prisma.communityMember.findUnique({
        where: { communityId_userId: { communityId: post.community.id, userId } },
      });
      if (!member) {
        return reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: 'Must be a member to view private community posts' });
      }
    }

    return reply.send({ statusCode: 200, data: post });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ statusCode: 500, error: 'Internal Server Error' });
  }
};

export const updatePost = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    const userId = request.user.id;
    const data = updatePostSchema.parse(request.body);

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Post not found' });
    }

    if (post.authorId !== userId) {
      return reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: 'Not authorized' });
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        ...(data.content !== undefined ? { content: DOMPurify.sanitize(data.content) } : {}),
        ...(data.mediaUrls !== undefined ? { mediaUrls: data.mediaUrls } : {}),
        ...(data.linkUrl !== undefined ? { linkUrl: data.linkUrl ?? null } : {}),
      },
    });

    return reply.send({ statusCode: 200, message: 'Post updated successfully', data: updatedPost });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
      return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message });
    }
    request.log.error(error);
    return reply.status(500).send({ statusCode: 500, error: 'Internal Server Error' });
  }
};

export const deletePost = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    const userId = request.user.id;

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Post not found' });
    }

    if (post.authorId !== userId) {
      return reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: 'Not authorized' });
    }

    await prisma.post.delete({ where: { id } });

    return reply.send({ statusCode: 200, message: 'Post deleted successfully' });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ statusCode: 500, error: 'Internal Server Error' });
  }
};

export const toggleLike = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    const userId = request.user.id;

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Post not found' });
    }

    const existingLike = await prisma.postLike.findUnique({
      where: { postId_userId: { postId: id, userId } },
    });

    let liked = false;
    if (existingLike) {
      await prisma.postLike.delete({ where: { id: existingLike.id } });
    } else {
      await prisma.postLike.create({ data: { postId: id, userId } });
      liked = true;

      if (post.authorId !== userId) {
        // Notification
        await prisma.notification.create({
          data: {
            userId: post.authorId,
            type: 'SYSTEM',
            title: 'New Like',
            message: 'Someone liked your post',
            link: `/community/post/${id}`,
          }
        });
        const io = getIO();
        io.to(`user_${post.authorId}`).emit('notification:new', { message: 'New Like' });
      }
    }

    const likeCount = await prisma.postLike.count({ where: { postId: id } });
    
    // Emit globally for real-time feed updates
    const io = getIO();
    io.emit('post:liked', { postId: id, likeCount });

    return reply.send({ statusCode: 200, message: liked ? 'Post liked' : 'Post unliked', data: { liked, likeCount } });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ statusCode: 500, error: 'Internal Server Error' });
  }
};

const createCommentSchema = z.object({
  content: z.string().min(1),
  parentId: z.string().optional(),
});

export const addComment = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    const userId = request.user.id;
    const { content, parentId } = createCommentSchema.parse(request.body);

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Post not found' });
    }

    const comment = await prisma.postComment.create({
      data: {
        content,
        postId: id,
        authorId: userId,
        parentId: parentId ?? null,
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      }
    });

    // Notify author of post or parent comment
    const targetUserId = parentId ? 
      (await prisma.postComment.findUnique({ where: { id: parentId } }))?.authorId :
      post.authorId;

    if (targetUserId && targetUserId !== userId) {
      await prisma.notification.create({
        data: {
          userId: targetUserId,
          type: 'SYSTEM',
          title: parentId ? 'New Reply' : 'New Comment',
          message: parentId ? 'Someone replied to your comment' : 'Someone commented on your post',
          link: `/community/post/${id}`,
        }
      });
      const io = getIO();
      io.to(`user_${targetUserId}`).emit('notification:new', { message: parentId ? 'New Reply' : 'New Comment' });
    }

    const io = getIO();
    if (parentId) {
      io.emit('post:reply', { commentId: parentId, reply: comment });
    } else {
      io.emit('post:commented', { postId: id, comment });
    }

    return reply.status(201).send({ statusCode: 201, message: 'Comment added', data: comment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
      return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message });
    }
    request.log.error(error);
    return reply.status(500).send({ statusCode: 500, error: 'Internal Server Error' });
  }
};

export const deleteComment = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id, cId } = request.params as { id: string; cId: string };
    const userId = request.user.id;

    const comment = await prisma.postComment.findUnique({ where: { id: cId } });
    if (!comment || comment.postId !== id) {
      return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Comment not found' });
    }

    if (comment.authorId !== userId) {
      return reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: 'Not authorized' });
    }

    await prisma.postComment.delete({ where: { id: cId } });

    return reply.send({ statusCode: 200, message: 'Comment deleted successfully' });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ statusCode: 500, error: 'Internal Server Error' });
  }
};

const reportPostSchema = z.object({
  reason: z.string().min(1),
});

export const reportPost = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    const userId = request.user.id;
    const { reason } = reportPostSchema.parse(request.body);

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Post not found' });
    }

    await prisma.postReport.create({
      data: {
        postId: id,
        reporterId: userId,
        reason,
      },
    });

    return reply.status(201).send({ statusCode: 201, message: 'Post reported successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
      return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message });
    }
    request.log.error(error);
    return reply.status(500).send({ statusCode: 500, error: 'Internal Server Error' });
  }
};

export const pinPost = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    const userId = request.user.id;

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post || !post.communityId) {
      return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Community post not found' });
    }

    const member = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: post.communityId, userId } },
    });

    if (!member || member.role !== 'ADMIN') {
      const community = await prisma.community.findUnique({ where: { id: post.communityId } });
      if (community?.creatorId !== userId) {
        return reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: 'Only admins can pin posts' });
      }
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: { isPinned: !post.isPinned },
    });

    return reply.send({ statusCode: 200, message: updatedPost.isPinned ? 'Post pinned' : 'Post unpinned', data: updatedPost });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ statusCode: 500, error: 'Internal Server Error' });
  }
};

export const hidePost = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    const userId = request.user.id;

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post || !post.communityId) {
      return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Community post not found' });
    }

    const member = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: post.communityId, userId } },
    });

    if (!member || member.role !== 'ADMIN') {
      const community = await prisma.community.findUnique({ where: { id: post.communityId } });
      if (community?.creatorId !== userId) {
        return reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: 'Only admins can hide posts' });
      }
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: { isHidden: !post.isHidden },
    });

    return reply.send({ statusCode: 200, message: updatedPost.isHidden ? 'Post hidden' : 'Post unhidden', data: updatedPost });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ statusCode: 500, error: 'Internal Server Error' });
  }
};
