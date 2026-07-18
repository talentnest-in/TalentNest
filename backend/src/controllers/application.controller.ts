import { FastifyRequest, FastifyReply } from 'fastify';
import { applyForJob as svcApplyForJob, getMyApplications as svcGetMyApplications, getApplicationDetails as svcGetApplicationDetails, withdrawApplication as svcWithdrawApplication } from '../services/application.service';
import { AppError } from '../lib/errors';

export const applyForJob = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const result = await svcApplyForJob(request.user.id, request.params.id, request.body);
    return reply.status(201).send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    throw error;
  }
};

export const getMyApplications = async (request: FastifyRequest<{ Querystring: { page?: string; limit?: string; search?: string; status?: string } }>, reply: FastifyReply) => {
  try {
    const result = await svcGetMyApplications(request.user.id, request.query);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    throw error;
  }
};

export const getApplicationDetails = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const result = await svcGetApplicationDetails(request.user.id, request.params.id);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    throw error;
  }
};

export const withdrawApplication = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const result = await svcWithdrawApplication(request.user.id, request.params.id);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    throw error;
  }
};
