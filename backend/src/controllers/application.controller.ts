import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { applyForJob as svcApplyForJob, getMyApplications as svcGetMyApplications, getApplicationDetails as svcGetApplicationDetails, withdrawApplication as svcWithdrawApplication } from '../services/application.service';
import { AppError } from '../lib/errors';

const appIdSchema = z.object({ id: z.string().uuid('Invalid application ID') });

export const applyForJob = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const { id } = appIdSchema.parse(request.params);
    const result = await svcApplyForJob(request.user.id, id, request.body);
    return reply.status(201).send(result);
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ statusCode: 400, message: 'Invalid job ID format' });
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    request.log.error(error, 'applyForJob failed');
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};

export const getMyApplications = async (request: FastifyRequest<{ Querystring: { page?: string; limit?: string; search?: string; status?: string } }>, reply: FastifyReply) => {
  try {
    const result = await svcGetMyApplications(request.user.id, request.query);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    request.log.error(error, 'getMyApplications failed');
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};

export const getApplicationDetails = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const { id } = appIdSchema.parse(request.params);
    const result = await svcGetApplicationDetails(request.user.id, id);
    return reply.send(result);
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ statusCode: 400, message: 'Invalid application ID format' });
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    request.log.error(error, 'getApplicationDetails failed');
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};

export const withdrawApplication = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const { id } = appIdSchema.parse(request.params);
    const result = await svcWithdrawApplication(request.user.id, id);
    return reply.send(result);
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ statusCode: 400, message: 'Invalid application ID format' });
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    request.log.error(error, 'withdrawApplication failed');
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};
