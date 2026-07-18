import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { NotFoundError, ForbiddenError, BadRequestError } from '../lib/errors';

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'REVIEWING', 'SHORTLISTED', 'REJECTED', 'HIRED']),
});

export async function getAllClientApplicants(
  userId: string,
  query: { page?: string; limit?: string; search?: string; status?: string }
) {
  const page = parseInt(query.page || '1') || 1;
  const limit = parseInt(query.limit || '12') || 12;
  const search = query.search || '';
  const status = query.status;
  const skip = (page - 1) * limit;

  const clientProfile = await prisma.clientProfile.findUnique({ where: { userId } });
  if (!clientProfile) throw new NotFoundError('Client profile');

  const where: any = { job: { clientProfileId: clientProfile.id } };
  if (status) where.status = status;
  if (search) {
    where.profile = {
      OR: [{ user: { name: { contains: search, mode: 'insensitive' } } }],
    };
  }

  const [applications, total] = await Promise.all([
    prisma.jobApplication.findMany({
      where,
      include: {
        profile: {
          include: {
            user: true,
            skills: true,
            experiences: true,
            educations: true,
            projects: true,
          },
        },
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

export async function getJobApplicants(
  userId: string,
  jobId: string,
  query: { page?: string; limit?: string; search?: string; status?: string }
) {
  const page = parseInt(query.page || '1') || 1;
  const limit = parseInt(query.limit || '12') || 12;
  const search = query.search || '';
  const status = query.status;
  const skip = (page - 1) * limit;

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { clientProfile: true },
  });

  if (!job) throw new NotFoundError('Job');
  if (job.clientProfile.userId !== userId) throw new ForbiddenError();

  const where: any = { jobId };
  if (status) where.status = status;
  if (search) {
    where.profile = {
      OR: [{ user: { name: { contains: search, mode: 'insensitive' } } }],
    };
  }

  const [applications, total] = await Promise.all([
    prisma.jobApplication.findMany({
      where,
      include: {
        profile: {
          include: {
            user: true,
            skills: true,
            experiences: true,
            educations: true,
            projects: true,
          },
        },
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

export async function getApplicantDetails(userId: string, applicationId: string) {
  const application = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: {
      profile: {
        include: {
          user: true,
          skills: true,
          experiences: { orderBy: { startDate: 'desc' } },
          educations: { orderBy: { startDate: 'desc' } },
          projects: { orderBy: { createdAt: 'desc' } },
        },
      },
      job: {
        include: {
          clientProfile: { include: { company: true } },
          skills: true,
        },
      },
    },
  });

  if (!application) throw new NotFoundError('Application');
  if (application.job.clientProfile.userId !== userId) throw new ForbiddenError();

  return { application };
}

export async function updateApplicationStatus(userId: string, applicationId: string, body: unknown) {
  const application = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: { job: { include: { clientProfile: true } } },
  });

  if (!application) throw new NotFoundError('Application');
  if (application.job.clientProfile.userId !== userId) throw new ForbiddenError();

  const parsed = updateStatusSchema.parse(body);
  const { status: newStatus } = parsed;
  const currentStatus = application.status;

  if (currentStatus === 'WITHDRAWN' || currentStatus === 'REJECTED' || currentStatus === 'HIRED') {
    throw new BadRequestError('Cannot update application in current status');
  }

  const allowedTransitions: Record<string, string[]> = {
    PENDING: ['REVIEWING', 'REJECTED'],
    REVIEWING: ['SHORTLISTED', 'REJECTED'],
    SHORTLISTED: ['HIRED', 'REJECTED'],
  };

  if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
    throw new BadRequestError('Invalid status transition');
  }

  const updated = await prisma.jobApplication.update({
    where: { id: applicationId },
    data: { status: newStatus },
    include: {
      profile: { include: { user: true } },
      job: { include: { clientProfile: { include: { company: true } } } },
    },
  });

  return { application: updated };
}
