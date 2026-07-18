import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { getIO } from '../plugins/socket';
import DOMPurify from 'isomorphic-dompurify';
import { awardExp } from './gamification.service';
import { NotFoundError, ForbiddenError, BadRequestError, ValidationError } from '../lib/errors';

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

const createCommentSchema = z.object({
  content: z.string().min(1),
  parentId: z.string().optional(),
});

const reportPostSchema = z.object({
  reason: z.string().min(1),
});

export async function getPosts(query: { page?: string; limit?: string; filter?: string }) {
  const { page = '1', limit = '10', filter = 'newest' } = query;
  const pageStr = Array.isArray(page) ? page[0] : page;
  const limitStr = Array.isArray(limit) ? limit[0] : limit;
  const filterStr = Array.isArray(filter) ? filter[0] : filter;

  const pageNum = parseInt(pageStr) || 1;
  const limitNum = parseInt(limitStr) || 10;
  const skip = Math.max(0, (pageNum - 1) * limitNum);

  let orderBy: any = { createdAt: 'desc' };
  if (filter === 'popular') {
    orderBy = { likes: { _count: 'desc' } };
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { isHidden: false, communityId: null },
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

  return {
    data: posts,
    meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
  };
}

export async function getCommunityPosts(communityId: string, userId: string | undefined, query: { page?: string; limit?: string; filter?: string }) {
  const { page = '1', limit = '10', filter = 'newest' } = query;
  const pageStr = Array.isArray(page) ? page[0] : page;
  const limitStr = Array.isArray(limit) ? limit[0] : limit;
  const filterStr = Array.isArray(filter) ? filter[0] : filter;

  const pageNum = parseInt(pageStr) || 1;
  const limitNum = parseInt(limitStr) || 10;
  const skip = Math.max(0, (pageNum - 1) * limitNum);

  let orderBy: any = { createdAt: 'desc' };
  if (filter === 'popular') {
    orderBy = { likes: { _count: 'desc' } };
  }

  const community = await prisma.community.findUnique({ where: { id: communityId } });
  if (!community) throw new NotFoundError('Community');

  if (community.type === 'PRIVATE') {
    if (!userId) throw new ForbiddenError('Must be logged in to view private community posts');
    const member = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId } },
    });
    if (!member) throw new ForbiddenError('Must be a member to view private community posts');
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

  return {
    data: posts,
    meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
  };
}

export async function createPost(userId: string, body: unknown) {
  const data = createPostSchema.parse(body);

  if (data.communityId) {
    const member = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: data.communityId, userId } },
    });
    if (!member) {
      throw new ForbiddenError('Must be a member to post in a community');
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
    },
  });

  await awardExp(userId, 'FIRST_POST', 'Created a community post');

  return post;
}

export async function getPostById(id: string, userId?: string) {
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, avatar: true } },
      community: { select: { id: true, name: true, slug: true, type: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });

  if (!post) throw new NotFoundError('Post');

  if (post.community?.type === 'PRIVATE') {
    if (!userId) throw new ForbiddenError('Must be logged in to view private community posts');
    const member = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: post.community.id, userId } },
    });
    if (!member) throw new ForbiddenError('Must be a member to view private community posts');
  }

  return post;
}

export async function updatePost(id: string, userId: string, body: unknown) {
  const data = updatePostSchema.parse(body);

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) throw new NotFoundError('Post');
  if (post.authorId !== userId) throw new ForbiddenError('Not authorized');

  const updatedPost = await prisma.post.update({
    where: { id },
    data: {
      ...(data.content !== undefined ? { content: DOMPurify.sanitize(data.content) } : {}),
      ...(data.mediaUrls !== undefined ? { mediaUrls: data.mediaUrls } : {}),
      ...(data.linkUrl !== undefined ? { linkUrl: data.linkUrl ?? null } : {}),
    },
  });

  return updatedPost;
}

export async function deletePost(id: string, userId: string) {
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) throw new NotFoundError('Post');
  if (post.authorId !== userId) throw new ForbiddenError('Not authorized');

  await prisma.post.delete({ where: { id } });
}

export async function toggleLike(id: string, userId: string) {
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) throw new NotFoundError('Post');

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
      await awardExp(post.authorId, 'POST_LIKE_RECEIVED', 'Received a like on post');

      await prisma.notification.create({
        data: {
          userId: post.authorId,
          type: 'SYSTEM',
          title: 'New Like',
          message: 'Someone liked your post',
          link: `/community/post/${id}`,
        },
      });
      const io = getIO();
      io.to(`user_${post.authorId}`).emit('notification:new', { message: 'New Like' });
    }
  }

  const likeCount = await prisma.postLike.count({ where: { postId: id } });

  const io = getIO();
  io.emit('post:liked', { postId: id, likeCount });

  return { liked, likeCount };
}

export async function addComment(id: string, userId: string, body: unknown) {
  const { content, parentId } = createCommentSchema.parse(body);

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) throw new NotFoundError('Post');

  const comment = await prisma.postComment.create({
    data: {
      content,
      postId: id,
      authorId: userId,
      parentId: parentId ?? null,
    },
    include: {
      author: { select: { id: true, name: true, avatar: true } },
    },
  });

  await awardExp(userId, 'COMMUNITY_COMMENT', 'Commented on a post');

  const targetUserId = parentId
    ? (await prisma.postComment.findUnique({ where: { id: parentId } }))?.authorId
    : post.authorId;

  if (targetUserId && targetUserId !== userId) {
    await prisma.notification.create({
      data: {
        userId: targetUserId,
        type: 'SYSTEM',
        title: parentId ? 'New Reply' : 'New Comment',
        message: parentId ? 'Someone replied to your comment' : 'Someone commented on your post',
        link: `/community/post/${id}`,
      },
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

  return comment;
}

export async function deleteComment(id: string, cId: string, userId: string) {
  const comment = await prisma.postComment.findUnique({ where: { id: cId } });
  if (!comment || comment.postId !== id) throw new NotFoundError('Comment');
  if (comment.authorId !== userId) throw new ForbiddenError('Not authorized');

  await prisma.postComment.delete({ where: { id: cId } });
}

export async function reportPost(id: string, userId: string, body: unknown) {
  const { reason } = reportPostSchema.parse(body);

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) throw new NotFoundError('Post');

  await prisma.postReport.create({
    data: { postId: id, reporterId: userId, reason },
  });

  return { message: 'Post reported successfully' };
}

export async function pinPost(id: string, userId: string) {
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post || !post.communityId) throw new NotFoundError('Community post');

  const member = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId: post.communityId, userId } },
  });

  if (!member || member.role !== 'ADMIN') {
    const community = await prisma.community.findUnique({ where: { id: post.communityId } });
    if (community?.creatorId !== userId) {
      throw new ForbiddenError('Only admins can pin posts');
    }
  }

  const updatedPost = await prisma.post.update({
    where: { id },
    data: { isPinned: !post.isPinned },
  });

  return updatedPost;
}

export async function hidePost(id: string, userId: string) {
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post || !post.communityId) throw new NotFoundError('Community post');

  const member = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId: post.communityId, userId } },
  });

  if (!member || member.role !== 'ADMIN') {
    const community = await prisma.community.findUnique({ where: { id: post.communityId } });
    if (community?.creatorId !== userId) {
      throw new ForbiddenError('Only admins can hide posts');
    }
  }

  const updatedPost = await prisma.post.update({
    where: { id },
    data: { isHidden: !post.isHidden },
  });

  return updatedPost;
}
