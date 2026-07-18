import { FastifyRequest, FastifyReply } from 'fastify';
import { uploadFile } from '../lib/upload';
import { getProfile as svcGetProfile, upsertProfile as svcUpsertProfile, uploadResume as svcUploadResume, uploadAvatar as svcUploadAvatar, addSkill as svcAddSkill, deleteSkill as svcDeleteSkill, addExperience as svcAddExperience, updateExperience as svcUpdateExperience, deleteExperience as svcDeleteExperience, addEducation as svcAddEducation, updateEducation as svcUpdateEducation, deleteEducation as svcDeleteEducation } from '../services/freelancer.service';
import { AppError } from '../lib/errors';

export const getProfile = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const profile = await svcGetProfile(request.user.id);
    return reply.send({ profile });
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    throw error;
  }
};

export const upsertProfile = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const result = await svcUpsertProfile(request.user.id, request.body);
    return reply.send({ profile: result });
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    throw error;
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
    throw error;
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
    throw error;
  }
};

export const addSkill = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const result = await svcAddSkill(request.user.id, request.body);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    throw error;
  }
};

export const deleteSkill = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const result = await svcDeleteSkill(request.user.id, request.params.id);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    throw error;
  }
};

export const addExperience = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const result = await svcAddExperience(request.user.id, request.body);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    throw error;
  }
};

export const updateExperience = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const result = await svcUpdateExperience(request.user.id, request.params.id, request.body);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    throw error;
  }
};

export const deleteExperience = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const result = await svcDeleteExperience(request.user.id, request.params.id);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    throw error;
  }
};

export const addEducation = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const result = await svcAddEducation(request.user.id, request.body);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    throw error;
  }
};

export const updateEducation = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const result = await svcUpdateEducation(request.user.id, request.params.id, request.body);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    throw error;
  }
};

export const deleteEducation = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const result = await svcDeleteEducation(request.user.id, request.params.id);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    throw error;
  }
};
