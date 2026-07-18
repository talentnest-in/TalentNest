import { FastifyRequest, FastifyReply } from 'fastify';
import { createJob as svcCreateJob, getMyJobs as svcGetMyJobs, getOpenJobs as svcGetOpenJobs, getJob as svcGetJob, updateJob as svcUpdateJob, deleteJob as svcDeleteJob, getRecommendedJobs as svcGetRecommendedJobs } from '../services/job.service';
import { AppError } from '../lib/errors';

export const createJob = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const result = await svcCreateJob(request.user.id, request.body);
    return reply.status(201).send(result);
  } catch (error) {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ message: error.message });
    }
    throw error;
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
    throw error;
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
    const result = await svcGetJob(request.params.id);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ message: error.message });
    }
    throw error;
  }
};

export const updateJob = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const result = await svcUpdateJob(request.params.id, request.body);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ message: error.message });
    }
    throw error;
  }
};

export const deleteJob = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const result = await svcDeleteJob(request.params.id);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ message: error.message });
    }
    throw error;
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
