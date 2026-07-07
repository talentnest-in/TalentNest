import { FastifyInstance } from 'fastify';
import { globalSearch } from '../controllers/search.controller';

export async function searchRoutes(server: FastifyInstance) {
  server.get('/', globalSearch);
}
