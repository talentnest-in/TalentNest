import { FastifyRequest, FastifyReply } from 'fastify';
import { getNotes as svcGetNotes, createNote as svcCreateNote, updateNote as svcUpdateNote, deleteNote as svcDeleteNote } from '../services/note.service';
import { AppError } from '../lib/errors';

export const getNotes = async (request: FastifyRequest<{ Params: { contractId: string } }>, reply: FastifyReply) => {
  try {
    const result = await svcGetNotes(request.user.id, request.params.contractId);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
    request.log.error(error, 'getNotes failed');
    return reply.status(500).send({ error: 'Failed to fetch notes' });
  }
};

export const createNote = async (request: FastifyRequest<{ Params: { contractId: string } }>, reply: FastifyReply) => {
  try {
    const result = await svcCreateNote(request.user.id, request.params.contractId, request.body);
    return reply.status(201).send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
    request.log.error(error, 'createNote failed');
    return reply.status(500).send({ error: 'Failed to create note' });
  }
};

export const updateNote = async (request: FastifyRequest<{ Params: { contractId: string; id: string } }>, reply: FastifyReply) => {
  try {
    const result = await svcUpdateNote(request.user.id, request.params.contractId, request.params.id, request.body);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
    request.log.error(error, 'updateNote failed');
    return reply.status(500).send({ error: 'Failed to update note' });
  }
};

export const deleteNote = async (request: FastifyRequest<{ Params: { contractId: string; id: string } }>, reply: FastifyReply) => {
  try {
    const result = await svcDeleteNote(request.user.id, request.params.contractId, request.params.id);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
    request.log.error(error, 'deleteNote failed');
    return reply.status(500).send({ error: 'Failed to delete note' });
  }
};
