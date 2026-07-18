import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { NotFoundError, ForbiddenError, BadRequestError } from '../lib/errors';

const createNoteSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
});

const updateNoteSchema = createNoteSchema.partial();

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

export async function getNotes(contractId: string, userId: string) {
  await verifyContractAccess(contractId, userId);

  return prisma.note.findMany({
    where: { contractId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createNote(contractId: string, userId: string, body: unknown) {
  await verifyContractAccess(contractId, userId);

  const data = createNoteSchema.parse(body);

  return prisma.note.create({
    data: {
      contractId,
      ...data,
    },
  });
}

export async function updateNote(contractId: string, id: string, userId: string, body: unknown) {
  await verifyContractAccess(contractId, userId);

  const data = updateNoteSchema.parse(body);

  const note = await prisma.note.findUnique({
    where: { id },
  });

  if (!note) {
    throw new NotFoundError('Note');
  }

  if (note.contractId !== contractId) {
    throw new BadRequestError('Note does not belong to this contract');
  }

  return prisma.note.update({
    where: { id },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.content && { content: data.content }),
    },
  });
}

export async function deleteNote(contractId: string, id: string, userId: string) {
  await verifyContractAccess(contractId, userId);

  const note = await prisma.note.findUnique({
    where: { id },
  });

  if (!note) {
    throw new NotFoundError('Note');
  }

  if (note.contractId !== contractId) {
    throw new BadRequestError('Note does not belong to this contract');
  }

  await prisma.note.delete({
    where: { id },
  });
}
