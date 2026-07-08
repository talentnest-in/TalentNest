import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { getIO } from '../plugins/socket';
import DOMPurify from 'isomorphic-dompurify';
import { ContestStatus, ContestVisibility, ContestSubmissionStatus, Role, ContestDifficulty } from '@prisma/client';
import { createNotification } from './notification.controller';

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const createContestSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  category: z.string().min(1, 'Category is required'),
  skills: z.array(z.string()).min(1, 'At least one skill is required'),
  difficulty: z.nativeEnum(ContestDifficulty),
  prizeAmount: z.number().min(1, 'Prize must be greater than 0'),
  registrationDeadline: z.string().datetime(),
  submissionDeadline: z.string().datetime(),
  maxParticipants: z.number().int().positive().nullable().optional(),
  visibility: z.nativeEnum(ContestVisibility).optional().default('PUBLIC'),
  rules: z.array(z.string()).min(1, 'At least one rule is required'),
  judgingCriteria: z.array(z.string()).min(1, 'At least one judging criterion is required'),
  featuredImage: z.string().url().nullable().optional(),
  attachments: z
    .array(
      z.object({
        url: z.string().url(),
        name: z.string(),
        type: z.string(),
      })
    )
    .optional(),
});

const submitEntrySchema = z.object({
  description: z.string().min(10, 'Description must be at least 10 characters'),
  imageUrls: z.array(z.string().url()).optional().default([]),
  pdfUrl: z.string().url().nullable().optional(),
  zipUrl: z.string().url().nullable().optional(),
  githubUrl: z.string().url().nullable().optional(),
  liveUrl: z.string().url().nullable().optional(),
  figmaUrl: z.string().url().nullable().optional(),
  videoUrl: z.string().url().nullable().optional(),
});

const selectWinnerSchema = z.object({
  winnerId: z.string().uuid(),
  runnerUpId: z.string().uuid().nullable().optional(),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-') +
    '-' +
    Math.random().toString(36).substring(2, 7)
  );
}

function zodError(error: z.ZodError, reply: FastifyReply) {
  const message = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
  return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message });
}

async function assertContestOwner(contestId: string, userId: string, reply: FastifyReply) {
  const contest = await prisma.contest.findUnique({ where: { id: contestId } });
  if (!contest) {
    reply.status(404).send({ error: 'Contest not found' });
    return null;
  }
  if (contest.clientId !== userId) {
    reply.status(403).send({ error: 'Forbidden' });
    return null;
  }
  return contest;
}

const CONTEST_INCLUDE = {
  client: { select: { id: true, name: true, avatar: true } },
  attachments: true,
  winner: { select: { id: true, name: true, avatar: true } },
  runnerUp: { select: { id: true, name: true, avatar: true } },
  _count: { select: { participants: true, submissions: true } },
} as const;

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export const browseContests = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { page = '1', limit = '10', sort = 'newest', category, difficulty, status, search } = request.query as any;
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 10, 50);
    const skip = Math.max(0, (pageNum - 1) * limitNum);

    const where: any = { visibility: ContestVisibility.PUBLIC };

    if (status && Object.values(ContestStatus).includes(status)) where.status = status;
    else where.status = ContestStatus.PUBLISHED;

    if (category) where.category = category;
    if (difficulty && Object.values(ContestDifficulty).includes(difficulty)) where.difficulty = difficulty;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { skills: { has: search } },
      ];
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'ending_soon') orderBy = { submissionDeadline: 'asc' };
    else if (sort === 'popular') orderBy = { viewCount: 'desc' };
    else if (sort === 'prize') orderBy = { prizeAmount: 'desc' };

    const [contests, total] = await Promise.all([
      prisma.contest.findMany({ where, skip, take: limitNum, orderBy, include: CONTEST_INCLUDE }),
      prisma.contest.count({ where }),
    ]);

    return reply.send({ data: contests, meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const createContest = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user;
    if (user.role !== Role.CLIENT && user.role !== Role.ADMIN) {
      return reply.status(403).send({ error: 'Only clients can create contests' });
    }

    const data = createContestSchema.parse(request.body);
    let slug = generateSlug(data.title);
    // ensure unique slug
    const existing = await prisma.contest.findUnique({ where: { slug } });
    if (existing) slug = generateSlug(data.title);

    const contest = await prisma.contest.create({
      data: {
        title: data.title,
        slug,
        description: DOMPurify.sanitize(data.description),
        category: data.category,
        skills: data.skills,
        difficulty: data.difficulty,
        prizeAmount: data.prizeAmount,
        registrationDeadline: new Date(data.registrationDeadline),
        submissionDeadline: new Date(data.submissionDeadline),
        maxParticipants: data.maxParticipants ?? null,
        visibility: data.visibility ?? 'PUBLIC',
        rules: data.rules.map((r) => DOMPurify.sanitize(r)),
        judgingCriteria: data.judgingCriteria.map((c) => DOMPurify.sanitize(c)),
        featuredImage: data.featuredImage ?? null,
        clientId: user.id,
        ...(data.attachments ? { attachments: { create: data.attachments } } : {}),
      },
      include: CONTEST_INCLUDE,
    });

    return reply.status(201).send({ data: contest });
  } catch (error) {
    if (error instanceof z.ZodError) return zodError(error, reply);
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const getContestDetail = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { slug } = request.params as { slug: string };

    const contest = await prisma.contest.findUnique({
      where: { slug },
      include: {
        ...CONTEST_INCLUDE,
        submissions: {
          where: { status: { in: [ContestSubmissionStatus.WINNER, ContestSubmissionStatus.RUNNER_UP] } },
          include: { participant: { select: { id: true, name: true, avatar: true } } },
        },
      },
    });

    if (!contest) return reply.status(404).send({ error: 'Contest not found' });

    // Increment view count (fire-and-forget)
    prisma.contest.update({ where: { id: contest.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

    return reply.send({ data: contest });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const updateContest = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    const contest = await assertContestOwner(id, request.user.id, reply);
    if (!contest) return;

    if (contest.status === ContestStatus.CLOSED) {
      return reply.status(400).send({ error: 'Cannot edit a closed contest' });
    }

    const data = createContestSchema.partial().parse(request.body);

    const updated = await prisma.contest.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description && { description: DOMPurify.sanitize(data.description) }),
        ...(data.category && { category: data.category }),
        ...(data.skills && { skills: data.skills }),
        ...(data.difficulty && { difficulty: data.difficulty }),
        ...(data.prizeAmount !== undefined && { prizeAmount: data.prizeAmount }),
        ...(data.registrationDeadline && { registrationDeadline: new Date(data.registrationDeadline) }),
        ...(data.submissionDeadline && { submissionDeadline: new Date(data.submissionDeadline) }),
        ...(data.maxParticipants !== undefined && { maxParticipants: data.maxParticipants }),
        ...(data.visibility && { visibility: data.visibility }),
        ...(data.rules && { rules: data.rules.map((r) => DOMPurify.sanitize(r)) }),
        ...(data.judgingCriteria && { judgingCriteria: data.judgingCriteria.map((c) => DOMPurify.sanitize(c)) }),
        ...(data.featuredImage !== undefined && { featuredImage: data.featuredImage }),
      },
      include: CONTEST_INCLUDE,
    });

    return reply.send({ data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) return zodError(error, reply);
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const deleteContest = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    const user = request.user;
    const contest = await prisma.contest.findUnique({ where: { id } });
    if (!contest) return reply.status(404).send({ error: 'Contest not found' });
    if (contest.clientId !== user.id && user.role !== Role.ADMIN) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    await prisma.contest.delete({ where: { id } });
    return reply.send({ message: 'Contest deleted' });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

// ─── Status Management ────────────────────────────────────────────────────────

async function changeContestStatus(
  request: FastifyRequest,
  reply: FastifyReply,
  newStatus: ContestStatus,
  allowedFrom: ContestStatus[]
) {
  try {
    const { id } = request.params as { id: string };
    const contest = await assertContestOwner(id, request.user.id, reply);
    if (!contest) return;

    if (!allowedFrom.includes(contest.status)) {
      return reply.status(400).send({ error: `Cannot change status from ${contest.status} to ${newStatus}` });
    }

    const updated = await prisma.contest.update({ where: { id }, data: { status: newStatus }, include: CONTEST_INCLUDE });

    // Emit socket event
    getIO().to(`contest:${id}`).emit('contest:status_changed', { contestId: id, status: newStatus });

    return reply.send({ data: updated });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
}

export const publishContest = (request: FastifyRequest, reply: FastifyReply) =>
  changeContestStatus(request, reply, ContestStatus.PUBLISHED, [ContestStatus.DRAFT, ContestStatus.PAUSED]);

export const pauseContest = (request: FastifyRequest, reply: FastifyReply) =>
  changeContestStatus(request, reply, ContestStatus.PAUSED, [ContestStatus.PUBLISHED]);

export const closeContest = (request: FastifyRequest, reply: FastifyReply) =>
  changeContestStatus(request, reply, ContestStatus.CLOSED, [ContestStatus.PUBLISHED, ContestStatus.PAUSED]);

export const reopenContest = (request: FastifyRequest, reply: FastifyReply) =>
  changeContestStatus(request, reply, ContestStatus.PUBLISHED, [ContestStatus.PAUSED, ContestStatus.CLOSED]);

export const duplicateContest = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    const contest = await assertContestOwner(id, request.user.id, reply);
    if (!contest) return;

    const newSlug = generateSlug(contest.title + ' copy');
    const duplicated = await prisma.contest.create({
      data: {
        title: contest.title + ' (Copy)',
        slug: newSlug,
        description: contest.description,
        category: contest.category,
        skills: contest.skills,
        difficulty: contest.difficulty,
        prizeAmount: contest.prizeAmount,
        registrationDeadline: contest.registrationDeadline,
        submissionDeadline: contest.submissionDeadline,
        maxParticipants: contest.maxParticipants,
        visibility: contest.visibility,
        rules: contest.rules,
        judgingCriteria: contest.judgingCriteria,
        featuredImage: contest.featuredImage,
        clientId: contest.clientId,
        status: ContestStatus.DRAFT,
      },
      include: CONTEST_INCLUDE,
    });

    return reply.status(201).send({ data: duplicated });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

// ─── Participation ────────────────────────────────────────────────────────────

export const joinContest = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    const user = request.user;

    if (user.role !== Role.FREELANCER) {
      return reply.status(403).send({ error: 'Only freelancers can join contests' });
    }

    const contest = await prisma.contest.findUnique({
      where: { id },
      include: { _count: { select: { participants: true } } },
    });
    if (!contest) return reply.status(404).send({ error: 'Contest not found' });
    if (contest.status !== ContestStatus.PUBLISHED) {
      return reply.status(400).send({ error: 'Contest is not open for registration' });
    }
    if (new Date() > contest.registrationDeadline) {
      return reply.status(400).send({ error: 'Registration deadline has passed' });
    }
    if (contest.maxParticipants && contest._count.participants >= contest.maxParticipants) {
      return reply.status(400).send({ error: 'Contest is full' });
    }

    const existing = await prisma.contestParticipant.findUnique({
      where: { contestId_userId: { contestId: id, userId: user.id } },
    });
    if (existing) return reply.status(400).send({ error: 'You are already participating in this contest' });

    const [participant] = await prisma.$transaction([
      prisma.contestParticipant.create({ data: { contestId: id, userId: user.id } }),
      prisma.user.update({ where: { id: user.id }, data: { contestParticipations: { increment: 1 } } }),
    ]);

    const count = await prisma.contestParticipant.count({ where: { contestId: id } });
    getIO().to(`contest:${id}`).emit('contest:participant_joined', { contestId: id, count });

    return reply.status(201).send({ data: participant });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const leaveContest = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    const userId = request.user.id;

    const participant = await prisma.contestParticipant.findUnique({
      where: { contestId_userId: { contestId: id, userId } },
    });
    if (!participant) return reply.status(404).send({ error: 'You are not participating in this contest' });

    const hasSubmission = await prisma.contestSubmission.findUnique({
      where: { contestId_participantId: { contestId: id, participantId: userId } },
    });
    if (hasSubmission) return reply.status(400).send({ error: 'Cannot leave a contest you have already submitted to' });

    await prisma.$transaction([
      prisma.contestParticipant.delete({ where: { contestId_userId: { contestId: id, userId } } }),
      prisma.user.update({ where: { id: userId }, data: { contestParticipations: { decrement: 1 } } }),
    ]);

    return reply.send({ message: 'Left contest successfully' });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const listParticipants = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    const participants = await prisma.contestParticipant.findMany({
      where: { contestId: id },
      include: { user: { select: { id: true, name: true, avatar: true, role: true } } },
      orderBy: { joinedAt: 'desc' },
    });
    return reply.send({ data: participants });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

// ─── Submissions ─────────────────────────────────────────────────────────────

export const submitEntry = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    const userId = request.user.id;

    const contest = await prisma.contest.findUnique({ where: { id } });
    if (!contest) return reply.status(404).send({ error: 'Contest not found' });
    if (contest.status !== ContestStatus.PUBLISHED) {
      return reply.status(400).send({ error: 'Contest is not accepting submissions' });
    }
    if (new Date() > contest.submissionDeadline) {
      return reply.status(403).send({ error: 'Submission deadline has passed' });
    }

    const isParticipant = await prisma.contestParticipant.findUnique({
      where: { contestId_userId: { contestId: id, userId } },
    });
    if (!isParticipant) return reply.status(403).send({ error: 'You must join the contest before submitting' });

    const existingSubmission = await prisma.contestSubmission.findUnique({
      where: { contestId_participantId: { contestId: id, participantId: userId } },
    });
    if (existingSubmission) return reply.status(400).send({ error: 'You have already submitted an entry. Use PUT to update it.' });

    const data = submitEntrySchema.parse(request.body);

    const submission = await prisma.contestSubmission.create({
      data: {
        contestId: id,
        participantId: userId,
        description: DOMPurify.sanitize(data.description),
        imageUrls: data.imageUrls ?? [],
        pdfUrl: data.pdfUrl ?? null,
        zipUrl: data.zipUrl ?? null,
        githubUrl: data.githubUrl ?? null,
        liveUrl: data.liveUrl ?? null,
        figmaUrl: data.figmaUrl ?? null,
        videoUrl: data.videoUrl ?? null,
      },
      include: { participant: { select: { id: true, name: true, avatar: true } } },
    });

    // Notify contest client
    await createNotification({
      userId: contest.clientId,
      type: 'SYSTEM',
      title: 'New Submission Received',
      message: `A new submission was received for your contest "${contest.title}".`,
      link: `/contests/${contest.id}/submissions`,
    });

    const count = await prisma.contestSubmission.count({ where: { contestId: id } });
    getIO().to(`contest:${id}`).emit('contest:submission_received', { contestId: id, count });

    return reply.status(201).send({ data: submission });
  } catch (error) {
    if (error instanceof z.ZodError) return zodError(error, reply);
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const updateSubmission = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    const userId = request.user.id;

    const contest = await prisma.contest.findUnique({ where: { id } });
    if (!contest) return reply.status(404).send({ error: 'Contest not found' });
    if (new Date() > contest.submissionDeadline) {
      return reply.status(403).send({ error: 'Submission deadline has passed' });
    }

    const submission = await prisma.contestSubmission.findUnique({
      where: { contestId_participantId: { contestId: id, participantId: userId } },
    });
    if (!submission) return reply.status(404).send({ error: 'No submission found to update' });

    const data = submitEntrySchema.partial().parse(request.body);
    const updated = await prisma.contestSubmission.update({
      where: { contestId_participantId: { contestId: id, participantId: userId } },
      data: {
        ...(data.description && { description: DOMPurify.sanitize(data.description) }),
        ...(data.imageUrls && { imageUrls: data.imageUrls }),
        ...(data.pdfUrl !== undefined && { pdfUrl: data.pdfUrl }),
        ...(data.zipUrl !== undefined && { zipUrl: data.zipUrl }),
        ...(data.githubUrl !== undefined && { githubUrl: data.githubUrl }),
        ...(data.liveUrl !== undefined && { liveUrl: data.liveUrl }),
        ...(data.figmaUrl !== undefined && { figmaUrl: data.figmaUrl }),
        ...(data.videoUrl !== undefined && { videoUrl: data.videoUrl }),
      },
      include: { participant: { select: { id: true, name: true, avatar: true } } },
    });

    return reply.send({ data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) return zodError(error, reply);
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const withdrawSubmission = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    const userId = request.user.id;

    const contest = await prisma.contest.findUnique({ where: { id } });
    if (!contest) return reply.status(404).send({ error: 'Contest not found' });
    if (new Date() > contest.submissionDeadline) {
      return reply.status(403).send({ error: 'Cannot withdraw after submission deadline' });
    }

    const submission = await prisma.contestSubmission.findUnique({
      where: { contestId_participantId: { contestId: id, participantId: userId } },
    });
    if (!submission) return reply.status(404).send({ error: 'No submission found' });

    await prisma.contestSubmission.delete({
      where: { contestId_participantId: { contestId: id, participantId: userId } },
    });

    return reply.send({ message: 'Submission withdrawn' });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const listSubmissions = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    const { filter } = request.query as { filter?: string };
    const user = request.user;

    const contest = await prisma.contest.findUnique({ where: { id } });
    if (!contest) return reply.status(404).send({ error: 'Contest not found' });
    if (contest.clientId !== user.id && user.role !== Role.ADMIN) {
      return reply.status(403).send({ error: 'Only the contest owner can view all submissions' });
    }

    const where: any = { contestId: id };
    if (filter && Object.values(ContestSubmissionStatus).includes(filter as ContestSubmissionStatus)) {
      where.status = filter;
    }

    const submissions = await prisma.contestSubmission.findMany({
      where,
      include: { participant: { select: { id: true, name: true, avatar: true } } },
      orderBy: { submittedAt: 'desc' },
    });

    return reply.send({ data: submissions });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const getMySubmission = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    const userId = request.user.id;

    const participant = await prisma.contestParticipant.findUnique({
      where: { contestId_userId: { contestId: id, userId } },
    });

    if (!participant) {
      return reply.send({ data: { isParticipant: false, submission: null } });
    }

    const submission = await prisma.contestSubmission.findUnique({
      where: { contestId_participantId: { contestId: id, participantId: userId } },
      include: { participant: { select: { id: true, name: true, avatar: true } } },
    });

    return reply.send({ data: { isParticipant: true, submission } });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const updateSubmissionStatus = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id, submissionId } = request.params as { id: string; submissionId: string };
    const { status } = request.body as { status: ContestSubmissionStatus };

    const contest = await assertContestOwner(id, request.user.id, reply);
    if (!contest) return;

    const updated = await prisma.contestSubmission.update({
      where: { id: submissionId },
      data: { status },
      include: { participant: { select: { id: true, name: true, avatar: true } } },
    });

    return reply.send({ data: updated });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const selectWinner = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    const contest = await assertContestOwner(id, request.user.id, reply);
    if (!contest) return;

    if (contest.status !== ContestStatus.CLOSED && contest.status !== ContestStatus.PUBLISHED) {
      return reply.status(400).send({ error: 'Contest must be published or closed to select a winner' });
    }

    const { winnerId, runnerUpId } = selectWinnerSchema.parse(request.body);

    // Verify winner is a participant
    const winnerParticipant = await prisma.contestParticipant.findUnique({
      where: { contestId_userId: { contestId: id, userId: winnerId } },
    });
    if (!winnerParticipant) return reply.status(400).send({ error: 'Winner must be a contest participant' });

    await prisma.$transaction(async (tx) => {
      await tx.contest.update({
        where: { id },
        data: { winnerId, runnerUpId: runnerUpId ?? null, status: ContestStatus.CLOSED },
      });
      await tx.contestSubmission.updateMany({
        where: { contestId: id, participantId: winnerId },
        data: { status: ContestSubmissionStatus.WINNER },
      });
      if (runnerUpId) {
        await tx.contestSubmission.updateMany({
          where: { contestId: id, participantId: runnerUpId },
          data: { status: ContestSubmissionStatus.RUNNER_UP },
        });
      }
      await tx.user.update({ where: { id: winnerId }, data: { contestWins: { increment: 1 } } });
    });

    // Notify all participants
    const participants = await prisma.contestParticipant.findMany({ where: { contestId: id } });
    await Promise.all(
      participants.map((p) =>
        createNotification({
          userId: p.userId,
          type: 'SYSTEM',
          title: p.userId === winnerId ? '🏆 You won a contest!' : 'Contest winner selected',
          message:
            p.userId === winnerId
              ? `Congratulations! You won the contest "${contest.title}"!`
              : `The winner for contest "${contest.title}" has been announced.`,
          link: `/contests/${contest.slug ?? id}`,
        })
      )
    );

    getIO().to(`contest:${id}`).emit('contest:winner_selected', { contestId: id, winnerId });

    const updated = await prisma.contest.findUnique({ where: { id }, include: CONTEST_INCLUDE });
    return reply.send({ data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) return zodError(error, reply);
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

// ─── Dashboards ──────────────────────────────────────────────────────────────

export const getClientContests = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { status } = request.query as { status?: ContestStatus };
    const where: any = { clientId: request.user.id };
    if (status) where.status = status;

    const contests = await prisma.contest.findMany({
      where,
      include: CONTEST_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ data: contests });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const getContestAnalytics = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    const contest = await assertContestOwner(id, request.user.id, reply);
    if (!contest) return;

    const [participantCount, submissionCount, shortlistedCount] = await Promise.all([
      prisma.contestParticipant.count({ where: { contestId: id } }),
      prisma.contestSubmission.count({ where: { contestId: id } }),
      prisma.contestSubmission.count({
        where: { contestId: id, status: ContestSubmissionStatus.SHORTLISTED },
      }),
    ]);

    return reply.send({
      data: {
        viewCount: contest.viewCount,
        participantCount,
        submissionCount,
        shortlistedCount,
        submissionRate: participantCount ? Math.round((submissionCount / participantCount) * 100) : 0,
      },
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const getFreelancerJoinedContests = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = request.user.id;
    const memberships = await prisma.contestParticipant.findMany({
      where: { userId },
      include: { contest: { include: CONTEST_INCLUDE } },
      orderBy: { joinedAt: 'desc' },
    });
    return reply.send({ data: memberships.map((m) => m.contest) });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const getFreelancerSavedContests = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = request.user.id;
    const saved = await prisma.savedContest.findMany({
      where: { userId },
      include: { contest: { include: CONTEST_INCLUDE } },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send({ data: saved.map((s) => s.contest) });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const toggleSaveContest = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    const userId = request.user.id;

    const existing = await prisma.savedContest.findUnique({
      where: { userId_contestId: { userId, contestId: id } },
    });

    if (existing) {
      await prisma.savedContest.delete({ where: { userId_contestId: { userId, contestId: id } } });
      return reply.send({ saved: false });
    } else {
      await prisma.savedContest.create({ data: { userId, contestId: id } });
      return reply.send({ saved: true });
    }
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const updateSubmissionStatusById = updateSubmissionStatus;
