import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { getMilestones as svcGetMilestones, createMilestone as svcCreateMilestone, updateMilestone as svcUpdateMilestone, deleteMilestone as svcDeleteMilestone, fundMilestone as svcFundMilestone, releaseMilestone as svcReleaseMilestone } from '../services/milestone.service';
import { AppError } from '../lib/errors';

const uuidSchema = z.string().uuid('Invalid ID format');

export const getMilestones = async (request: FastifyRequest<{ Params: { contractId: string } }>, reply: FastifyReply) => {
  try {
    const contractId = uuidSchema.parse(request.params.contractId);
    const result = await svcGetMilestones(contractId, request.user.id);
    return reply.send(result);
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ error: 'Invalid contract ID format' });
    if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
    request.log.error(error, 'getMilestones failed');
    return reply.status(500).send({ error: 'Failed to fetch milestones' });
  }
};

export const createMilestone = async (request: FastifyRequest<{ Params: { contractId: string } }>, reply: FastifyReply) => {
  try {
    const contractId = uuidSchema.parse(request.params.contractId);
    const result = await svcCreateMilestone(contractId, request.user.id, request.body);
    return reply.status(201).send(result);
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ error: 'Invalid contract ID format' });
    if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
    request.log.error(error, 'createMilestone failed');
    return reply.status(500).send({ error: 'Failed to create milestone' });
  }
};

export const updateMilestone = async (request: FastifyRequest<{ Params: { contractId: string; id: string } }>, reply: FastifyReply) => {
  try {
    const contractId = uuidSchema.parse(request.params.contractId);
    const id = uuidSchema.parse(request.params.id);
    const result = await svcUpdateMilestone(contractId, id, request.user.id, request.body);
    return reply.send(result);
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ error: 'Invalid contract or milestone ID format' });
    if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
    request.log.error(error, 'updateMilestone failed');
    return reply.status(500).send({ error: 'Failed to update milestone' });
  }
};

export const deleteMilestone = async (request: FastifyRequest<{ Params: { contractId: string; id: string } }>, reply: FastifyReply) => {
  try {
    const contractId = uuidSchema.parse(request.params.contractId);
    const id = uuidSchema.parse(request.params.id);
    const result = await svcDeleteMilestone(contractId, id, request.user.id);
    return reply.send(result);
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ error: 'Invalid contract or milestone ID format' });
    if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
    request.log.error(error, 'deleteMilestone failed');
    return reply.status(500).send({ error: 'Failed to delete milestone' });
  }
};

export const fundMilestone = async (request: FastifyRequest<{ Params: { contractId: string; id: string } }>, reply: FastifyReply) => {
  try {
    const contractId = uuidSchema.parse(request.params.contractId);
    const id = uuidSchema.parse(request.params.id);
    const result = await svcFundMilestone(contractId, id, request.user.id);
    return reply.send(result);
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ error: 'Invalid contract or milestone ID format' });
    if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
    request.log.error(error, 'fundMilestone failed');
    return reply.status(500).send({ error: 'Failed to fund milestone' });
  }
};

export const releaseMilestone = async (request: FastifyRequest<{ Params: { contractId: string; id: string } }>, reply: FastifyReply) => {
  try {
    const contractId = uuidSchema.parse(request.params.contractId);
    const id = uuidSchema.parse(request.params.id);
    const result = await svcReleaseMilestone(contractId, id, request.user.id);
    return reply.send(result);
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ error: 'Invalid contract or milestone ID format' });
    if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
    request.log.error(error, 'releaseMilestone failed');
    return reply.status(500).send({ error: 'Failed to release milestone' });
  }
};
