import { FastifyRequest, FastifyReply } from 'fastify';
import { uploadFile } from '../lib/upload';
import { getProjects as svcGetProjects, addProject as svcAddProject, updateProject as svcUpdateProject, deleteProject as svcDeleteProject } from '../services/portfolio.service';
import { AppError } from '../lib/errors';

export const getProjects = async (request: FastifyRequest<{ Querystring: { page?: string; limit?: string } }>, reply: FastifyReply) => {
  try {
    const { page, limit } = request.query;
    const result = await svcGetProjects(request.user.id, page, limit);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    throw error;
  }
};

export const addProject = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const result = await svcAddProject(request.user.id, request.body);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    throw error;
  }
};

export const updateProject = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const result = await svcUpdateProject(request.user.id, request.params.id, request.body);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    throw error;
  }
};

export const deleteProject = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const result = await svcDeleteProject(request.user.id, request.params.id);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    throw error;
  }
};

export const uploadProjectImage = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const file = await request.file();
    if (!file) return reply.status(400).send({ message: 'No file uploaded' });
    const uploadResult = await uploadFile({ file, type: 'portfolio' });
    return reply.send({ imageUrl: uploadResult.secure_url });
  } catch (error) {
    throw error;
  }
};
