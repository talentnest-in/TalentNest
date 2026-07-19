import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { getContracts as svcGetContracts, getContractDetails as svcGetContractDetails, updateContractStatus as svcUpdateContractStatus } from '../services/contract.service';
import { AppError } from '../lib/errors';
import { sendSuccess, sendError } from '../lib/response';

const contractIdSchema = z.object({ id: z.string().uuid('Invalid contract ID') });

const updateContractStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED', 'DISPUTED']),
});

export const getContracts = async (request: FastifyRequest<{ Querystring: { status?: string; page?: string; limit?: string } }>, reply: FastifyReply) => {
  try {
    const result = await svcGetContracts(request.user.id, request.query);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    request.log.error(error, 'getContracts failed');
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};

export const getContractDetails = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const { id } = contractIdSchema.parse(request.params);
    const result = await svcGetContractDetails(request.user.id, id);
    return sendSuccess(reply, result);
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ statusCode: 400, message: 'Invalid contract ID format' });
    if (error instanceof AppError) return sendError(reply, error.statusCode, error.message);
    request.log.error(error, 'getContractDetails failed');
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};

export const updateContractStatus = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const { id } = contractIdSchema.parse(request.params);
    const { status } = updateContractStatusSchema.parse(request.body);
    const result = await svcUpdateContractStatus(request.user.id, id, status);
    return sendSuccess(reply, result);
  } catch (error) {
    if (error instanceof z.ZodError) throw error;
    if (error instanceof AppError) return sendError(reply, error.statusCode, error.message);
    request.log.error(error, 'updateContractStatus failed');
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};
