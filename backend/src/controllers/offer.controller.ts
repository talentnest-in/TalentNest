import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { createOffer as svcCreateOffer, getClientOffers as svcGetClientOffers, getFreelancerOffers as svcGetFreelancerOffers, getOfferDetails as svcGetOfferDetails, cancelOffer as svcCancelOffer, acceptOffer as svcAcceptOffer, declineOffer as svcDeclineOffer } from '../services/offer.service';
import { AppError } from '../lib/errors';

const createOfferSchema = z.object({
  applicationId: z.string().uuid(),
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  proposedBudget: z.number().positive('Budget must be positive'),
  currency: z.string().default('USD'),
  estimatedDuration: z.string().nullable().catch(null),
  deadline: z.string().nullable().catch(null).transform((str) => (str ? new Date(str) : null)),
});

export const createOffer = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const data = createOfferSchema.parse(request.body);
    const result = await svcCreateOffer(request.user.id, data);
    return reply.status(201).send(result);
  } catch (error) {
    if (error instanceof z.ZodError) throw error;
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    throw error;
  }
};

export const getClientOffers = async (request: FastifyRequest<{ Querystring: { status?: string; search?: string; page?: string; limit?: string } }>, reply: FastifyReply) => {
  try {
    const result = await svcGetClientOffers(request.user.id, request.query);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    throw error;
  }
};

export const getFreelancerOffers = async (request: FastifyRequest<{ Querystring: { status?: string; page?: string; limit?: string } }>, reply: FastifyReply) => {
  try {
    const result = await svcGetFreelancerOffers(request.user.id, request.query);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    throw error;
  }
};

export const getOfferDetails = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const result = await svcGetOfferDetails(request.user.id, request.params.id);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    throw error;
  }
};

export const cancelOffer = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const result = await svcCancelOffer(request.user.id, request.params.id);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    throw error;
  }
};

export const acceptOffer = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const result = await svcAcceptOffer(request.user.id, request.params.id);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    throw error;
  }
};

export const declineOffer = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const result = await svcDeclineOffer(request.user.id, request.params.id);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    throw error;
  }
};
