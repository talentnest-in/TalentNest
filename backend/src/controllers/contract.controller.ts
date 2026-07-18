import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { getContracts as svcGetContracts, getContractDetails as svcGetContractDetails, updateContractStatus as svcUpdateContractStatus } from '../services/contract.service';
import { AppError } from '../lib/errors';

const updateContractStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED', 'DISPUTED']),
});

export const getContracts = async (request: FastifyRequest<{ Querystring: { status?: string; page?: string; limit?: string } }>, reply: FastifyReply) => {
  try {
    const result = await svcGetContracts(request.user.id, request.query);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    throw error;
  }
};

export const getContractDetails = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const result = await svcGetContractDetails(request.user.id, request.params.id);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    throw error;
  }
};

export const updateContractStatus = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const { status } = updateContractStatusSchema.parse(request.body);
    const result = await svcUpdateContractStatus(request.user.id, request.params.id, status);
    return reply.send(result);
  } catch (error) {
    if (error instanceof z.ZodError) throw error;
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    throw error;
  }
};
