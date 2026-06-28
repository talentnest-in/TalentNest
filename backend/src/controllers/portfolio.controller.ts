import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';
import { uploadFile } from '../lib/upload';
import { z } from 'zod';

const projectSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  projectUrl: z.string().nullable().catch(null),
  imageUrl: z.string().nullable().catch(null),
});

export const getProjects = async (
  request: FastifyRequest<{ Querystring: { page?: string; limit?: string } }>,
  reply: FastifyReply
) => {
  const { page = '1', limit = '10' } = request.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const profile = await prisma.freelancerProfile.findUnique({
    where: { userId: request.user.id },
  });
  if (!profile) return reply.send({ projects: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } });

  const [projects, total] = await Promise.all([
    prisma.portfolioProject.findMany({
      where: { freelancerProfileId: profile.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.portfolioProject.count({
      where: { freelancerProfileId: profile.id },
    }),
  ]);
  
  return reply.send({
    projects,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
};

export const addProject = async (request: FastifyRequest, reply: FastifyReply) => {
  const data = projectSchema.parse(request.body);
  const profile = await prisma.freelancerProfile.upsert({
    where: { userId: request.user.id },
    create: { userId: request.user.id },
    update: {},
  });

  const project = await prisma.portfolioProject.create({
    data: { ...data, freelancerProfileId: profile.id },
  });
  return reply.send({ project });
};

export const updateProject = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  const { id } = request.params;
  const data = projectSchema.parse(request.body);
  const project = await prisma.portfolioProject.update({ where: { id }, data });
  return reply.send({ project });
};

export const deleteProject = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  const { id } = request.params;
  await prisma.portfolioProject.delete({ where: { id } });
  return reply.send({ success: true });
};

export const uploadProjectImage = async (request: FastifyRequest, reply: FastifyReply) => {
  const file = await request.file();
  if (!file) return reply.status(400).send({ message: 'No file uploaded' });

  const imageUrl = await uploadFile(file, 'portfolio');
  return reply.send({ imageUrl });
};
