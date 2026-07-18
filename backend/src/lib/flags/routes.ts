import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { featureFlags } from './index';

export async function flagRoutes(server: FastifyInstance) {
  // Public endpoint to check a specific flag (frontend hydration)
  server.get('/api/v1/flags/:key', async (request: FastifyRequest<{ Params: { key: string } }>, reply: FastifyReply) => {
    const userId = ((request as any).user as any)?.id;
    const enabled = await featureFlags.isEnabled(request.params.key, userId);
    return { key: request.params.key, enabled };
  });

  // Admin-only: list all flags
  server.get('/api/v1/admin/flags', {
    preHandler: [server.authenticate],
  }, async (_request: FastifyRequest, reply: FastifyReply) => {
    const user = (_request as any).user;
    if (user?.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Forbidden', message: 'Admin only' });
    }
    return { flags: featureFlags.getAllFlags() };
  });

  // Admin-only: set a flag
  server.post('/api/v1/admin/flags/:key', {
    preHandler: [server.authenticate],
  }, async (request: FastifyRequest<{ Params: { key: string }; Body: { status: string; percentage?: number } }>, reply: FastifyReply) => {
    const user = (request as any).user;
    if (user?.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Forbidden', message: 'Admin only' });
    }
    const { status, percentage } = request.body;
    await featureFlags.setFlag(request.params.key, status as any, { percentage: percentage ?? undefined });
    return { success: true, key: request.params.key, status };
  });
}
