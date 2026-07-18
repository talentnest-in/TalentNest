import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { NotFoundError, ForbiddenError, BadRequestError } from '../lib/errors';

const jobSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().min(1, 'Description is required').max(5000, 'Description must be less than 5000 characters'),
  type: z.enum(['FIXED', 'HOURLY']).default('FIXED'),
  budget: z.number().nullable().catch(null),
  status: z.enum(['DRAFT', 'OPEN', 'PAUSED', 'CLOSED']).default('DRAFT'),
  location: z.string().max(200, 'Location must be less than 200 characters').nullable().catch(null),
  isRemote: z.boolean().default(true),
  skills: z.array(z.string().max(50, 'Skill name must be less than 50 characters')).default([]),
});

const jobInclude = { skills: true };
const jobIncludeFull = { skills: true, clientProfile: { include: { company: true } } };

const marketplaceQuerySchema = z.object({
  search: z.string().optional(),
  type: z.enum(['FIXED', 'HOURLY']).optional(),
  skills: z.string().optional(),
  minBudget: z.string().optional(),
  maxBudget: z.string().optional(),
  isRemote: z.string().optional(),
  datePosted: z.enum(['24h', 'week', 'month', 'any']).optional(),
  sortBy: z.enum(['newest', 'oldest', 'budget_low', 'budget_high']).optional(),
  page: z.string().optional(),
});

async function getOrCreateClientProfile(userId: string) {
  return prisma.clientProfile.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

export async function createJob(userId: string, body: unknown) {
  const { skills, ...rest } = jobSchema.parse(body);
  const profile = await getOrCreateClientProfile(userId);

  const job = await prisma.job.create({
    data: {
      ...rest,
      clientProfileId: profile.id,
      skills: {
        create: skills.map((name) => ({ name })),
      },
    },
    include: jobInclude,
  });

  return { job };
}

export async function getMyJobs(
  userId: string,
  query: { status?: string; search?: string; page?: string; limit?: string }
) {
  const { status, search, page = '1', limit = '10' } = query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const profile = await prisma.clientProfile.findUnique({ where: { userId } });
  if (!profile) {
    return { jobs: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } };
  }

  const where: any = {
    clientProfileId: profile.id,
    ...(status ? { status } : {}),
    ...(search ? { title: { contains: search, mode: 'insensitive' as const } } : {}),
  };

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      include: jobInclude,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.job.count({ where }),
  ]);

  return {
    jobs,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  };
}

export async function getOpenJobs(query: Record<string, string | undefined>) {
  const parsed = marketplaceQuerySchema.parse(query);
  const { search, type, skills, minBudget, maxBudget, isRemote, datePosted, sortBy, page } = parsed;

  const take = 12;
  const skip = (parseInt(page ?? '1') - 1) * take;

  const skillList = skills ? skills.split(',').map((s) => s.trim()).filter(Boolean) : [];

  const where: any = {
    status: 'OPEN',
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(type ? { type } : {}),
    ...(isRemote !== undefined ? { isRemote: isRemote === 'true' } : {}),
    ...(skillList.length > 0
      ? { skills: { some: { name: { in: skillList, mode: 'insensitive' } } } }
      : {}),
  };

  if (minBudget || maxBudget) {
    where.budget = {};
    if (minBudget) where.budget.gte = parseFloat(minBudget);
    if (maxBudget) where.budget.lte = parseFloat(maxBudget);
  }

  if (datePosted && datePosted !== 'any') {
    const now = new Date();
    const dateRange = new Date();
    if (datePosted === '24h') dateRange.setDate(now.getDate() - 1);
    if (datePosted === 'week') dateRange.setDate(now.getDate() - 7);
    if (datePosted === 'month') dateRange.setMonth(now.getMonth() - 1);
    where.createdAt = { gte: dateRange };
  }

  let orderBy: any = { createdAt: 'desc' };
  if (sortBy === 'oldest') orderBy = { createdAt: 'asc' };
  if (sortBy === 'budget_low') orderBy = { budget: 'asc' };
  if (sortBy === 'budget_high') orderBy = { budget: 'desc' };

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({ where, include: jobIncludeFull, orderBy, take, skip }),
    prisma.job.count({ where }),
  ]);

  return { jobs, total, page: parseInt(page ?? '1'), totalPages: Math.ceil(total / take) };
}

export async function getJob(jobId: string) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: jobIncludeFull,
  });

  if (!job) throw new NotFoundError('Job');
  return { job };
}

export async function updateJob(jobId: string, body: unknown) {
  const { skills, ...rest } = jobSchema.parse(body);

  await prisma.jobSkill.deleteMany({ where: { jobId } });

  const job = await prisma.job.update({
    where: { id: jobId },
    data: {
      ...rest,
      skills: {
        create: skills.map((name) => ({ name })),
      },
    },
    include: jobInclude,
  });

  return { job };
}

export async function deleteJob(jobId: string) {
  await prisma.job.delete({ where: { id: jobId } });
  return { success: true };
}

export async function getRecommendedJobs(userId: string, limit = '6') {
  const limitNum = Math.min(parseInt(limit), 20);

  const freelancerProfile = await prisma.freelancerProfile.findUnique({
    where: { userId },
    include: { skills: { select: { name: true } } },
  });

  if (!freelancerProfile || freelancerProfile.skills.length === 0) {
    const jobs = await prisma.job.findMany({
      where: { status: 'OPEN' },
      include: jobIncludeFull,
      orderBy: { createdAt: 'desc' },
      take: limitNum,
    });
    return { jobs, matched: false };
  }

  const freelancerSkillNames = freelancerProfile.skills.map((s) => s.name.toLowerCase());

  const openJobs = await prisma.job.findMany({
    where: { status: 'OPEN' },
    include: jobIncludeFull,
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const scored = openJobs.map((job) => {
    const jobSkillNames = job.skills.map((s: any) => s.name.toLowerCase());
    const overlap = jobSkillNames.filter((s: string) => freelancerSkillNames.includes(s)).length;
    const score = jobSkillNames.length > 0 ? overlap / jobSkillNames.length : 0;
    return { job, score, overlap };
  });

  scored.sort((a, b) => b.score - a.score || 0);

  const recommended = scored.slice(0, limitNum).map((r) => ({
    ...r.job,
    matchScore: r.score,
    matchedSkills: r.overlap,
  }));

  return { jobs: recommended, matched: true };
}
