import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

// ── Validation Schemas ─────────────────────────────────────────────────────────────

const applyJobSchema = z.object({
  coverLetter: z.string().min(10, 'Cover letter must be at least 10 characters').max(5000, 'Cover letter must be less than 5000 characters'),
  proposedRate: z.number().positive('Proposed rate must be greater than 0').nullable().optional(),
  estimatedDuration: z.string().max(200, 'Estimated duration must be less than 200 characters').nullable().optional(),
  resumeUrl: z.string().url().nullable().optional().or(z.literal('')),
});

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'REVIEWING', 'SHORTLISTED', 'REJECTED', 'HIRED']),
});

type ApplyJobInput = z.infer<typeof applyJobSchema>;
type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

// ── Apply for Job ─────────────────────────────────────────────────────────────────

export const applyForJob = async (
  request: FastifyRequest<{ Params: { id: string }; Body: ApplyJobInput }>,
  reply: FastifyReply
) => {
  const jobId = request.params.id;
  const userId = request.user.id;

  // Verify job exists and is OPEN
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { clientProfile: true },
  });

  if (!job) {
    return reply.status(404).send({ message: 'Job not found' });
  }

  if (job.status !== 'OPEN') {
    return reply.status(400).send({ message: 'Can only apply to open jobs' });
  }

  // Check if user is trying to apply to their own job
  if (job.clientProfile.userId === userId) {
    return reply.status(400).send({ message: 'Cannot apply to your own job' });
  }

  // Get or create freelancer profile
  const profile = await prisma.freelancerProfile.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });

  // Check if already applied
  const existing = await prisma.jobApplication.findUnique({
    where: {
      freelancerProfileId_jobId: {
        freelancerProfileId: profile.id,
        jobId,
      },
    },
  });

  if (existing) {
    return reply.status(409).send({ message: 'Already applied to this job' });
  }

  // Validate request body
  const body = applyJobSchema.parse(request.body);

  // Create application
  const application = await prisma.jobApplication.create({
    data: {
      freelancerProfileId: profile.id,
      jobId,
      coverLetter: body.coverLetter,
      proposedRate: body.proposedRate ?? null,
      estimatedDuration: body.estimatedDuration ?? null,
      resumeUrl: body.resumeUrl || null,
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

  return reply.status(201).send({ application });
};

// ── Get My Applications ─────────────────────────────────────────────────────────────

export const getMyApplications = async (
  request: FastifyRequest<{ Querystring: { page?: string; search?: string; status?: string } }>,
  reply: FastifyReply
) => {
  const userId = request.user.id;
  const page = parseInt(request.query.page || '1') || 1;
  const search = request.query.search || '';
  const status = request.query.status;

  const profile = await prisma.freelancerProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    return reply.send({ applications: [], total: 0, page, totalPages: 0 });
  }

  const where: any = {
    freelancerProfileId: profile.id,
  };

  if (status) {
    where.status = status;
  }

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
            clientProfile: {
              include: {
                company: true,
              },
            },
            skills: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * 12,
      take: 12,
    }),
    prisma.jobApplication.count({ where }),
  ]);

  const totalPages = Math.ceil(total / 12);

  return reply.send({
    applications,
    total,
    page,
    totalPages,
  });
};

// ── Get Application Details ─────────────────────────────────────────────────────────

export const getApplicationDetails = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const applicationId = request.params.id;
  const userId = request.user.id;

  const application = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
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
      profile: true,
    },
  });

  if (!application) {
    return reply.status(404).send({ message: 'Application not found' });
  }

  // Verify user owns this application
  if (application.profile.userId !== userId) {
    return reply.status(403).send({ message: 'Access denied' });
  }

  return reply.send({ application });
};

// ── Withdraw Application ───────────────────────────────────────────────────────────

export const withdrawApplication = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const applicationId = request.params.id;
  const userId = request.user.id;

  const application = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: { profile: true },
  });

  if (!application) {
    return reply.status(404).send({ message: 'Application not found' });
  }

  // Verify user owns this application
  if (application.profile.userId !== userId) {
    return reply.status(403).send({ message: 'Access denied' });
  }

  // Can only withdraw if PENDING or REVIEWING
  if (application.status !== 'PENDING' && application.status !== 'REVIEWING') {
    return reply.status(400).send({ message: 'Cannot withdraw application in current status' });
  }

  await prisma.jobApplication.update({
    where: { id: applicationId },
    data: { status: 'WITHDRAWN' },
  });

  return reply.send({ message: 'Application withdrawn' });
};
