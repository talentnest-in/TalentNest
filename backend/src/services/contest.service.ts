import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { getIO } from '../plugins/socket';
import DOMPurify from 'isomorphic-dompurify';
import { ContestStatus, ContestVisibility, ContestSubmissionStatus, Role, ContestDifficulty } from '@prisma/client';
import { createNotification } from './notification.service';
import { awardExp } from './gamification.service';
import { NotFoundError, ForbiddenError, BadRequestError, ValidationError } from '../lib/errors';

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

async function assertContestOwner(contestId: string, userId: string) {
  const contest = await prisma.contest.findUnique({ where: { id: contestId } });
  if (!contest) throw new NotFoundError('Contest');
  if (contest.clientId !== userId) throw new ForbiddenError('Access denied');
  return contest;
}

const CONTEST_INCLUDE = {
  client: { select: { id: true, name: true, avatar: true } },
  attachments: true,
  winner: { select: { id: true, name: true, avatar: true } },
  runnerUp: { select: { id: true, name: true, avatar: true } },
  _count: { select: { participants: true, submissions: true } },
} as const;

export async function browseContests(query: { page?: string; limit?: string; sort?: string; category?: string; difficulty?: string; status?: string; search?: string }) {
  const { page = '1', limit = '10', sort = 'newest', category, difficulty, status, search } = query;
  const pageNum = parseInt(page) || 1;
  const limitNum = Math.min(parseInt(limit) || 10, 50);
  const skip = Math.max(0, (pageNum - 1) * limitNum);

  const where: any = { visibility: ContestVisibility.PUBLIC };

  if (status && Object.values(ContestStatus).includes(status as ContestStatus)) where.status = status;
  else where.status = ContestStatus.PUBLISHED;

  if (category) where.category = category;
  if (difficulty && Object.values(ContestDifficulty).includes(difficulty as ContestDifficulty)) where.difficulty = difficulty;
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

  return { data: contests, meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } };
}

export async function createContest(userId: string, role: string, body: unknown) {
  if (role !== Role.CLIENT && role !== Role.ADMIN) {
    throw new ForbiddenError('Only clients can create contests');
  }

  const data = createContestSchema.parse(body);
  let slug = generateSlug(data.title);
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
      clientId: userId,
      ...(data.attachments ? { attachments: { create: data.attachments } } : {}),
    },
    include: CONTEST_INCLUDE,
  });

  return contest;
}

export async function getContestDetail(slug: string) {
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

  if (!contest) throw new NotFoundError('Contest');

  prisma.contest.update({ where: { id: contest.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  return contest;
}

export async function updateContest(id: string, userId: string, body: unknown) {
  const contest = await assertContestOwner(id, userId);
  if (contest.status === ContestStatus.CLOSED) {
    throw new BadRequestError('Cannot edit a closed contest');
  }

  const data = createContestSchema.partial().parse(body);

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

  return updated;
}

export async function deleteContest(id: string, userId: string, userRole: string) {
  const contest = await prisma.contest.findUnique({ where: { id } });
  if (!contest) throw new NotFoundError('Contest');
  if (contest.clientId !== userId && userRole !== Role.ADMIN) {
    throw new ForbiddenError('Access denied');
  }

  await prisma.contest.delete({ where: { id } });
}

async function changeContestStatus(id: string, userId: string, newStatus: ContestStatus, allowedFrom: ContestStatus[]) {
  const contest = await assertContestOwner(id, userId);

  if (!allowedFrom.includes(contest.status)) {
    throw new BadRequestError(`Cannot change status from ${contest.status} to ${newStatus}`);
  }

  const updated = await prisma.contest.update({ where: { id }, data: { status: newStatus }, include: CONTEST_INCLUDE });

  getIO().to(`contest:${id}`).emit('contest:status_changed', { contestId: id, status: newStatus });

  return updated;
}

export const publishContest = (id: string, userId: string) =>
  changeContestStatus(id, userId, ContestStatus.PUBLISHED, [ContestStatus.DRAFT, ContestStatus.PAUSED]);

export const pauseContest = (id: string, userId: string) =>
  changeContestStatus(id, userId, ContestStatus.PAUSED, [ContestStatus.PUBLISHED]);

export const closeContest = (id: string, userId: string) =>
  changeContestStatus(id, userId, ContestStatus.CLOSED, [ContestStatus.PUBLISHED, ContestStatus.PAUSED]);

export const reopenContest = (id: string, userId: string) =>
  changeContestStatus(id, userId, ContestStatus.PUBLISHED, [ContestStatus.PAUSED, ContestStatus.CLOSED]);

export async function duplicateContest(id: string, userId: string) {
  const contest = await assertContestOwner(id, userId);

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

  return duplicated;
}

export async function joinContest(id: string, user: { id: string; role: string }) {
  if (user.role !== Role.FREELANCER) {
    throw new ForbiddenError('Only freelancers can join contests');
  }

  const contest = await prisma.contest.findUnique({
    where: { id },
    include: { _count: { select: { participants: true } } },
  });
  if (!contest) throw new NotFoundError('Contest');
  if (contest.status !== ContestStatus.PUBLISHED) {
    throw new BadRequestError('Contest is not open for registration');
  }
  if (new Date() > contest.registrationDeadline) {
    throw new BadRequestError('Registration deadline has passed');
  }
  if (contest.maxParticipants && contest._count.participants >= contest.maxParticipants) {
    throw new BadRequestError('Contest is full');
  }

  const existing = await prisma.contestParticipant.findUnique({
    where: { contestId_userId: { contestId: id, userId: user.id } },
  });
  if (existing) throw new BadRequestError('You are already participating in this contest');

  const [participant] = await prisma.$transaction([
    prisma.contestParticipant.create({ data: { contestId: id, userId: user.id } }),
    prisma.user.update({ where: { id: user.id }, data: { contestParticipations: { increment: 1 } } }),
  ]);

  await awardExp(user.id, 'CONTEST_JOIN', `Joined contest: ${contest.title}`);

  const count = await prisma.contestParticipant.count({ where: { contestId: id } });
  getIO().to(`contest:${id}`).emit('contest:participant_joined', { contestId: id, count });

  return participant;
}

export async function leaveContest(id: string, userId: string) {
  const participant = await prisma.contestParticipant.findUnique({
    where: { contestId_userId: { contestId: id, userId } },
  });
  if (!participant) throw new NotFoundError('Participation');

  const hasSubmission = await prisma.contestSubmission.findUnique({
    where: { contestId_participantId: { contestId: id, participantId: userId } },
  });
  if (hasSubmission) throw new BadRequestError('Cannot leave a contest you have already submitted to');

  await prisma.$transaction([
    prisma.contestParticipant.delete({ where: { contestId_userId: { contestId: id, userId } } }),
    prisma.user.update({ where: { id: userId }, data: { contestParticipations: { decrement: 1 } } }),
  ]);

  return { message: 'Left contest successfully' };
}

export async function listParticipants(id: string) {
  const participants = await prisma.contestParticipant.findMany({
    where: { contestId: id },
    include: { user: { select: { id: true, name: true, avatar: true, role: true } } },
    orderBy: { joinedAt: 'desc' },
  });

  return participants;
}

export async function submitEntry(id: string, userId: string, body: unknown) {
  const contest = await prisma.contest.findUnique({ where: { id } });
  if (!contest) throw new NotFoundError('Contest');
  if (contest.status !== ContestStatus.PUBLISHED) {
    throw new BadRequestError('Contest is not accepting submissions');
  }
  if (new Date() > contest.submissionDeadline) {
    throw new ForbiddenError('Submission deadline has passed');
  }

  const isParticipant = await prisma.contestParticipant.findUnique({
    where: { contestId_userId: { contestId: id, userId } },
  });
  if (!isParticipant) throw new ForbiddenError('You must join the contest before submitting');

  const existingSubmission = await prisma.contestSubmission.findUnique({
    where: { contestId_participantId: { contestId: id, participantId: userId } },
  });
  if (existingSubmission) throw new BadRequestError('You have already submitted an entry. Use PUT to update it.');

  const data = submitEntrySchema.parse(body);

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

  await createNotification({
    userId: contest.clientId,
    type: 'SYSTEM',
    title: 'New Submission Received',
    message: `A new submission was received for your contest "${contest.title}".`,
    link: `/contests/${contest.id}/submissions`,
  });

  const count = await prisma.contestSubmission.count({ where: { contestId: id } });
  getIO().to(`contest:${id}`).emit('contest:submission_received', { contestId: id, count });

  return submission;
}

export async function updateSubmission(id: string, userId: string, body: unknown) {
  const contest = await prisma.contest.findUnique({ where: { id } });
  if (!contest) throw new NotFoundError('Contest');
  if (new Date() > contest.submissionDeadline) {
    throw new ForbiddenError('Submission deadline has passed');
  }

  const submission = await prisma.contestSubmission.findUnique({
    where: { contestId_participantId: { contestId: id, participantId: userId } },
  });
  if (!submission) throw new NotFoundError('Submission');

  const data = submitEntrySchema.partial().parse(body);
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

  return updated;
}

export async function withdrawSubmission(id: string, userId: string) {
  const contest = await prisma.contest.findUnique({ where: { id } });
  if (!contest) throw new NotFoundError('Contest');
  if (new Date() > contest.submissionDeadline) {
    throw new ForbiddenError('Cannot withdraw after submission deadline');
  }

  const submission = await prisma.contestSubmission.findUnique({
    where: { contestId_participantId: { contestId: id, participantId: userId } },
  });
  if (!submission) throw new NotFoundError('Submission');

  await prisma.contestSubmission.delete({
    where: { contestId_participantId: { contestId: id, participantId: userId } },
  });

  return { message: 'Submission withdrawn' };
}

export async function listSubmissions(id: string, userId: string, userRole: string, filter?: string) {
  const contest = await prisma.contest.findUnique({ where: { id } });
  if (!contest) throw new NotFoundError('Contest');
  if (contest.clientId !== userId && userRole !== Role.ADMIN) {
    throw new ForbiddenError('Only the contest owner can view all submissions');
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

  return submissions;
}

export async function getMySubmission(id: string, userId: string) {
  const participant = await prisma.contestParticipant.findUnique({
    where: { contestId_userId: { contestId: id, userId } },
  });

  if (!participant) {
    return { isParticipant: false, submission: null };
  }

  const submission = await prisma.contestSubmission.findUnique({
    where: { contestId_participantId: { contestId: id, participantId: userId } },
    include: { participant: { select: { id: true, name: true, avatar: true } } },
  });

  return { isParticipant: true, submission };
}

export async function updateSubmissionStatus(id: string, submissionId: string, userId: string, status: ContestSubmissionStatus) {
  await assertContestOwner(id, userId);

  const updated = await prisma.contestSubmission.update({
    where: { id: submissionId },
    data: { status },
    include: { participant: { select: { id: true, name: true, avatar: true } } },
  });

  return updated;
}

export async function selectWinner(id: string, userId: string, body: unknown) {
  const contest = await assertContestOwner(id, userId);

  if (contest.status !== ContestStatus.CLOSED && contest.status !== ContestStatus.PUBLISHED) {
    throw new BadRequestError('Contest must be published or closed to select a winner');
  }

  const { winnerId, runnerUpId } = selectWinnerSchema.parse(body);

  const winnerParticipant = await prisma.contestParticipant.findUnique({
    where: { contestId_userId: { contestId: id, userId: winnerId } },
  });
  if (!winnerParticipant) throw new BadRequestError('Winner must be a contest participant');

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

  await awardExp(winnerId, 'CONTEST_WIN', `Won contest: ${contest.title}`);
  if (runnerUpId) {
    await awardExp(runnerUpId, 'CONTEST_WIN', `Runner-up in contest: ${contest.title}`);
  }

  const participants = await prisma.contestParticipant.findMany({ where: { contestId: id }, select: { userId: true } });
  await prisma.notification.createMany({
    data: participants.map((p) => ({
      userId: p.userId,
      type: 'SYSTEM',
      title: p.userId === winnerId ? 'You won a contest!' : 'Contest winner selected',
      message:
        p.userId === winnerId
          ? `Congratulations! You won the contest "${contest.title}"!`
          : `The winner for contest "${contest.title}" has been announced.`,
      link: `/contests/${contest.slug ?? id}`,
    })),
  });

  getIO().to(`contest:${id}`).emit('contest:winner_selected', { contestId: id, winnerId });

  const updated = await prisma.contest.findUnique({ where: { id }, include: CONTEST_INCLUDE });
  return updated;
}

export async function getClientContests(userId: string, status?: ContestStatus) {
  const where: any = { clientId: userId };
  if (status) where.status = status;

  const contests = await prisma.contest.findMany({
    where,
    include: CONTEST_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });

  return contests;
}

export async function getContestAnalytics(id: string, userId: string) {
  const contest = await assertContestOwner(id, userId);

  const [participantCount, submissionCount, shortlistedCount] = await Promise.all([
    prisma.contestParticipant.count({ where: { contestId: id } }),
    prisma.contestSubmission.count({ where: { contestId: id } }),
    prisma.contestSubmission.count({
      where: { contestId: id, status: ContestSubmissionStatus.SHORTLISTED },
    }),
  ]);

  return {
    viewCount: contest.viewCount,
    participantCount,
    submissionCount,
    shortlistedCount,
    submissionRate: participantCount ? Math.round((submissionCount / participantCount) * 100) : 0,
  };
}

export async function getFreelancerJoinedContests(userId: string) {
  const memberships = await prisma.contestParticipant.findMany({
    where: { userId },
    include: { contest: { include: CONTEST_INCLUDE } },
    orderBy: { joinedAt: 'desc' },
  });
  return memberships.map((m) => m.contest);
}

export async function getFreelancerSavedContests(userId: string) {
  const saved = await prisma.savedContest.findMany({
    where: { userId },
    include: { contest: { include: CONTEST_INCLUDE } },
    orderBy: { createdAt: 'desc' },
  });
  return saved.map((s) => s.contest);
}

export async function toggleSaveContest(id: string, userId: string) {
  const existing = await prisma.savedContest.findUnique({
    where: { userId_contestId: { userId, contestId: id } },
  });

  if (existing) {
    await prisma.savedContest.delete({ where: { userId_contestId: { userId, contestId: id } } });
    return { saved: false };
  } else {
    await prisma.savedContest.create({ data: { userId, contestId: id } });
    return { saved: true };
  }
}

export const updateSubmissionStatusById = updateSubmissionStatus;
