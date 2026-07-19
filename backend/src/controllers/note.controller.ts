import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { getNotes as svcGetNotes, createNote as svcCreateNote, updateNote as svcUpdateNote, deleteNote as svcDeleteNote } from '../services/note.service';
import { AppError } from '../lib/errors';

const uuidSchema = z.string().uuid('Invalid ID format');

export const getNotes = async (request: FastifyRequest<{ Params: { contractId: string } }>, reply: FastifyReply) => {
  try {
    const contractId = uuidSchema.parse(request.params.contractId);
    const result = await svcGetNotes(contractId, request.user.id);
    return reply.send(result);
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ error: 'Invalid contract ID format' });
    if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
    request.log.error(error, 'getNotes failed');
    return reply.status(500).send({ error: 'Failed to fetch notes' });
  }
};

export const createNote = async (request: FastifyRequest<{ Params: { contractId: string } }>, reply: FastifyReply) => {
  try {
    const contractId = uuidSchema.parse(request.params.contractId);
    const result = await svcCreateNote(contractId, request.user.id, request.body);
    return reply.status(201).send(result);
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ error: 'Invalid contract ID format' });
    if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
    request.log.error(error, 'createNote failed');
    return reply.status(500).send({ error: 'Failed to create note' });
  }
};

export const updateNote = async (request: FastifyRequest<{ Params: { contractId: string; id: string } }>, reply: FastifyReply) => {
  try {
    const contractId = uuidSchema.parse(request.params.contractId);
    const id = uuidSchema.parse(request.params.id);
    const result = await svcUpdateNote(contractId, id, request.user.id, request.body);
    return reply.send(result);
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ error: 'Invalid contract or note ID format' });
    if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
    request.log.error(error, 'updateNote failed');
    return reply.status(500).send({ error: 'Failed to update note' });
  }
};

export const deleteNote = async (request: FastifyRequest<{ Params: { contractId: string; id: string } }>, reply: FastifyReply) => {
  try {
    const contractId = uuidSchema.parse(request.params.contractId);
    const id = uuidSchema.parse(request.params.id);
    const result = await svcDeleteNote(contractId, id, request.user.id);
    return reply.send(result);
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ error: 'Invalid contract or note ID format' });
    if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
    request.log.error(error, 'deleteNote failed');
    return reply.status(500).send({ error: 'Failed to delete note' });
  }
};
