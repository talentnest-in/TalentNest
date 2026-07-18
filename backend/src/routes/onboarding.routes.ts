import { FastifyInstance } from 'fastify';
import { selectRole, completeOnboarding } from '../controllers/onboarding.controller';

export async function onboardingRoutes(server: FastifyInstance) {
  server.post('/select-role', { preValidation: [server.authenticate] }, selectRole);
  server.post('/complete', { preValidation: [server.authenticate] }, completeOnboarding);
}
