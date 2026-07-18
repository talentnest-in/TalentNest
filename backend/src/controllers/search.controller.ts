import { FastifyRequest, FastifyReply } from 'fastify';
import { globalSearch as svcGlobalSearch } from '../services/search.service';

export const globalSearch = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { q } = request.query as { q?: string };
    const result = await svcGlobalSearch(q);
    return reply.send(result);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ statusCode: 500, error: 'Internal Server Error' });
  }
};
