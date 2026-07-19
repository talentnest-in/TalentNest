import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { uploadFile } from '../lib/upload';
import { getProjects as svcGetProjects, addProject as svcAddProject, updateProject as svcUpdateProject, deleteProject as svcDeleteProject } from '../services/portfolio.service';
import { AppError } from '../lib/errors';

const projectIdSchema = z.object({ id: z.string().uuid('Invalid project ID') });

export const getProjects = async (request: FastifyRequest<{ Querystring: { page?: string; limit?: string } }>, reply: FastifyReply) => {
  try {
    const { page, limit } = request.query;
    const result = await svcGetProjects(request.user.id, page, limit);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    request.log.error(error, 'getProjects failed');
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};

export const addProject = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const result = await svcAddProject(request.user.id, request.body);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    request.log.error(error, 'addProject failed');
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};

export const updateProject = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const { id } = projectIdSchema.parse(request.params);
    const result = await svcUpdateProject(request.user.id, id, request.body);
    return reply.send(result);
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ message: 'Invalid project ID format' });
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    request.log.error(error, 'updateProject failed');
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};

export const deleteProject = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const { id } = projectIdSchema.parse(request.params);
    const result = await svcDeleteProject(request.user.id, id);
    return reply.send(result);
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ message: 'Invalid project ID format' });
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    request.log.error(error, 'deleteProject failed');
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};

export const uploadProjectImage = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const file = await request.file();
    if (!file) return reply.status(400).send({ message: 'No file uploaded' });
    const uploadResult = await uploadFile({ file, type: 'portfolio' });
    return reply.send({ imageUrl: uploadResult.secure_url });
  } catch (error) {
    request.log.error(error, 'uploadProjectImage failed');
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};
