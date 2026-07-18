import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';

export type ApiVersion = 'v1' | 'v2';

declare module 'fastify' {
  interface FastifyRequest {
    apiVersion: ApiVersion;
  }
}

const VERSION_PATTERN = /^\/api\/(v[12])\//;

function extractVersion(url: string): ApiVersion {
  const match = url.match(VERSION_PATTERN);
  return (match?.[1] as ApiVersion) || 'v1';
}

export default fp(async function versioningPlugin(server: FastifyInstance) {
  // Decorate request with version
  server.decorateRequest('apiVersion', 'v1');

  server.addHook('onRequest', async (request: FastifyRequest) => {
    request.apiVersion = extractVersion(request.url);
  });

  // Redirect /api → /api/v1 for backward compatibility
  server.get('/api', async (_request: FastifyRequest, reply: FastifyReply) => {
    reply.code(301).redirect('/api/v1');
  });

  // Deprecation warning header for v1
  server.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.apiVersion === 'v1') {
      reply.header('X-API-Version', 'v1');
      reply.header('X-API-Deprecated', 'true');
      reply.header('X-API-Sunset', '2027-01-01');
      reply.header('X-API-Migration-Guide', 'https://docs.talentnest.com/api/v1-to-v2');
    } else if (request.apiVersion === 'v2') {
      reply.header('X-API-Version', 'v2');
      reply.header('X-API-Stable', 'true');
    }
  });

  server.log.info('API versioning enabled — v1 (deprecated), v2 (stable)');
});

// Version comparison helper
export function gte(version: ApiVersion, target: ApiVersion): boolean {
  const order: Record<ApiVersion, number> = { v1: 1, v2: 2 };
  return order[version] >= order[target];
}

// Version-based route handler selector
export function versionedHandler(
  handlers: Partial<Record<ApiVersion, (request: FastifyRequest, reply: FastifyReply) => Promise<any>>>,
) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const version = request.apiVersion;
    const handler = handlers[version] || handlers.v1;
    if (!handler) {
      return reply.status(404).send({ error: 'Not Found', message: `No handler for API version ${version}` });
    }
    return handler(request, reply);
  };
}
