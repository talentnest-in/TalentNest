import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { deleteFromCloudinary } from '../lib/cloudinary';
import { NotFoundError, ForbiddenError, BadRequestError } from '../lib/errors';

const createFileSchema = z.object({
  fileName: z.string().min(1),
  fileUrl: z.string().url(),
  publicId: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().positive(),
});

export async function getContractFiles(contractId: string, userId: string) {
  const contract = await prisma.contract.findUnique({ where: { id: contractId } });
  if (!contract) throw new NotFoundError('Contract');
  if (contract.clientId !== userId && contract.freelancerId !== userId) {
    throw new ForbiddenError('Unauthorized');
  }

  const files = await prisma.workspaceFile.findMany({
    where: { contractId },
    include: {
      uploader: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return files;
}

export async function createFile(contractId: string, userId: string, body: unknown) {
  const data = createFileSchema.parse(body);

  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: { conversation: true },
  });

  if (!contract) throw new NotFoundError('Contract');
  if (contract.clientId !== userId && contract.freelancerId !== userId) {
    throw new ForbiddenError('Unauthorized');
  }

  const file = await prisma.workspaceFile.create({
    data: {
      contractId,
      conversationId: contract.conversation?.id || null,
      uploaderId: userId,
      fileName: data.fileName,
      fileUrl: data.fileUrl,
      publicId: data.publicId,
      mimeType: data.mimeType,
      size: data.size,
    },
    include: {
      uploader: { select: { id: true, name: true, avatar: true } },
    },
  });

  return file;
}

export async function deleteFile(contractId: string, id: string, userId: string) {
  const contract = await prisma.contract.findUnique({ where: { id: contractId } });
  if (!contract) throw new NotFoundError('Contract');
  if (contract.clientId !== userId && contract.freelancerId !== userId) {
    throw new ForbiddenError('Unauthorized');
  }

  const file = await prisma.workspaceFile.findUnique({ where: { id } });
  if (!file) throw new NotFoundError('File');
  if (file.contractId !== contractId) {
    throw new BadRequestError('File does not belong to this contract');
  }
  if (file.uploaderId !== userId) {
    throw new ForbiddenError('Only the uploader can delete this file');
  }

  if (file.publicId) {
    try {
      await deleteFromCloudinary(file.publicId);
    } catch (err) {
      // Log warning but continue with DB deletion
    }
  }

  await prisma.workspaceFile.delete({ where: { id } });

  return { success: true };
}
