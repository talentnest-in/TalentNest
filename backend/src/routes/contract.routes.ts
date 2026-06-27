import { FastifyInstance } from 'fastify';
import {
  getContracts,
  getContractDetails,
  updateContractStatus,
} from '../controllers/contract.controller';

export async function contractRoutes(server: FastifyInstance) {
  // ── Contract Routes (Shared for Client and Freelancer) ─────────────────────────────

  // Get contracts (both client and freelancer)
  server.get('/', {
    preHandler: [server.authenticate, (request, reply, done) => {
      if (request.user.role !== 'CLIENT' && request.user.role !== 'FREELANCER') {
        return reply.status(403).send({ message: 'Only clients and freelancers can view contracts' });
      }
      done();
    }],
  }, getContracts);

  // Get contract details
  server.get('/:id', {
    preHandler: [server.authenticate, (request, reply, done) => {
      if (request.user.role !== 'CLIENT' && request.user.role !== 'FREELANCER') {
        return reply.status(403).send({ message: 'Only clients and freelancers can view contracts' });
      }
      done();
    }],
  }, getContractDetails);

  // Update contract status
  server.patch('/:id/status', {
    preHandler: [server.authenticate, (request, reply, done) => {
      if (request.user.role !== 'CLIENT' && request.user.role !== 'FREELANCER') {
        return reply.status(403).send({ message: 'Only clients and freelancers can update contract status' });
      }
      done();
    }],
  }, updateContractStatus);
}
