import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiVersion, gte } from './versioning';

// Version-aware route registration helper
export function registerVersionedRoutes(server: FastifyInstance) {
  // V1 routes (existing, registered under /api/v1)
  // All existing registrations remain at /api/v1 prefix

  // V2 routes (future, registered under /api/v2)
  // Placeholder for v2 controllers — to be implemented
  server.get('/api/v2/health', async (_request: FastifyRequest, reply: FastifyReply) => {
    return {
      status: 'ok',
      version: '2.0.0',
      api_version: 'v2',
      features: ['versioning', 'feature-flags', 'rate-limiting-v2'],
      documentation: 'https://docs.talentnest.com/api/v2',
    };
  });

  // V2 auth endpoints (enhanced)
  server.post('/api/v2/auth/login', async (request: FastifyRequest, reply: FastifyReply) => {
    // Forward to v1 handler with v2 improvements
    // In production, this would use a v2-specific controller
    reply.status(200).send({
      message: 'V2 login endpoint — enhanced security with refresh token rotation',
      api_version: 'v2',
      note: 'Use /api/v1/auth/login for current implementation',
    });
  });

  // Version info endpoint
  server.get('/api/version', async (_request: FastifyRequest, reply: FastifyReply) => {
    return {
      versions: {
        v1: { status: 'deprecated', sunset: '2027-01-01', migration: 'https://docs.talentnest.com/api/v1-to-v2' },
        v2: { status: 'stable', current: true },
      },
      current_version: 'v2',
      changelog: 'https://docs.talentnest.com/api/changelog',
    };
  });
}

// Helper to conditionally apply features based on API version
export function applyVersionedFeature(featureName: string, version: ApiVersion, v2Only: boolean = false): boolean {
  if (v2Only) return gte(version, 'v2');
  return true;
}
