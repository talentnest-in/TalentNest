import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { createJob as svcCreateJob, getMyJobs as svcGetMyJobs, getOpenJobs as svcGetOpenJobs, getJob as svcGetJob, updateJob as svcUpdateJob, deleteJob as svcDeleteJob, getRecommendedJobs as svcGetRecommendedJobs } from '../services/job.service';
import { AppError } from '../lib/errors';

const jobIdSchema = z.object({ id: z.string().uuid('Invalid job ID') });

export const createJob = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const result = await svcCreateJob(request.user.id, request.body);
    return reply.status(201).send(result);
  } catch (error) {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ message: error.message });
    }
    request.log.error(error, 'createJob failed');
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};

export const getMyJobs = async (request: FastifyRequest<{ Querystring: { status?: string; search?: string; page?: string; limit?: string } }>, reply: FastifyReply) => {
  try {
    const result = await svcGetMyJobs(request.user.id, request.query);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ message: error.message });
    }
    request.log.error(error, 'getMyJobs failed');
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};

export const getOpenJobs = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const result = await svcGetOpenJobs(request.query as Record<string, string | undefined>);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ message: error.message });
    }
    request.log.error(error);
    return reply.status(500).send({ statusCode: 500, error: 'Internal Server Error' });
  }
};

export const getJob = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const { id } = jobIdSchema.parse(request.params);
    const result = await svcGetJob(id);
    return reply.send(result);
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ statusCode: 400, message: 'Invalid job ID format' });
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ message: error.message });
    }
    request.log.error(error, 'getJob failed');
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};

export const updateJob = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const { id } = jobIdSchema.parse(request.params);
    const result = await svcUpdateJob(id, request.body);
    return reply.send(result);
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ statusCode: 400, message: 'Invalid job ID format' });
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ message: error.message });
    }
    request.log.error(error, 'updateJob failed');
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};

export const deleteJob = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const { id } = jobIdSchema.parse(request.params);
    const result = await svcDeleteJob(id);
    return reply.send(result);
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ statusCode: 400, message: 'Invalid job ID format' });
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ message: error.message });
    }
    request.log.error(error, 'deleteJob failed');
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};

export const getRecommendedJobs = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { limit } = request.query as { limit?: string };
    const result = await svcGetRecommendedJobs(request.user.id, limit);
    return reply.send(result);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ statusCode: 500, error: 'Internal Server Error' });
  }
};
