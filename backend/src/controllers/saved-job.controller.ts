import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { saveJob as svcSaveJob, removeSavedJob as svcRemoveSavedJob, getSavedJobs as svcGetSavedJobs } from '../services/saved-job.service';
import { AppError } from '../lib/errors';

const jobIdSchema = z.object({ id: z.string().uuid('Invalid job ID') });

export const saveJob = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const { id } = jobIdSchema.parse(request.params);
    const result = await svcSaveJob(request.user.id, id);
    return reply.status(201).send(result);
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ statusCode: 400, message: 'Invalid job ID format' });
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    request.log.error(error, 'saveJob failed');
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};

export const removeSavedJob = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const { id } = jobIdSchema.parse(request.params);
    const result = await svcRemoveSavedJob(request.user.id, id);
    return reply.send(result);
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ statusCode: 400, message: 'Invalid job ID format' });
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    request.log.error(error, 'removeSavedJob failed');
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};

export const getSavedJobs = async (request: FastifyRequest<{ Querystring: { page?: string; limit?: string } }>, reply: FastifyReply) => {
  try {
    const { page, limit } = request.query;
    const result = await svcGetSavedJobs(request.user.id, page, limit);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    request.log.error(error, 'getSavedJobs failed');
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};
