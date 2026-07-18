import { prisma } from '../lib/prisma';
import { NotFoundError, ForbiddenError, BadRequestError } from '../lib/errors';
import { awardExp } from './gamification.service';

// ── Helpers ──
async function getContractWithDetails(id: string) {
  return prisma.contract.findUnique({
    where: { id },
    include: {
      offer: {
        include: {
          application: {
            include: {
              job: true,
              profile: {
                include: { user: true },
              },
            },
          },
          client: true,
          freelancer: true,
        },
      },
      job: {
        include: {
          clientProfile: {
            include: { company: true },
          },
          skills: true,
        },
      },
      client: true,
      freelancer: true,
    },
  });
}

export async function getContracts(
  userId: string,
  query: { status?: string; page?: string; limit?: string }
) {
  const { status, page = '1', limit = '10' } = query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where: any = {
    OR: [
      { clientId: userId },
      { freelancerId: userId },
    ],
  };

  if (status) {
    where.status = status;
  }

  const [contracts, total] = await Promise.all([
    prisma.contract.findMany({
      where,
      include: {
        offer: {
          include: {
            application: {
              include: { job: true },
            },
          },
        },
        job: {
          include: {
            clientProfile: {
              include: { company: true },
            },
          },
        },
        client: true,
        freelancer: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.contract.count({ where }),
  ]);

  return {
    contracts,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  };
}

export async function getContractDetails(userId: string, contractId: string) {
  const contract = await getContractWithDetails(contractId);

  if (!contract) {
    throw new NotFoundError('Contract');
  }

  if (contract.clientId !== userId && contract.freelancerId !== userId) {
    throw new ForbiddenError('Access denied');
  }

  return { contract };
}

export async function updateContractStatus(userId: string, contractId: string, status: string) {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
  });

  if (!contract) {
    throw new NotFoundError('Contract');
  }

  if (contract.clientId !== userId && contract.freelancerId !== userId) {
    throw new ForbiddenError('Access denied');
  }

  const currentStatus = contract.status;
  const validTransitions: Record<string, string[]> = {
    ACTIVE: ['COMPLETED', 'CANCELLED', 'DISPUTED'],
    COMPLETED: [],
    CANCELLED: [],
    DISPUTED: ['CANCELLED', 'COMPLETED'],
  };

  const allowedTransitions = validTransitions[currentStatus];
  if (!allowedTransitions || !allowedTransitions.includes(status)) {
    throw new BadRequestError(`Cannot transition from ${currentStatus} to ${status}`);
  }

  const updateData: any = { status };

  if (status === 'COMPLETED') {
    updateData.completedAt = new Date();

    await awardExp(contract.freelancerId, 'CONTRACT_COMPLETE', `Completed contract: ${contract.title}`);
    await awardExp(contract.clientId, 'CONTRACT_COMPLETE', `Completed contract: ${contract.title}`);
  } else if (status === 'CANCELLED') {
    updateData.cancelledAt = new Date();
  }

  const updatedContract = await prisma.contract.update({
    where: { id: contractId },
    data: updateData,
    include: {
      offer: {
        include: {
          application: {
            include: { job: true },
          },
        },
      },
      job: {
        include: {
          clientProfile: {
            include: { company: true },
          },
        },
      },
      client: true,
      freelancer: true,
    },
  });

  return { contract: updatedContract };
}
