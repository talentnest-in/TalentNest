import { FastifyInstance } from 'fastify';
import {
  createOffer,
  getClientOffers,
  getOfferDetails,
  cancelOffer,
  getFreelancerOffers,
  acceptOffer,
  declineOffer,
} from '../controllers/offer.controller';

export async function offerRoutes(server: FastifyInstance) {
  // ── Client Offer Routes ────────────────────────────────────────────────────────

  // Create offer
  server.post('/', {
    preHandler: [server.authenticate, (request, reply, done) => {
      // Only clients can create offers
      if (request.user.role !== 'CLIENT') {
        return reply.status(403).send({ message: 'Only clients can create offers' });
      }
      done();
    }],
  }, createOffer);

  // Get client's offers
  server.get('/client', {
    preHandler: [server.authenticate, (request, reply, done) => {
      if (request.user.role !== 'CLIENT') {
        return reply.status(403).send({ message: 'Only clients can view their offers' });
      }
      done();
    }],
  }, getClientOffers);

  // Get offer details (shared)
  server.get('/:id', {
    preHandler: [server.authenticate],
  }, getOfferDetails);

  // Cancel offer
  server.patch('/client/:id/cancel', {
    preHandler: [server.authenticate, (request, reply, done) => {
      if (request.user.role !== 'CLIENT') {
        return reply.status(403).send({ message: 'Only clients can cancel offers' });
      }
      done();
    }],
  }, cancelOffer);

  // ── Freelancer Offer Routes ───────────────────────────────────────────────────
  // Get freelancer's offers
  server.get('/freelancer', {
    preHandler: [server.authenticate, (request, reply, done) => {
      if (request.user.role !== 'FREELANCER') {
        return reply.status(403).send({ message: 'Only freelancers can view their offers' });
      }
      done();
    }],
  }, getFreelancerOffers);

  // Accept offer
  server.patch('/:id/accept', {
    preHandler: [server.authenticate, (request, reply, done) => {
      if (request.user.role !== 'FREELANCER') {
        return reply.status(403).send({ message: 'Only freelancers can accept offers' });
      }
      done();
    }],
  }, acceptOffer);

  // Decline offer
  server.patch('/:id/decline', {
    preHandler: [server.authenticate, (request, reply, done) => {
      if (request.user.role !== 'FREELANCER') {
        return reply.status(403).send({ message: 'Only freelancers can decline offers' });
      }
      done();
    }],
  }, declineOffer);
}
