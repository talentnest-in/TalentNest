import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

// ── Validation Schemas ─────────────────────────────────────────────────────────────

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'REVIEWING', 'SHORTLISTED', 'REJECTED', 'HIRED']),
});

type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

// ── Get All Applicants for Client ─────────────────────────────────────────────────────

export const getAllClientApplicants = async (
  request: FastifyRequest<{ Querystring: { page?: string; search?: string; status?: string } }>,
  reply: FastifyReply
) => {
  const userId = request.user.id;
  const page = parseInt(request.query.page || '1') || 1;
  const search = request.query.search || '';
  const status = request.query.status;

  // Get client profile
  const clientProfile = await prisma.clientProfile.findUnique({
    where: { userId },
  });

  if (!clientProfile) {
    return reply.status(404).send({ message: 'Client profile not found' });
  }

  const where: any = {
    job: {
      clientProfileId: clientProfile.id,
    },
  };

  if (status) {
    where.status = status;
  }

  if (search) {
    where.profile = {
      OR: [
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ],
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

// ── Get Applicants for Job ───────────────────────────────────────────────────────────

export const getJobApplicants = async (
  request: FastifyRequest<{ Params: { jobId: string }; Querystring: { page?: string; search?: string; status?: string } }>,
  reply: FastifyReply
) => {
  const jobId = request.params.jobId;
  const userId = request.user.id;
  const page = parseInt(request.query.page || '1') || 1;
  const search = request.query.search || '';
  const status = request.query.status;

  // Verify job belongs to this client
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { clientProfile: true },
  });

  if (!job) {
    return reply.status(404).send({ message: 'Job not found' });
  }

  if (job.clientProfile.userId !== userId) {
    return reply.status(403).send({ message: 'Access denied' });
  }

  const where: any = {
    jobId,
  };

  if (status) {
    where.status = status;
  }

  if (search) {
    where.profile = {
      OR: [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { title: { contains: search, mode: 'insensitive' } },
      ],
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

// ── Get Applicant Details ───────────────────────────────────────────────────────────

export const getApplicantDetails = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const applicationId = request.params.id;
  const userId = request.user.id;

  const application = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: {
      profile: {
        include: {
          user: true,
          skills: true,
          experiences: {
            orderBy: { startDate: 'desc' },
          },
          educations: {
            orderBy: { startDate: 'desc' },
          },
          projects: {
            orderBy: { createdAt: 'desc' },
          },
        },
      },
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

  if (!application) {
    return reply.status(404).send({ message: 'Application not found' });
  }

  // Verify job belongs to this client
  if (application.job.clientProfile.userId !== userId) {
    return reply.status(403).send({ message: 'Access denied' });
  }

  return reply.send({ application });
};

// ── Update Application Status ───────────────────────────────────────────────────────

export const updateApplicationStatus = async (
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateStatusInput }>,
  reply: FastifyReply
) => {
  const applicationId = request.params.id;
  const userId = request.user.id;

  const application = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: {
      job: {
        include: { clientProfile: true },
      },
    },
  });

  if (!application) {
    return reply.status(404).send({ message: 'Application not found' });
  }

  // Verify job belongs to this client
  if (application.job.clientProfile.userId !== userId) {
    return reply.status(403).send({ message: 'Access denied' });
  }

  // Validate request body
  const body = updateStatusSchema.parse(request.body);

  // Validate status transitions
  const currentStatus = application.status;
  const newStatus = body.status;

  // Cannot update if already WITHDRAWN, REJECTED, or HIRED
  if (currentStatus === 'WITHDRAWN' || currentStatus === 'REJECTED' || currentStatus === 'HIRED') {
    return reply.status(400).send({ message: 'Cannot update application in current status' });
  }

  // Validate allowed transitions
  const allowedTransitions: Record<string, string[]> = {
    PENDING: ['REVIEWING', 'REJECTED'],
    REVIEWING: ['SHORTLISTED', 'REJECTED'],
    SHORTLISTED: ['HIRED', 'REJECTED'],
  };

  if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
    return reply.status(400).send({ message: 'Invalid status transition' });
  }

  // Update status
  const updated = await prisma.jobApplication.update({
    where: { id: applicationId },
    data: { status: newStatus },
    include: {
      profile: {
        include: {
          user: true,
        },
      },
      job: {
        include: {
          clientProfile: {
            include: {
              company: true,
            },
          },
        },
      },
    },
  });

  return reply.send({ application: updated });
};
