import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { uploadFile } from '../lib/upload';
import { getClientProfile as svcGetClientProfile, updateClientProfile as svcUpdateClientProfile, uploadClientLogo as svcUploadClientLogo, getClientDashboard as svcGetClientDashboard } from '../services/client.service';
import { AppError } from '../lib/errors';

const profileSchema = z.object({
  bio: z.string().nullable().catch(null),
  website: z.string().nullable().catch(null),
  location: z.string().nullable().catch(null),
});

export const getClientProfile = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const profile = await svcGetClientProfile(request.user.id);
    return reply.send({ profile });
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    throw error;
  }
};

export const updateClientProfile = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const data = profileSchema.parse(request.body);
    const profile = await svcUpdateClientProfile(request.user.id, data);
    return reply.send({ profile });
  } catch (error) {
    if (error instanceof z.ZodError) throw error;
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    throw error;
  }
};

export const uploadClientLogo = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const file = await request.file();
    if (!file) return reply.status(400).send({ message: 'No file uploaded' });
    const uploadResult = await uploadFile({ file, type: 'logo' });
    const result = await svcUploadClientLogo(request.user.id, uploadResult.secure_url);
    return reply.send({ logoUrl: result });
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    throw error;
  }
};

export const getClientDashboard = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const result = await svcGetClientDashboard(request.user.id);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    throw error;
  }
};
