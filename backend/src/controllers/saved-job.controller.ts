import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';

// ── Save Job ─────────────────────────────────────────────────────────────────
export const saveJob = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const jobId = request.params.id;
  const userId = request.user.id;

  // Verify job exists and is OPEN
  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });
  if (!job) {
    return reply.status(404).send({ message: 'Job not found' });
  }
  if (job.status !== 'OPEN') {
    return reply.status(400).send({ message: 'Can only save open jobs' });
  }

  // Get or create freelancer profile
  const profile = await prisma.freelancerProfile.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });

  // Check if already saved
  const existing = await prisma.savedJob.findUnique({
    where: {
      freelancerProfileId_jobId: {
        freelancerProfileId: profile.id,
        jobId,
      },
    },
  });

  if (existing) {
    return reply.status(409).send({ message: 'Job already saved' });
  }

  // Save the job
  const savedJob = await prisma.savedJob.create({
    data: {
      freelancerProfileId: profile.id,
      jobId,
    },
    include: {
      job: {
        include: {
          clientProfile: {
            include: {
              company: true,
            },
          },
          skills: true,
        },
      },
    },
  });

  return reply.status(201).send({ savedJob });
};

// ── Remove Saved Job ───────────────────────────────────────────────────────────
export const removeSavedJob = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const jobId = request.params.id;
  const userId = request.user.id;

  const profile = await prisma.freelancerProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    return reply.status(404).send({ message: 'Freelancer profile not found' });
  }

  const savedJob = await prisma.savedJob.findUnique({
    where: {
      freelancerProfileId_jobId: {
        freelancerProfileId: profile.id,
        jobId,
      },
    },
  });

  if (!savedJob) {
    return reply.status(404).send({ message: 'Saved job not found' });
  }

  await prisma.savedJob.delete({
    where: {
      freelancerProfileId_jobId: {
        freelancerProfileId: profile.id,
        jobId,
      },
    },
  });

  return reply.send({ message: 'Job removed from saved' });
};

// ── Get Saved Jobs ─────────────────────────────────────────────────────────────
export const getSavedJobs = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const userId = request.user.id;

  const profile = await prisma.freelancerProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    return reply.send({ savedJobs: [] });
  }

  const savedJobs = await prisma.savedJob.findMany({
    where: {
      freelancerProfileId: profile.id,
    },
    include: {
      job: {
        include: {
          clientProfile: {
            include: {
              company: true,
            },
          },
          skills: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return reply.send({ savedJobs });
};
