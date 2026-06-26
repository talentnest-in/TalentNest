import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';
import { uploadFile } from '../lib/upload';
import { z } from 'zod';

const profileSchema = z.object({
  bio: z.string().nullable().catch(null),
  website: z.string().nullable().catch(null),
  location: z.string().nullable().catch(null),
});

// ── Helpers ────────────────────────────────────────────────────────────────────
async function getOrCreateClientProfile(userId: string) {
  return prisma.clientProfile.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

// ── Get Client Profile ─────────────────────────────────────────────────────────
export const getClientProfile = async (request: FastifyRequest, reply: FastifyReply) => {
  const profile = await prisma.clientProfile.findUnique({
    where: { userId: request.user.id },
    include: { company: true },
  });
  return reply.send({ profile });
};

// ── Update Client Profile ──────────────────────────────────────────────────────
export const updateClientProfile = async (request: FastifyRequest, reply: FastifyReply) => {
  const data = profileSchema.parse(request.body);
  const profile = await prisma.clientProfile.upsert({
    where: { userId: request.user.id },
    create: { userId: request.user.id, ...data },
    update: data,
    include: { company: true },
  });
  return reply.send({ profile });
};

// ── Upload Logo ────────────────────────────────────────────────────────────────
export const uploadClientLogo = async (request: FastifyRequest, reply: FastifyReply) => {
  const file = await request.file();
  if (!file) return reply.status(400).send({ message: 'No file uploaded' });
  const logoUrl = await uploadFile(file);
  await prisma.clientProfile.upsert({
    where: { userId: request.user.id },
    create: { userId: request.user.id, logoUrl },
    update: { logoUrl },
  });
  return reply.send({ logoUrl });
};

// ── Client Dashboard ───────────────────────────────────────────────────────────
export const getClientDashboard = async (request: FastifyRequest, reply: FastifyReply) => {
  const profile = await prisma.clientProfile.findUnique({
    where: { userId: request.user.id },
    include: {
      company: true,
      jobs: {
        orderBy: { createdAt: 'desc' },
        include: { skills: true },
      },
    },
  });

  if (!profile) {
    return reply.send({
      activeJobs: 0,
      draftJobs: 0,
      totalJobs: 0,
      closedJobs: 0,
      recentJobs: [],
      company: null,
    });
  }

  const { jobs, company } = profile;
  const activeJobs = jobs.filter((j) => j.status === 'OPEN').length;
  const draftJobs = jobs.filter((j) => j.status === 'DRAFT').length;
  const closedJobs = jobs.filter((j) => j.status === 'CLOSED' || j.status === 'PAUSED').length;

  return reply.send({
    activeJobs,
    draftJobs,
    totalJobs: jobs.length,
    closedJobs,
    recentJobs: jobs.slice(0, 5),
    company,
  });
};
