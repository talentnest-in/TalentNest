import { FastifyRequest, FastifyReply } from 'fastify';
import { uploadFile } from '../lib/upload';
import { getMyCompany, createOrUpdateCompany, uploadCompanyLogo } from '../services/company.service';
import { AppError } from '../lib/errors';

export const getMyCompanyController = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const company = await getMyCompany(request.user.id);
    return reply.send({ company });
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    throw error;
  }
};

export const createOrUpdateCompanyController = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const result = await createOrUpdateCompany(request.user.id, request.body);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    throw error;
  }
};

export const uploadCompanyLogoController = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const file = await request.file();
    if (!file) return reply.status(400).send({ message: 'No file uploaded' });
    const uploadResult = await uploadFile({ file, type: 'logo' });
    const result = await uploadCompanyLogo(request.user.id, uploadResult.secure_url);
    return reply.send({ logoUrl: result });
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
    throw error;
  }
};

export { getMyCompanyController as getMyCompany, createOrUpdateCompanyController as createOrUpdateCompany, uploadCompanyLogoController as uploadCompanyLogo };
