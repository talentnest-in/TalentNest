import { prisma } from '../lib/prisma';
import { NotFoundError, BadRequestError, ConflictError } from '../lib/errors';

export async function saveJob(userId: string, jobId: string) {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new NotFoundError('Job');
  if (job.status !== 'OPEN') throw new BadRequestError('Can only save open jobs');

  const profile = await prisma.freelancerProfile.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });

  const existing = await prisma.savedJob.findUnique({
    where: {
      freelancerProfileId_jobId: {
        freelancerProfileId: profile.id,
        jobId,
      },
    },
  });

  if (existing) throw new ConflictError('Job already saved');

  const savedJob = await prisma.savedJob.create({
    data: {
      freelancerProfileId: profile.id,
      jobId,
    },
    include: {
      job: {
        include: {
          clientProfile: { include: { company: true } },
          skills: true,
        },
      },
    },
  });

  return { savedJob };
}

export async function removeSavedJob(userId: string, jobId: string) {
  const profile = await prisma.freelancerProfile.findUnique({ where: { userId } });
  if (!profile) throw new NotFoundError('Freelancer profile');

  const savedJob = await prisma.savedJob.findUnique({
    where: {
      freelancerProfileId_jobId: {
        freelancerProfileId: profile.id,
        jobId,
      },
    },
  });

  if (!savedJob) throw new NotFoundError('Saved job');

  await prisma.savedJob.delete({
    where: {
      freelancerProfileId_jobId: {
        freelancerProfileId: profile.id,
        jobId,
      },
    },
  });

  return { message: 'Job removed from saved' };
}

export async function getSavedJobs(userId: string, page = '1', limit = '10') {
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const profile = await prisma.freelancerProfile.findUnique({ where: { userId } });
  if (!profile) {
    return { savedJobs: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } };
  }

  const [savedJobs, total] = await Promise.all([
    prisma.savedJob.findMany({
      where: { freelancerProfileId: profile.id },
      include: {
        job: {
          include: {
            clientProfile: { include: { company: true } },
            skills: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.savedJob.count({ where: { freelancerProfileId: profile.id } }),
  ]);

  return {
    savedJobs,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  };
}
