import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { NotFoundError, ForbiddenError, BadRequestError, ConflictError } from '../lib/errors';
import { awardExp } from './gamification.service';
import { createNotification } from './notification.service';

const applyJobSchema = z.object({
  coverLetter: z.string().min(10, 'Cover letter must be at least 10 characters').max(5000, 'Cover letter must be less than 5000 characters'),
  proposedRate: z.number().positive('Proposed rate must be greater than 0').nullable().optional(),
  estimatedDuration: z.string().max(200, 'Estimated duration must be less than 200 characters').nullable().optional(),
  resumeUrl: z.string().url().nullable().optional().or(z.literal('')),
});

export async function applyForJob(userId: string, jobId: string, body: unknown) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { clientProfile: true },
  });

  if (!job) throw new NotFoundError('Job');
  if (job.status !== 'OPEN') throw new BadRequestError('Can only apply to open jobs');
  if (job.clientProfile.userId === userId) throw new BadRequestError('Cannot apply to your own job');

  const profile = await prisma.freelancerProfile.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });

  const existing = await prisma.jobApplication.findUnique({
    where: {
      freelancerProfileId_jobId: {
        freelancerProfileId: profile.id,
        jobId,
      },
    },
  });

  if (existing) throw new ConflictError('Already applied to this job');

  const parsed = applyJobSchema.parse(body);

  const application = await prisma.jobApplication.create({
    data: {
      freelancerProfileId: profile.id,
      jobId,
      coverLetter: parsed.coverLetter,
      proposedRate: parsed.proposedRate ?? null,
      estimatedDuration: parsed.estimatedDuration ?? null,
      resumeUrl: parsed.resumeUrl || null,
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

  await createNotification({
    userId: job.clientProfile.userId,
    type: 'NEW_APPLICATION',
    title: 'New Job Application',
    message: `You have received a new application for ${job.title}`,
    link: `/client/jobs/${jobId}/applicants`,
  });

  await awardExp(userId, 'JOB_APPLICATION', `Applied for job: ${job.title}`);

  return { application };
}

export async function getMyApplications(
  userId: string,
  query: { page?: string; limit?: string; search?: string; status?: string }
) {
  const page = parseInt(query.page || '1') || 1;
  const limit = parseInt(query.limit || '10') || 10;
  const search = query.search || '';
  const status = query.status;
  const skip = (page - 1) * limit;

  const profile = await prisma.freelancerProfile.findUnique({ where: { userId } });
  if (!profile) {
    return { applications: [], pagination: { page, limit, total: 0, pages: 0 } };
  }

  const where: any = { freelancerProfileId: profile.id };
  if (status) where.status = status;
  if (search) {
    where.job = {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    };
  }

  const [applications, total] = await Promise.all([
    prisma.jobApplication.findMany({
      where,
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
      take: limit,
    }),
    prisma.jobApplication.count({ where }),
  ]);

  return {
    applications,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

export async function getApplicationDetails(userId: string, applicationId: string) {
  const application = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: {
      job: {
        include: {
          clientProfile: { include: { company: true } },
          skills: true,
        },
      },
      profile: true,
    },
  });

  if (!application) throw new NotFoundError('Application');

  if (application.profile.userId !== userId) throw new ForbiddenError();

  return { application };
}

export async function withdrawApplication(userId: string, applicationId: string) {
  const application = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: { profile: true },
  });

  if (!application) throw new NotFoundError('Application');
  if (application.profile.userId !== userId) throw new ForbiddenError();
  if (application.status !== 'PENDING' && application.status !== 'REVIEWING') {
    throw new BadRequestError('Cannot withdraw application in current status');
  }

  await prisma.jobApplication.update({
    where: { id: applicationId },
    data: { status: 'WITHDRAWN' },
  });

  return { message: 'Application withdrawn' };
}
