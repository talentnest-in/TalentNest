import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { getAllClientApplicants as svcGetAllClientApplicants, getJobApplicants as svcGetJobApplicants, getApplicantDetails as svcGetApplicantDetails, updateApplicationStatus as svcUpdateApplicationStatus } from '../services/client-application.service';
import { AppError } from '../lib/errors';

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'REVIEWING', 'SHORTLISTED', 'REJECTED', 'HIRED']),
});

export const getAllClientApplicants = async (request: FastifyRequest<{ Querystring: { page?: string; limit?: string; search?: string; status?: string } }>, reply: FastifyReply) => {
  try {
    const result = await svcGetAllClientApplicants(request.user.id, request.query);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    throw error;
  }
};

export const getJobApplicants = async (request: FastifyRequest<{ Params: { jobId: string }; Querystring: { page?: string; limit?: string; search?: string; status?: string } }>, reply: FastifyReply) => {
  try {
    const result = await svcGetJobApplicants(request.user.id, request.params.jobId, request.query);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    throw error;
  }
};

export const getApplicantDetails = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const result = await svcGetApplicantDetails(request.user.id, request.params.id);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    throw error;
  }
};

export const updateApplicationStatus = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const body = updateStatusSchema.parse(request.body);
    const result = await svcUpdateApplicationStatus(request.user.id, request.params.id, body);
    return reply.send(result);
  } catch (error) {
    if (error instanceof z.ZodError) throw error;
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    throw error;
  }
};
