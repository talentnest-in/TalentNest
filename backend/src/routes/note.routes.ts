import { FastifyInstance } from 'fastify';
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
} from '../controllers/note.controller';

export async function noteRoutes(fastify: FastifyInstance) {
  // Get all notes for a contract
  fastify.get('/contracts/:contractId/notes', {
    preHandler: [fastify.authenticate],
    handler: getNotes,
  });

  // Create a note
  fastify.post('/contracts/:contractId/notes', {
    preHandler: [fastify.authenticate],
    handler: createNote,
  });

  // Update a note
  fastify.patch('/contracts/:contractId/notes/:id', {
    preHandler: [fastify.authenticate],
    handler: updateNote,
  });

  // Delete a note
  fastify.delete('/contracts/:contractId/notes/:id', {
    preHandler: [fastify.authenticate],
    handler: deleteNote,
  });
}
