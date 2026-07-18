import { FastifyRequest, FastifyReply } from 'fastify';
import { getContractFiles as svcGetContractFiles, createFile as svcCreateFile, deleteFile as svcDeleteFile } from '../services/workspace-file.service';
import { AppError } from '../lib/errors';

export const getContractFiles = async (request: FastifyRequest<{ Params: { contractId: string } }>, reply: FastifyReply) => {
  try {
    const result = await svcGetContractFiles(request.user.id, request.params.contractId);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
    request.log.error(error, 'getContractFiles failed');
    return reply.status(500).send({ error: 'Failed to fetch files' });
  }
};

export const createFile = async (request: FastifyRequest<{ Params: { contractId: string } }>, reply: FastifyReply) => {
  try {
    const result = await svcCreateFile(request.user.id, request.params.contractId, request.body);
    return reply.status(201).send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
    request.log.error(error, 'createFile failed');
    return reply.status(500).send({ error: 'Failed to create file' });
  }
};

export const deleteFile = async (request: FastifyRequest<{ Params: { contractId: string; id: string } }>, reply: FastifyReply) => {
  try {
    const result = await svcDeleteFile(request.user.id, request.params.contractId, request.params.id);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
    request.log.error(error, 'deleteFile failed');
    return reply.status(500).send({ error: 'Failed to delete file' });
  }
};
