import { FastifyRequest, FastifyReply } from 'fastify';
import { saveJob as svcSaveJob, removeSavedJob as svcRemoveSavedJob, getSavedJobs as svcGetSavedJobs } from '../services/saved-job.service';
import { AppError } from '../lib/errors';

export const saveJob = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const result = await svcSaveJob(request.user.id, request.params.id);
    return reply.status(201).send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    throw error;
  }
};

export const removeSavedJob = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const result = await svcRemoveSavedJob(request.user.id, request.params.id);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    throw error;
  }
};

export const getSavedJobs = async (request: FastifyRequest<{ Querystring: { page?: string; limit?: string } }>, reply: FastifyReply) => {
  try {
    const { page, limit } = request.query;
    const result = await svcGetSavedJobs(request.user.id, page, limit);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    throw error;
  }
};
