import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

// ── Validation Schemas ───────────────────────────────────────────────────────
const createNoteSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
});

const updateNoteSchema = createNoteSchema.partial();

// ── Get Notes ─────────────────────────────────────────────────────────────
export const getNotes = async (request: FastifyRequest<{ Params: { contractId: string } }>, reply: FastifyReply) => {
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

    const notes = await prisma.note.findMany({
      where: { contractId },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send(notes);
  } catch (error) {
    request.log.error(error, 'getNotes failed');
    return reply.status(500).send({ error: 'Failed to fetch notes' });
  }
};

// ── Create Note ───────────────────────────────────────────────────────────
export const createNote = async (
  request: FastifyRequest<{ Params: { contractId: string }; Body: z.infer<typeof createNoteSchema> }>,
  reply: FastifyReply
) => {
  try {
    const { contractId } = request.params;
    const userId = request.user.id;
    const data = createNoteSchema.parse(request.body);

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

    const note = await prisma.note.create({
      data: {
        contractId,
        ...data,
      },
    });

    return reply.status(201).send(note);
  } catch (error) {
    request.log.error(error, 'createNote failed');
    return reply.status(500).send({ error: 'Failed to create note' });
  }
};

// ── Update Note ───────────────────────────────────────────────────────────
export const updateNote = async (
  request: FastifyRequest<{
    Params: { contractId: string; id: string };
    Body: z.infer<typeof updateNoteSchema>;
  }>,
  reply: FastifyReply
) => {
  try {
    const { contractId, id } = request.params;
    const userId = request.user.id;
    const data = updateNoteSchema.parse(request.body);

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

    const note = await prisma.note.findUnique({
      where: { id },
    });

    if (!note) {
      return reply.status(404).send({ error: 'Note not found' });
    }

    if (note.contractId !== contractId) {
      return reply.status(400).send({ error: 'Note does not belong to this contract' });
    }

    const updated = await prisma.note.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.content && { content: data.content }),
      },
    });

    return reply.send(updated);
  } catch (error) {
    request.log.error(error, 'updateNote failed');
    return reply.status(500).send({ error: 'Failed to update note' });
  }
};

// ── Delete Note ───────────────────────────────────────────────────────────
export const deleteNote = async (
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

    const note = await prisma.note.findUnique({
      where: { id },
    });

    if (!note) {
      return reply.status(404).send({ error: 'Note not found' });
    }

    if (note.contractId !== contractId) {
      return reply.status(400).send({ error: 'Note does not belong to this contract' });
    }

    await prisma.note.delete({
      where: { id },
    });

    return reply.send({ success: true });
  } catch (error) {
    request.log.error(error, 'deleteNote failed');
    return reply.status(500).send({ error: 'Failed to delete note' });
  }
};
