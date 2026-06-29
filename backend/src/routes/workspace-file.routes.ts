import { FastifyInstance } from 'fastify';
import {
  getContractFiles,
  createFile,
  deleteFile,
} from '../controllers/workspace-file.controller';

export async function workspaceFileRoutes(fastify: FastifyInstance) {
  // Get all files for a contract
  fastify.get('/workspace/files/:contractId', {
    preHandler: [fastify.authenticate],
    handler: getContractFiles,
  });

  // Create a file
  fastify.post('/workspace/files/:contractId', {
    preHandler: [fastify.authenticate],
    handler: createFile,
  });

  // Delete a file
  fastify.delete('/workspace/files/:contractId/:id', {
    preHandler: [fastify.authenticate],
    handler: deleteFile,
  });
}
