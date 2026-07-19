import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { globalSearch as svcGlobalSearch } from '../services/search.service';
import { AppError } from '../lib/errors';

export const globalSearch = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { q } = request.query as { q?: string };
    if (q !== undefined && typeof q !== 'string') {
      return reply.status(400).send({ statusCode: 400, error: 'Invalid search query' });
    }
    const result = await svcGlobalSearch(q);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ statusCode: error.statusCode, message: error.message });
    }
    request.log.error(error);
    return reply.status(500).send({ statusCode: 500, error: 'Internal Server Error' });
  }
};
