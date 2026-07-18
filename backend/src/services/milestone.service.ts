import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { NotFoundError, ForbiddenError, BadRequestError } from '../lib/errors';

const createMilestoneSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED']).optional(),
  amount: z.number().min(0).optional().default(0),
  order: z.number().optional(),
});

const updateMilestoneSchema = createMilestoneSchema.partial();

async function verifyContractAccess(contractId: string, userId: string) {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
  });

  if (!contract) {
    throw new NotFoundError('Contract');
  }

  if (contract.clientId !== userId && contract.freelancerId !== userId) {
    throw new ForbiddenError('Unauthorized');
  }

  return contract;
}

export async function getMilestones(contractId: string, userId: string) {
  await verifyContractAccess(contractId, userId);

  return prisma.milestone.findMany({
    where: { contractId },
    orderBy: { order: 'asc' },
  });
}

export async function createMilestone(contractId: string, userId: string, body: unknown) {
  await verifyContractAccess(contractId, userId);

  const data = createMilestoneSchema.parse(body);

  return prisma.milestone.create({
    data: {
      contractId,
      title: data.title,
      description: data.description || null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      amount: data.amount,
      ...(data.status && { status: data.status }),
      ...(data.order !== undefined && { order: data.order }),
    },
  });
}

export async function updateMilestone(contractId: string, id: string, userId: string, body: unknown) {
  await verifyContractAccess(contractId, userId);

  const data = updateMilestoneSchema.parse(body);

  const milestone = await prisma.milestone.findUnique({
    where: { id },
  });

  if (!milestone) {
    throw new NotFoundError('Milestone');
  }

  if (milestone.contractId !== contractId) {
    throw new BadRequestError('Milestone does not belong to this contract');
  }

  return prisma.milestone.update({
    where: { id },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.description !== undefined && { description: data.description || null }),
      ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
      ...(data.amount !== undefined && { amount: data.amount }),
      ...(data.status && { status: data.status }),
      ...(data.order !== undefined && { order: data.order }),
    },
  });
}

export async function deleteMilestone(contractId: string, id: string, userId: string) {
  await verifyContractAccess(contractId, userId);

  const milestone = await prisma.milestone.findUnique({
    where: { id },
  });

  if (!milestone) {
    throw new NotFoundError('Milestone');
  }

  if (milestone.contractId !== contractId) {
    throw new BadRequestError('Milestone does not belong to this contract');
  }

  await prisma.milestone.delete({
    where: { id },
  });
}

export async function fundMilestone(contractId: string, id: string, userId: string) {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
  });

  if (!contract || contract.clientId !== userId) {
    throw new ForbiddenError('Only the client can fund a milestone');
  }

  const milestone = await prisma.milestone.findUnique({
    where: { id },
  });

  if (!milestone || milestone.contractId !== contractId) {
    throw new NotFoundError('Milestone');
  }

  if (milestone.isFunded) {
    throw new BadRequestError('Milestone is already funded');
  }

  return prisma.milestone.update({
    where: { id },
    data: { isFunded: true },
  });
}

export async function releaseMilestone(contractId: string, id: string, userId: string) {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
  });

  if (!contract || contract.clientId !== userId) {
    throw new ForbiddenError('Only the client can release funds');
  }

  const milestone = await prisma.milestone.findUnique({
    where: { id },
  });

  if (!milestone || milestone.contractId !== contractId) {
    throw new NotFoundError('Milestone');
  }

  if (!milestone.isFunded) {
    throw new BadRequestError('Milestone must be funded before releasing');
  }

  if (milestone.isPaid) {
    throw new BadRequestError('Milestone is already paid');
  }

  return prisma.milestone.update({
    where: { id },
    data: {
      isPaid: true,
      status: 'COMPLETED',
    },
  });
}
