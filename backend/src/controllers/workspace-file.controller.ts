import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import path from 'path';
import fs from 'fs/promises';

// ── Validation Schemas ───────────────────────────────────────────────────────
const createFileSchema = z.object({
  fileName: z.string().min(1),
  fileUrl: z.string().url(),
  mimeType: z.string().min(1),
  size: z.number().positive(),
});

// ── Get Files for Contract ─────────────────────────────────────────────────────
export const getContractFiles = async (
  request: FastifyRequest<{ Params: { contractId: string } }>,
  reply: FastifyReply
) => {
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

    const files = await prisma.workspaceFile.findMany({
      where: { contractId },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send(files);
  } catch (error) {
    request.log.error(error, 'getContractFiles failed');
    return reply.status(500).send({ error: 'Failed to fetch files' });
  }
};

// ── Create File ─────────────────────────────────────────────────────────────
export const createFile = async (
  request: FastifyRequest<{
    Params: { contractId: string };
    Body: z.infer<typeof createFileSchema> & { conversationId?: string };
  }>,
  reply: FastifyReply
) => {
  try {
    const { contractId } = request.params;
    const userId = request.user.id;
    const data = createFileSchema.parse(request.body);

    // Verify user belongs to this contract
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        conversation: true,
      },
    });

    if (!contract) {
      return reply.status(404).send({ error: 'Contract not found' });
    }

    if (contract.clientId !== userId && contract.freelancerId !== userId) {
      return reply.status(403).send({ error: 'Unauthorized' });
    }

    const file = await prisma.workspaceFile.create({
      data: {
        contractId,
        conversationId: contract.conversation?.id || null,
        uploaderId: userId,
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        mimeType: data.mimeType,
        size: data.size,
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    return reply.status(201).send(file);
  } catch (error) {
    request.log.error(error, 'createFile failed');
    return reply.status(500).send({ error: 'Failed to create file' });
  }
};

// ── Delete File ─────────────────────────────────────────────────────────────
export const deleteFile = async (
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

    const file = await prisma.workspaceFile.findUnique({
      where: { id },
    });

    if (!file) {
      return reply.status(404).send({ error: 'File not found' });
    }

    if (file.contractId !== contractId) {
      return reply.status(400).send({ error: 'File does not belong to this contract' });
    }

    // Only uploader can delete
    if (file.uploaderId !== userId) {
      return reply.status(403).send({ error: 'Only the uploader can delete this file' });
    }

    // Delete physical file
    try {
      const filePath = path.join(process.cwd(), 'uploads', file.fileName);
      await fs.unlink(filePath);
    } catch (err) {
      // File might not exist, continue with database deletion
      request.log.warn('Physical file not found, deleting database record only');
    }

    await prisma.workspaceFile.delete({
      where: { id },
    });

    return reply.send({ success: true });
  } catch (error) {
    request.log.error(error, 'deleteFile failed');
    return reply.status(500).send({ error: 'Failed to delete file' });
  }
};
