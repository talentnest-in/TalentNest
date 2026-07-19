import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { getContractFiles as svcGetContractFiles, createFile as svcCreateFile, deleteFile as svcDeleteFile } from '../services/workspace-file.service';
import { AppError } from '../lib/errors';

const uuidSchema = z.string().uuid('Invalid ID format');

export const getContractFiles = async (request: FastifyRequest<{ Params: { contractId: string } }>, reply: FastifyReply) => {
  try {
    const contractId = uuidSchema.parse(request.params.contractId);
    const result = await svcGetContractFiles(contractId, request.user.id);
    return reply.send(result);
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ error: 'Invalid contract ID format' });
    if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
    request.log.error(error, 'getContractFiles failed');
    return reply.status(500).send({ error: 'Failed to fetch files' });
  }
};

export const createFile = async (request: FastifyRequest<{ Params: { contractId: string } }>, reply: FastifyReply) => {
  try {
    const contractId = uuidSchema.parse(request.params.contractId);
    const result = await svcCreateFile(contractId, request.user.id, request.body);
    return reply.status(201).send(result);
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ error: 'Invalid contract ID format' });
    if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
    request.log.error(error, 'createFile failed');
    return reply.status(500).send({ error: 'Failed to create file' });
  }
};

export const deleteFile = async (request: FastifyRequest<{ Params: { contractId: string; id: string } }>, reply: FastifyReply) => {
  try {
    const contractId = uuidSchema.parse(request.params.contractId);
    const id = uuidSchema.parse(request.params.id);
    const result = await svcDeleteFile(contractId, id, request.user.id);
    return reply.send(result);
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ error: 'Invalid contract or file ID format' });
    if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
    request.log.error(error, 'deleteFile failed');
    return reply.status(500).send({ error: 'Failed to delete file' });
  }
};
