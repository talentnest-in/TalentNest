import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { selectRole as onboardingSelectRole, completeOnboarding as onboardingComplete } from '../services/onboarding.service';
import { getCookieOptions } from '../services/auth.service';
import { AppError } from '../lib/errors';

const selectRoleSchema = z.object({
  role: z.enum(['FREELANCER', 'CLIENT']),
});

const completeOnboardingSchema = z.object({
  title: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  skills: z.array(z.string()).optional(),
  companyName: z.string().optional(),
  companyIndustry: z.string().optional(),
});

function isHttps(request: FastifyRequest): boolean {
  return request.headers['x-forwarded-proto'] === 'https' || request.protocol === 'https';
}

export const selectRole = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { role } = selectRoleSchema.parse(request.body);
    const userId = request.user.id;
    const signJwt = (payload: { id: string; role: string | null }) => reply.jwtSign(payload);
    const result = await onboardingSelectRole(userId, role, signJwt);
    const cookieOpts = getCookieOptions(isHttps(request));
    reply.setCookie('token', result.token, { ...cookieOpts, secure: cookieOpts.secure ?? true });
    return reply.status(200).send(result);
  } catch (error) {
    if (error instanceof z.ZodError) throw error;
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ statusCode: error.statusCode, message: error.message });
    }
    request.log.error(error);
    return reply.status(500).send({ statusCode: 500, message: 'Internal Server Error' });
  }
};

export const completeOnboarding = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const data = completeOnboardingSchema.parse(request.body);
    const userId = request.user.id;
    const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
    const result = await onboardingComplete(userId, cleanData);
    return reply.status(200).send(result);
  } catch (error) {
    if (error instanceof z.ZodError) throw error;
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ statusCode: error.statusCode, message: error.message });
    }
    request.log.error(error);
    return reply.status(500).send({ statusCode: 500, message: 'Internal Server Error' });
  }
};
