import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

// ── Validation Schemas ──
const updateContractStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED', 'DISPUTED']),
});

type UpdateContractStatusInput = z.infer<typeof updateContractStatusSchema>;

// ── Helpers ────────────────────────────────────────────────────────────────────
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
                include: {
                  user: true,
                },
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
            include: {
              company: true,
            },
          },
          skills: true,
        },
      },
      client: true,
      freelancer: true,
    },
  });
}

// ── Get Contracts (Shared for both Client and Freelancer) ───────────────────────────
export const getContracts = async (
  request: FastifyRequest<{ Querystring: { status?: string; page?: string; limit?: string } }>,
  reply: FastifyReply
) => {
  const userId = request.user.id;
  const { status, page = '1', limit = '10' } = request.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  // Get contracts where user is either client or freelancer
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
              include: {
                job: true,
              },
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

  return reply.send({
    contracts,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
};

// ── Get Contract Details ─────────────────────────────────────────────────────────
export const getContractDetails = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const userId = request.user.id;
  const { id } = request.params;

  const contract = await getContractWithDetails(id);

  if (!contract) {
    return reply.status(404).send({ message: 'Contract not found' });
  }

  // Verify user is either the client or freelancer
  if (contract.clientId !== userId && contract.freelancerId !== userId) {
    return reply.status(403).send({ message: 'Access denied' });
  }

  return reply.send({ contract });
};

// ── Update Contract Status ───────────────────────────────────────────────────────
export const updateContractStatus = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const userId = request.user.id;
  const { id } = request.params;
  const { status } = updateContractStatusSchema.parse(request.body);

  const contract = await prisma.contract.findUnique({
    where: { id },
  });

  if (!contract) {
    return reply.status(404).send({ message: 'Contract not found' });
  }

  // Verify user is either the client or freelancer
  if (contract.clientId !== userId && contract.freelancerId !== userId) {
    return reply.status(403).send({ message: 'Access denied' });
  }

  // Validate status transitions
  const currentStatus = contract.status;
  const validTransitions: Record<string, string[]> = {
    ACTIVE: ['COMPLETED', 'CANCELLED', 'DISPUTED'],
    COMPLETED: [],
    CANCELLED: [],
    DISPUTED: ['CANCELLED', 'COMPLETED'],
  };

  const allowedTransitions = validTransitions[currentStatus];
  if (!allowedTransitions || !allowedTransitions.includes(status)) {
    return reply.status(400).send({ message: `Cannot transition from ${currentStatus} to ${status}` });
  }

  const updateData: any = { status };

  if (status === 'COMPLETED') {
    updateData.completedAt = new Date();
  } else if (status === 'CANCELLED') {
    updateData.cancelledAt = new Date();
  }

  const updatedContract = await prisma.contract.update({
    where: { id },
    data: updateData,
    include: {
      offer: {
        include: {
          application: {
            include: {
              job: true,
            },
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
        },
      },
      client: true,
      freelancer: true,
    },
  });

  return reply.send({ contract: updatedContract });
};
