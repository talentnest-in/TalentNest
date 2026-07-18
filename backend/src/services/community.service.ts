import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { uploadToCloudinary } from '../lib/cloudinary';
import { NotFoundError, ForbiddenError, BadRequestError, ValidationError } from '../lib/errors';
import crypto from 'crypto';
import path from 'path';

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

export async function getCommunities(query: { page?: string; limit?: string; sort?: string }) {
  const { page = '1', limit = '10', sort = 'newest' } = query;
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

  return {
    data: communities,
    meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
  };
}

export async function createCommunity(userId: string, body: unknown) {
  const data = createCommunitySchema.parse(body);
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

  return community;
}

export async function getCommunityBySlug(slug: string, userId?: string | null) {
  const community = await prisma.community.findUnique({
    where: { slug },
    include: {
      _count: { select: { members: true, posts: true } },
      creator: { select: { id: true, name: true, avatar: true } },
    },
  });

  if (!community) throw new NotFoundError('Community');

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

  return { ...community, isMember, memberRole };
}

export async function updateCommunity(id: string, userId: string, body: unknown) {
  const data = updateCommunitySchema.parse(body);

  const community = await prisma.community.findUnique({ where: { id } });
  if (!community) throw new NotFoundError('Community');

  if (community.creatorId !== userId) {
    const member = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: id, userId } },
    });
    if (!member || member.role !== 'ADMIN') {
      throw new ForbiddenError('Not authorized');
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

  return updatedCommunity;
}

export async function deleteCommunity(id: string, userId: string) {
  const community = await prisma.community.findUnique({ where: { id } });
  if (!community) throw new NotFoundError('Community');

  if (community.creatorId !== userId) {
    const member = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: id, userId } },
    });
    if (!member || member.role !== 'ADMIN') {
      throw new ForbiddenError('Not authorized');
    }
  }

  await prisma.community.delete({ where: { id } });
}

export async function joinCommunity(id: string, userId: string) {
  const community = await prisma.community.findUnique({ where: { id } });
  if (!community) throw new NotFoundError('Community');

  const existingMember = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId: id, userId } },
  });

  if (existingMember) return { message: 'Already a member' };

  await prisma.communityMember.create({
    data: { communityId: id, userId, role: 'MEMBER' },
  });

  return { message: 'Joined community successfully' };
}

export async function leaveCommunity(id: string, userId: string) {
  const community = await prisma.community.findUnique({ where: { id } });
  if (!community) throw new NotFoundError('Community');

  if (community.creatorId === userId) {
    throw new BadRequestError('Creator cannot leave the community. Delete or transfer ownership instead.');
  }

  await prisma.communityMember.delete({
    where: { communityId_userId: { communityId: id, userId } },
  });

  return { message: 'Left community successfully' };
}

export async function getCommunityMembers(id: string, query: { page?: string; limit?: string }) {
  const { page = '1', limit = '20' } = query;
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

  return {
    data: members,
    meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
  };
}

export async function uploadBanner(id: string, userId: string, fileData: { mimetype: string; filename: string; toBuffer: () => Promise<Buffer> }) {
  const community = await prisma.community.findUnique({ where: { id } });
  if (!community) throw new NotFoundError('Community');
  if (community.creatorId !== userId) {
    const member = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: id, userId } },
    });
    if (!member || member.role !== 'ADMIN') {
      throw new ForbiddenError('Not authorized');
    }
  }

  const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!ALLOWED.includes(fileData.mimetype)) {
    throw new BadRequestError('Only image files are allowed for banners');
  }

  const buffer = await fileData.toBuffer();
  if (buffer.length > 10 * 1024 * 1024) {
    throw new BadRequestError('Banner must be under 10MB');
  }

  const ext = path.extname(fileData.filename);
  const filename = `${crypto.randomBytes(12).toString('hex')}${ext}`;
  const result = await uploadToCloudinary(buffer, filename, fileData.mimetype, 'community_banner');

  const updated = await prisma.community.update({
    where: { id },
    data: { banner: result.secure_url },
  });

  return { message: 'Banner uploaded successfully', url: updated.banner };
}

export async function uploadLogo(id: string, userId: string, fileData: { mimetype: string; filename: string; toBuffer: () => Promise<Buffer> }) {
  const community = await prisma.community.findUnique({ where: { id } });
  if (!community) throw new NotFoundError('Community');
  if (community.creatorId !== userId) {
    const member = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: id, userId } },
    });
    if (!member || member.role !== 'ADMIN') {
      throw new ForbiddenError('Not authorized');
    }
  }

  const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!ALLOWED.includes(fileData.mimetype)) {
    throw new BadRequestError('Only image files are allowed for logos');
  }

  const buffer = await fileData.toBuffer();
  if (buffer.length > 5 * 1024 * 1024) {
    throw new BadRequestError('Logo must be under 5MB');
  }

  const ext = path.extname(fileData.filename);
  const filename = `${crypto.randomBytes(12).toString('hex')}${ext}`;
  const result = await uploadToCloudinary(buffer, filename, fileData.mimetype, 'community_logo');

  const updated = await prisma.community.update({
    where: { id },
    data: { logo: result.secure_url },
  });

  return { message: 'Logo uploaded successfully', url: updated.logo };
}

export async function promoteMember(id: string, requestUserId: string, targetUserId: string, role: 'ADMIN' | 'MEMBER') {
  const community = await prisma.community.findUnique({ where: { id } });
  if (!community) throw new NotFoundError('Community');

  if (community.creatorId !== requestUserId) {
    throw new ForbiddenError('Only creator can change roles');
  }

  const member = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId: id, userId: targetUserId } },
  });

  if (!member) throw new NotFoundError('Member');

  const updatedMember = await prisma.communityMember.update({
    where: { id: member.id },
    data: { role },
  });

  return { message: 'Role updated successfully', data: updatedMember };
}