import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { uploadFile } from '../lib/upload';
import { getProfile as svcGetProfile, upsertProfile as svcUpsertProfile, uploadResume as svcUploadResume, uploadAvatar as svcUploadAvatar, addSkill as svcAddSkill, deleteSkill as svcDeleteSkill, addExperience as svcAddExperience, updateExperience as svcUpdateExperience, deleteExperience as svcDeleteExperience, addEducation as svcAddEducation, updateEducation as svcUpdateEducation, deleteEducation as svcDeleteEducation } from '../services/freelancer.service';
import { AppError } from '../lib/errors';

const uuidSchema = z.string().uuid('Invalid ID format');

export const getProfile = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const profile = await svcGetProfile(request.user.id);
    return reply.send({ profile: profile ?? null });
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    request.log.error(error, 'getProfile failed');
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};

export const upsertProfile = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const result = await svcUpsertProfile(request.user.id, request.body);
    return reply.send({ profile: result });
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    request.log.error(error, 'upsertProfile failed');
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};

export const uploadResume = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const file = await request.file();
    if (!file) return reply.status(400).send({ message: 'No file uploaded' });
    const uploadResult = await uploadFile({ file, type: 'resume' });
    const result = await svcUploadResume(request.user.id, uploadResult.secure_url);
    return reply.send({ resumeUrl: result });
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    request.log.error(error, 'uploadResume failed');
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};

export const uploadAvatar = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const file = await request.file();
    if (!file) return reply.status(400).send({ message: 'No file uploaded' });
    const uploadResult = await uploadFile({ file, type: 'avatar' });
    const result = await svcUploadAvatar(request.user.id, uploadResult.secure_url);
    return reply.send({ avatar: result });
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    request.log.error(error, 'uploadAvatar failed');
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};

export const addSkill = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const result = await svcAddSkill(request.user.id, request.body);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    request.log.error(error, 'addSkill failed');
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};

export const deleteSkill = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const id = uuidSchema.parse(request.params.id);
    const result = await svcDeleteSkill(request.user.id, id);
    return reply.send(result);
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ statusCode: 400, message: 'Invalid skill ID format' });
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    request.log.error(error, 'deleteSkill failed');
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};

export const addExperience = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const result = await svcAddExperience(request.user.id, request.body);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    request.log.error(error, 'addExperience failed');
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};

export const updateExperience = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const id = uuidSchema.parse(request.params.id);
    const result = await svcUpdateExperience(request.user.id, id, request.body);
    return reply.send(result);
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ statusCode: 400, message: 'Invalid experience ID format' });
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    request.log.error(error, 'updateExperience failed');
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};

export const deleteExperience = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const id = uuidSchema.parse(request.params.id);
    const result = await svcDeleteExperience(request.user.id, id);
    return reply.send(result);
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ statusCode: 400, message: 'Invalid experience ID format' });
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    request.log.error(error, 'deleteExperience failed');
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};

export const addEducation = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const result = await svcAddEducation(request.user.id, request.body);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    request.log.error(error, 'addEducation failed');
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};

export const updateEducation = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const id = uuidSchema.parse(request.params.id);
    const result = await svcUpdateEducation(request.user.id, id, request.body);
    return reply.send(result);
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ statusCode: 400, message: 'Invalid education ID format' });
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    request.log.error(error, 'updateEducation failed');
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};

export const deleteEducation = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const id = uuidSchema.parse(request.params.id);
    const result = await svcDeleteEducation(request.user.id, id);
    return reply.send(result);
  } catch (error) {
    if (error instanceof z.ZodError) return reply.status(400).send({ statusCode: 400, message: 'Invalid education ID format' });
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    request.log.error(error, 'deleteEducation failed');
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};
