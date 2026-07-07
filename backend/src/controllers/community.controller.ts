import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { uploadToCloudinary } from '../lib/cloudinary';
import crypto from 'crypto';
import path from 'path';

// Validation Schemas
const createCommunitySchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().optional(),
  type: z.enum(['PUBLIC', 'PRIVATE']).default('PUBLIC'),
  rules: z.array(z.string()).optional().default([]),
});

const updateCommunitySchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().optional(),
  type: z.enum(['PUBLIC', 'PRIVATE']).optional(),
  rules: z.array(z.string()).optional(),
});

// Helper for slug generation
const generateSlug = async (name: string) => {
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    const existing = await prisma.community.findUnique({ where: { slug } });
    if (!existing) break;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
};

export const getCommunities = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { page = '1', limit = '10', sort = 'newest' } = request.query as any;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [communities, total] = await Promise.all([
      prisma.community.findMany({
        where: { type: 'PUBLIC' },
        skip,
        take: limitNum,
        orderBy: sort === 'popular' ? { members: { _count: 'desc' } } : { createdAt: 'desc' },
        include: {
          _count: { select: { members: true, posts: true } },
        },
      }),
      prisma.community.count({ where: { type: 'PUBLIC' } }),
    ]);

    return reply.send({
      statusCode: 200,
      data: communities,
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

export const createCommunity = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = request.user.id;
    const data = createCommunitySchema.parse(request.body);
    const slug = await generateSlug(data.name);

    const community = await prisma.community.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        type: data.type,
        rules: data.rules ?? [],
        slug,
        creatorId: userId,
        members: {
          create: {
            userId,
            role: 'ADMIN',
          },
        },
      },
      include: {
        _count: { select: { members: true, posts: true } },
      },
    });

    return reply.status(201).send({
      statusCode: 201,
      message: 'Community created successfully',
      data: community,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
      return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message });
    }
    request.log.error(error);
    return reply.status(500).send({ statusCode: 500, error: 'Internal Server Error' });
  }
};

export const getCommunityBySlug = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { slug } = request.params as { slug: string };

    // Optionally verify JWT — this is a public route but we want to compute isMember
    // for authenticated users too. Silently ignore if no/invalid token.
    let userId: string | null = null;
    try {
      await request.jwtVerify();
      userId = (request.user as any)?.id ?? null;
    } catch {
      // Try cookie fallback
      const token = (request as any).cookies?.token;
      if (token) {
        try {
          const decoded = (request.server as any).jwt.verify(token);
          userId = (decoded as any)?.id ?? null;
        } catch {
          // No valid auth — userId stays null (guest view)
        }
      }
    }

    const community = await prisma.community.findUnique({
      where: { slug },
      include: {
        _count: { select: { members: true, posts: true } },
        creator: { select: { id: true, name: true, avatar: true } },
      },
    });

    if (!community) {
      return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Community not found' });
    }

    // Derive membership status for the requesting user
    let isMember = false;
    let memberRole: string | null = null;
    if (userId) {
      const membership = await prisma.communityMember.findUnique({
        where: { communityId_userId: { communityId: community.id, userId } },
        select: { role: true },
      });
      isMember = !!membership;
      memberRole = membership?.role ?? null;
    }

    return reply.send({ ...community, isMember, memberRole });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ statusCode: 500, error: 'Internal Server Error' });
  }
};


export const updateCommunity = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    const userId = request.user.id;
    const data = updateCommunitySchema.parse(request.body);

    const community = await prisma.community.findUnique({ where: { id } });
    if (!community) {
      return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Community not found' });
    }

    // Check if user is creator or admin
    if (community.creatorId !== userId) {
      const member = await prisma.communityMember.findUnique({
        where: { communityId_userId: { communityId: id, userId } },
      });
      if (!member || member.role !== 'ADMIN') {
        return reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: 'Not authorized' });
      }
    }

    const updatedCommunity = await prisma.community.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description ?? null } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.rules !== undefined ? { rules: data.rules } : {}),
      },
    });

    return reply.send({
      statusCode: 200,
      message: 'Community updated successfully',
      data: updatedCommunity,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
      return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message });
    }
    request.log.error(error);
    return reply.status(500).send({ statusCode: 500, error: 'Internal Server Error' });
  }
};

export const deleteCommunity = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    const userId = request.user.id;

    const community = await prisma.community.findUnique({ where: { id } });
    if (!community) {
      return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Community not found' });
    }

    if (community.creatorId !== userId) {
      const member = await prisma.communityMember.findUnique({
        where: { communityId_userId: { communityId: id, userId } },
      });
      if (!member || member.role !== 'ADMIN') {
        return reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: 'Not authorized' });
      }
    }

    await prisma.community.delete({ where: { id } });

    return reply.send({ statusCode: 200, message: 'Community deleted successfully' });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ statusCode: 500, error: 'Internal Server Error' });
  }
};

export const joinCommunity = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    const userId = request.user.id;

    const community = await prisma.community.findUnique({ where: { id } });
    if (!community) {
      return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Community not found' });
    }

    const existingMember = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: id, userId } },
    });

    if (existingMember) {
      return reply.send({ statusCode: 200, message: 'Already a member' });
    }

    await prisma.communityMember.create({
      data: {
        communityId: id,
        userId,
        role: 'MEMBER',
      },
    });

    return reply.status(201).send({ statusCode: 201, message: 'Joined community successfully' });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ statusCode: 500, error: 'Internal Server Error' });
  }
};

export const leaveCommunity = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    const userId = request.user.id;

    const community = await prisma.community.findUnique({ where: { id } });
    if (!community) {
      return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Community not found' });
    }

    if (community.creatorId === userId) {
      return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'Creator cannot leave the community. Delete or transfer ownership instead.' });
    }

    await prisma.communityMember.delete({
      where: { communityId_userId: { communityId: id, userId } },
    });

    return reply.send({ statusCode: 200, message: 'Left community successfully' });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ statusCode: 500, error: 'Internal Server Error' });
  }
};

export const getCommunityMembers = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    const { page = '1', limit = '20' } = request.query as any;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [members, total] = await Promise.all([
      prisma.communityMember.findMany({
        where: { communityId: id },
        skip,
        take: limitNum,
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { joinedAt: 'asc' },
      }),
      prisma.communityMember.count({ where: { communityId: id } }),
    ]);

    return reply.send({
      statusCode: 200,
      data: members,
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

export const uploadBanner = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    const userId = request.user.id;

    const community = await prisma.community.findUnique({ where: { id } });
    if (!community) {
      return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Community not found' });
    }
    if (community.creatorId !== userId) {
      const member = await prisma.communityMember.findUnique({
        where: { communityId_userId: { communityId: id, userId } },
      });
      if (!member || (member.role !== 'ADMIN')) {
        return reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: 'Not authorized' });
      }
    }

    const data = await request.file();
    if (!data) return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'No file uploaded' });

    const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!ALLOWED.includes(data.mimetype)) {
      return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'Only image files are allowed for banners' });
    }

    const buffer = await data.toBuffer();
    if (buffer.length > 10 * 1024 * 1024) {
      return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'Banner must be under 10MB' });
    }

    const ext = path.extname(data.filename);
    const filename = `${crypto.randomBytes(12).toString('hex')}${ext}`;
    const result = await uploadToCloudinary(buffer, filename, data.mimetype, 'talentnest/community-banners');

    const updated = await prisma.community.update({
      where: { id },
      data: { banner: result.secure_url },
    });

    return reply.send({ statusCode: 200, message: 'Banner uploaded successfully', url: updated.banner });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ statusCode: 500, error: 'Internal Server Error' });
  }
};

export const uploadLogo = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    const userId = request.user.id;

    const community = await prisma.community.findUnique({ where: { id } });
    if (!community) {
      return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Community not found' });
    }
    if (community.creatorId !== userId) {
      const member = await prisma.communityMember.findUnique({
        where: { communityId_userId: { communityId: id, userId } },
      });
      if (!member || (member.role !== 'ADMIN')) {
        return reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: 'Not authorized' });
      }
    }

    const data = await request.file();
    if (!data) return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'No file uploaded' });

    const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!ALLOWED.includes(data.mimetype)) {
      return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'Only image files are allowed for logos' });
    }

    const buffer = await data.toBuffer();
    if (buffer.length > 5 * 1024 * 1024) {
      return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'Logo must be under 5MB' });
    }

    const ext = path.extname(data.filename);
    const filename = `${crypto.randomBytes(12).toString('hex')}${ext}`;
    const result = await uploadToCloudinary(buffer, filename, data.mimetype, 'talentnest/community-logos');

    const updated = await prisma.community.update({
      where: { id },
      data: { logo: result.secure_url },
    });

    return reply.send({ statusCode: 200, message: 'Logo uploaded successfully', url: updated.logo });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ statusCode: 500, error: 'Internal Server Error' });
  }
};

export const promoteMember = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id, userId } = request.params as { id: string; userId: string };
    const requestUserId = request.user.id;
    const { role } = request.body as { role: 'ADMIN' | 'MEMBER' };

    const community = await prisma.community.findUnique({ where: { id } });
    if (!community) {
      return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Community not found' });
    }

    if (community.creatorId !== requestUserId) {
      return reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: 'Only creator can change roles' });
    }

    const member = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: id, userId } },
    });

    if (!member) {
      return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'User is not a member' });
    }

    const updatedMember = await prisma.communityMember.update({
      where: { id: member.id },
      data: { role },
    });

    return reply.send({ statusCode: 200, message: 'Role updated successfully', data: updatedMember });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ statusCode: 500, error: 'Internal Server Error' });
  }
};
