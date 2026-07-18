import { FastifyRequest, FastifyReply } from 'fastify';
import { getMilestones as svcGetMilestones, createMilestone as svcCreateMilestone, updateMilestone as svcUpdateMilestone, deleteMilestone as svcDeleteMilestone, fundMilestone as svcFundMilestone, releaseMilestone as svcReleaseMilestone } from '../services/milestone.service';
import { AppError } from '../lib/errors';

export const getMilestones = async (request: FastifyRequest<{ Params: { contractId: string } }>, reply: FastifyReply) => {
  try {
    const result = await svcGetMilestones(request.user.id, request.params.contractId);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
    request.log.error(error, 'getMilestones failed');
    return reply.status(500).send({ error: 'Failed to fetch milestones' });
  }
};

export const createMilestone = async (request: FastifyRequest<{ Params: { contractId: string } }>, reply: FastifyReply) => {
  try {
    const result = await svcCreateMilestone(request.user.id, request.params.contractId, request.body);
    return reply.status(201).send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
    request.log.error(error, 'createMilestone failed');
    return reply.status(500).send({ error: 'Failed to create milestone' });
  }
};

export const updateMilestone = async (request: FastifyRequest<{ Params: { contractId: string; id: string } }>, reply: FastifyReply) => {
  try {
    const result = await svcUpdateMilestone(request.user.id, request.params.contractId, request.params.id, request.body);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
    request.log.error(error, 'updateMilestone failed');
    return reply.status(500).send({ error: 'Failed to update milestone' });
  }
};

export const deleteMilestone = async (request: FastifyRequest<{ Params: { contractId: string; id: string } }>, reply: FastifyReply) => {
  try {
    const result = await svcDeleteMilestone(request.user.id, request.params.contractId, request.params.id);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
    request.log.error(error, 'deleteMilestone failed');
    return reply.status(500).send({ error: 'Failed to delete milestone' });
  }
};

export const fundMilestone = async (request: FastifyRequest<{ Params: { contractId: string; id: string } }>, reply: FastifyReply) => {
  try {
    const result = await svcFundMilestone(request.user.id, request.params.contractId, request.params.id);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
    request.log.error(error, 'fundMilestone failed');
    return reply.status(500).send({ error: 'Failed to fund milestone' });
  }
};

export const releaseMilestone = async (request: FastifyRequest<{ Params: { contractId: string; id: string } }>, reply: FastifyReply) => {
  try {
    const result = await svcReleaseMilestone(request.user.id, request.params.contractId, request.params.id);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
    request.log.error(error, 'releaseMilestone failed');
    return reply.status(500).send({ error: 'Failed to release milestone' });
  }
};
