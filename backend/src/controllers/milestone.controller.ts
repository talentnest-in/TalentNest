import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

// ── Validation Schemas ───────────────────────────────────────────────────────
const createMilestoneSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED']).optional(),
  order: z.number().optional(),
});

const updateMilestoneSchema = createMilestoneSchema.partial();

// ── Get Milestones ─────────────────────────────────────────────────────────
export const getMilestones = async (request: FastifyRequest<{ Params: { contractId: string } }>, reply: FastifyReply) => {
  try {
    const { contractId } = request.params;
    const userId = request.user.id;

    // Verify user belongs to this contract
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      return reply.status(404).send({ error: 'Contract not found' });
    }

    if (contract.clientId !== userId && contract.freelancerId !== userId) {
      return reply.status(403).send({ error: 'Unauthorized' });
    }

    const milestones = await prisma.milestone.findMany({
      where: { contractId },
      orderBy: { order: 'asc' },
    });

    return reply.send(milestones);
  } catch (error) {
    request.log.error(error, 'getMilestones failed');
    return reply.status(500).send({ error: 'Failed to fetch milestones' });
  }
};

// ── Create Milestone ───────────────────────────────────────────────────────
export const createMilestone = async (
  request: FastifyRequest<{ Params: { contractId: string }; Body: z.infer<typeof createMilestoneSchema> }>,
  reply: FastifyReply
) => {
  try {
    const { contractId } = request.params;
    const userId = request.user.id;
    const data = createMilestoneSchema.parse(request.body);

    // Verify user belongs to this contract
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      return reply.status(404).send({ error: 'Contract not found' });
    }

    if (contract.clientId !== userId && contract.freelancerId !== userId) {
      return reply.status(403).send({ error: 'Unauthorized' });
    }

    const milestone = await prisma.milestone.create({
      data: {
        contractId,
        title: data.title,
        description: data.description || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        ...(data.status && { status: data.status }),
        ...(data.order !== undefined && { order: data.order }),
      },
    });

    return reply.status(201).send(milestone);
  } catch (error) {
    request.log.error(error, 'createMilestone failed');
    return reply.status(500).send({ error: 'Failed to create milestone' });
  }
};

// ── Update Milestone ───────────────────────────────────────────────────────
export const updateMilestone = async (
  request: FastifyRequest<{
    Params: { contractId: string; id: string };
    Body: z.infer<typeof updateMilestoneSchema>;
  }>,
  reply: FastifyReply
) => {
  try {
    const { contractId, id } = request.params;
    const userId = request.user.id;
    const data = updateMilestoneSchema.parse(request.body);

    // Verify user belongs to this contract
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      return reply.status(404).send({ error: 'Contract not found' });
    }

    if (contract.clientId !== userId && contract.freelancerId !== userId) {
      return reply.status(403).send({ error: 'Unauthorized' });
    }

    const milestone = await prisma.milestone.findUnique({
      where: { id },
    });

    if (!milestone) {
      return reply.status(404).send({ error: 'Milestone not found' });
    }

    if (milestone.contractId !== contractId) {
      return reply.status(400).send({ error: 'Milestone does not belong to this contract' });
    }

    const updated = await prisma.milestone.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description || null }),
        ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
        ...(data.status && { status: data.status }),
        ...(data.order !== undefined && { order: data.order }),
      },
    });

    return reply.send(updated);
  } catch (error) {
    request.log.error(error, 'updateMilestone failed');
    return reply.status(500).send({ error: 'Failed to update milestone' });
  }
};

// ── Delete Milestone ───────────────────────────────────────────────────────
export const deleteMilestone = async (
  request: FastifyRequest<{ Params: { contractId: string; id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { contractId, id } = request.params;
    const userId = request.user.id;

    // Verify user belongs to this contract
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      return reply.status(404).send({ error: 'Contract not found' });
    }

    if (contract.clientId !== userId && contract.freelancerId !== userId) {
      return reply.status(403).send({ error: 'Unauthorized' });
    }

    const milestone = await prisma.milestone.findUnique({
      where: { id },
    });

    if (!milestone) {
      return reply.status(404).send({ error: 'Milestone not found' });
    }

    if (milestone.contractId !== contractId) {
      return reply.status(400).send({ error: 'Milestone does not belong to this contract' });
    }

    await prisma.milestone.delete({
      where: { id },
    });

    return reply.send({ success: true });
  } catch (error) {
    request.log.error(error, 'deleteMilestone failed');
    return reply.status(500).send({ error: 'Failed to delete milestone' });
  }
};
