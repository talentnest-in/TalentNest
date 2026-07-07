import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

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

async function getOrCreateClientProfile(userId: string) {
  return prisma.clientProfile.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

const jobInclude = { skills: true };
const jobIncludeFull = { skills: true, clientProfile: { include: { company: true } } };

export const createJob = async (request: FastifyRequest, reply: FastifyReply) => {
  const { skills, ...rest } = jobSchema.parse(request.body);
  const profile = await getOrCreateClientProfile(request.user.id);

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
  return reply.status(201).send({ job });
};

export const getMyJobs = async (
  request: FastifyRequest<{ Querystring: { status?: string; search?: string; page?: string; limit?: string } }>,
  reply: FastifyReply
) => {
  const { status, search, page = '1', limit = '10' } = request.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);
  
  const profile = await prisma.clientProfile.findUnique({ where: { userId: request.user.id } });
  if (!profile) return reply.send({ jobs: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } });

  const where = {
    clientProfileId: profile.id,
    ...(status ? { status: status as any } : {}),
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
  
  return reply.send({
    jobs,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
};

// ── Freelancer Marketplace ────────────────────────────────────────────────────
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

export const getOpenJobs = async (
  request: FastifyRequest<{ Querystring: any }>,
  reply: FastifyReply
) => {
  const query = marketplaceQuerySchema.parse(request.query);
  const { search, type, skills, minBudget, maxBudget, isRemote, datePosted, sortBy, page } = query;
  
  const take = 12;
  const skip = (parseInt(page ?? '1') - 1) * take;

  const skillList = skills ? skills.split(',').map((s) => s.trim()).filter(Boolean) : [];

  const where: any = {
    status: 'OPEN',
    ...(search ? { 
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    } : {}),
    ...(type ? { type } : {}),
    ...(isRemote !== undefined ? { isRemote: isRemote === 'true' } : {}),
    ...(skillList.length > 0
      ? { skills: { some: { name: { in: skillList, mode: 'insensitive' } } } }
      : {}),
  };

  // Budget filter
  if (minBudget || maxBudget) {
    where.budget = {};
    if (minBudget) where.budget.gte = parseFloat(minBudget);
    if (maxBudget) where.budget.lte = parseFloat(maxBudget);
  }

  // Date posted filter
  if (datePosted && datePosted !== 'any') {
    const now = new Date();
    let dateRange = new Date();
    if (datePosted === '24h') dateRange.setDate(now.getDate() - 1);
    if (datePosted === 'week') dateRange.setDate(now.getDate() - 7);
    if (datePosted === 'month') dateRange.setMonth(now.getMonth() - 1);
    where.createdAt = { gte: dateRange };
  }

  // Sorting
  let orderBy: any = { createdAt: 'desc' };
  if (sortBy === 'oldest') orderBy = { createdAt: 'asc' };
  if (sortBy === 'budget_low') orderBy = { budget: 'asc' };
  if (sortBy === 'budget_high') orderBy = { budget: 'desc' };

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({ where, include: jobIncludeFull, orderBy, take, skip }),
    prisma.job.count({ where }),
  ]);

  return reply.send({ jobs, total, page: parseInt(page ?? '1'), totalPages: Math.ceil(total / take) });
};

export const getJob = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const job = await prisma.job.findUnique({
    where: { id: request.params.id },
    include: jobIncludeFull,
  });
  if (!job) return reply.status(404).send({ message: 'Job not found' });
  return reply.send({ job });
};

export const updateJob = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const { skills, ...rest } = jobSchema.parse(request.body);

  // Delete existing skills and recreate
  await prisma.jobSkill.deleteMany({ where: { jobId: request.params.id } });

  const job = await prisma.job.update({
    where: { id: request.params.id },
    data: {
      ...rest,
      skills: {
        create: skills.map((name) => ({ name })),
      },
    },
    include: jobInclude,
  });
  return reply.send({ job });
};

export const deleteJob = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  await prisma.job.delete({ where: { id: request.params.id } });
  return reply.send({ success: true });
};

// ── Freelancer Job Recommendations ────────────────────────────────────────────
export const getRecommendedJobs = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = request.user.id;
    const { limit = '6' } = request.query as any;
    const limitNum = Math.min(parseInt(limit), 20);

    // Fetch the freelancer's skill names
    const freelancerProfile = await prisma.freelancerProfile.findUnique({
      where: { userId },
      include: { skills: { select: { name: true } } },
    });

    if (!freelancerProfile || freelancerProfile.skills.length === 0) {
      // No skills — return latest open jobs as fallback
      const jobs = await prisma.job.findMany({
        where: { status: 'OPEN' },
        include: jobIncludeFull,
        orderBy: { createdAt: 'desc' },
        take: limitNum,
      });
      return reply.send({ jobs, matched: false });
    }

    const freelancerSkillNames = freelancerProfile.skills.map((s) => s.name.toLowerCase());

    // Fetch all open jobs with their skills
    const openJobs = await prisma.job.findMany({
      where: { status: 'OPEN' },
      include: jobIncludeFull,
      orderBy: { createdAt: 'desc' },
      take: 100, // pool to rank from
    });

    // Rank by skill overlap percentage
    const scored = openJobs.map((job) => {
      const jobSkillNames = job.skills.map((s: any) => s.name.toLowerCase());
      const overlap = jobSkillNames.filter((s: string) => freelancerSkillNames.includes(s)).length;
      const score = jobSkillNames.length > 0 ? overlap / jobSkillNames.length : 0;
      return { job, score, overlap };
    });

    // Sort by score desc, then by date desc for ties
    scored.sort((a, b) => b.score - a.score || 0);

    const recommended = scored.slice(0, limitNum).map((r) => ({ ...r.job, matchScore: r.score, matchedSkills: r.overlap }));

    return reply.send({ jobs: recommended, matched: true });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ statusCode: 500, error: 'Internal Server Error' });
  }
};
