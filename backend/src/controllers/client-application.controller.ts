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
    request.log.error(error, 'getAllClientApplicants failed');
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};

export const getJobApplicants = async (request: FastifyRequest<{ Params: { jobId: string }; Querystring: { page?: string; limit?: string; search?: string; status?: string } }>, reply: FastifyReply) => {
  try {
    const jobId = z.string().uuid('Invalid job ID').parse(request.params.jobId);
    const result = await svcGetJobApplicants(request.user.id, jobId, request.query);
    return reply.send(result);
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ message: 'Invalid job ID format' });
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    request.log.error(error, 'getJobApplicants failed');
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};

export const getApplicantDetails = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const id = z.string().uuid('Invalid application ID').parse(request.params.id);
    const result = await svcGetApplicantDetails(request.user.id, id);
    return reply.send(result);
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ message: 'Invalid application ID format' });
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    request.log.error(error, 'getApplicantDetails failed');
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};

export const updateApplicationStatus = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const id = z.string().uuid('Invalid application ID').parse(request.params.id);
    const body = updateStatusSchema.parse(request.body);
    const result = await svcUpdateApplicationStatus(request.user.id, id, body);
    return reply.send(result);
  } catch (error) {
    if (error instanceof z.ZodError) throw error;
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    request.log.error(error, 'updateApplicationStatus failed');
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};
