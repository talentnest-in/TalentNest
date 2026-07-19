import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { createOffer as svcCreateOffer, getClientOffers as svcGetClientOffers, getFreelancerOffers as svcGetFreelancerOffers, getOfferDetails as svcGetOfferDetails, cancelOffer as svcCancelOffer, acceptOffer as svcAcceptOffer, declineOffer as svcDeclineOffer } from '../services/offer.service';
import { AppError } from '../lib/errors';

const createOfferSchema = z.object({
  applicationId: z.string().uuid('Invalid application ID'),
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  proposedBudget: z.number().positive('Budget must be positive'),
  currency: z.string().default('USD'),
  estimatedDuration: z.string().nullable().catch(null),
  deadline: z.string().nullable().catch(null).transform((str) => (str ? new Date(str) : null)),
});

const offerIdSchema = z.object({ id: z.string().uuid('Invalid offer ID') });

export const createOffer = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const data = createOfferSchema.parse(request.body);
    const result = await svcCreateOffer(request.user.id, data);
    return reply.status(201).send(result);
  } catch (error) {
    if (error instanceof z.ZodError) throw error;
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    request.log.error(error, 'createOffer failed');
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};

export const getClientOffers = async (request: FastifyRequest<{ Querystring: { status?: string; search?: string; page?: string; limit?: string } }>, reply: FastifyReply) => {
  try {
    const result = await svcGetClientOffers(request.user.id, request.query);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    request.log.error(error, 'getClientOffers failed');
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};

export const getFreelancerOffers = async (request: FastifyRequest<{ Querystring: { status?: string; page?: string; limit?: string } }>, reply: FastifyReply) => {
  try {
    const result = await svcGetFreelancerOffers(request.user.id, request.query);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    request.log.error(error, 'getFreelancerOffers failed');
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};

export const getOfferDetails = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const { id } = offerIdSchema.parse(request.params);
    const result = await svcGetOfferDetails(request.user.id, id);
    return reply.send(result);
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ statusCode: 400, message: 'Invalid offer ID format' });
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    request.log.error(error, 'getOfferDetails failed');
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};

export const cancelOffer = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const { id } = offerIdSchema.parse(request.params);
    const result = await svcCancelOffer(request.user.id, id);
    return reply.send(result);
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ statusCode: 400, message: 'Invalid offer ID format' });
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    request.log.error(error, 'cancelOffer failed');
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};

export const acceptOffer = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const { id } = offerIdSchema.parse(request.params);
    const result = await svcAcceptOffer(request.user.id, id);
    return reply.send(result);
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ statusCode: 400, message: 'Invalid offer ID format' });
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    request.log.error(error, 'acceptOffer failed');
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};

export const declineOffer = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const { id } = offerIdSchema.parse(request.params);
    const result = await svcDeclineOffer(request.user.id, id);
    return reply.send(result);
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ statusCode: 400, message: 'Invalid offer ID format' });
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    request.log.error(error, 'declineOffer failed');
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};
