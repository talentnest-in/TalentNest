import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { register as authRegister, login as authLogin, refresh as authRefresh, getMe as authGetMe, forgotPassword as authForgotPassword, resetPassword as authResetPassword, getCookieOptions } from '../services/auth.service';
import { AppError } from '../lib/errors';

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['FREELANCER', 'CLIENT']),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

function isHttps(request: FastifyRequest): boolean {
  return request.headers['x-forwarded-proto'] === 'https' || request.protocol === 'https';
}

export const register = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = registerSchema.parse(request.body);
    const signJwt = (payload: { id: string; role: string | null }) => reply.jwtSign(payload);
    const result = await authRegister(body, signJwt);
    const cookieOpts1 = getCookieOptions(isHttps(request));
    reply.setCookie('token', result.token, { ...cookieOpts1, secure: cookieOpts1.secure ?? true });
    return reply.status(201).send(result);
  } catch (error) {
    if (error instanceof z.ZodError) throw error;
    request.log.error(error, 'register failed');
    throw error;
  }
};

export const login = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = loginSchema.parse(request.body);
    const signJwt = (payload: { id: string; role: string | null }) => reply.jwtSign(payload);
    const result = await authLogin(body, signJwt);
    const cookieOpts2 = getCookieOptions(isHttps(request));
    reply.setCookie('token', result.token, { ...cookieOpts2, secure: cookieOpts2.secure ?? true });
    return reply.send(result);
  } catch (error) {
    if (error instanceof z.ZodError) throw error;
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ statusCode: error.statusCode, message: error.message });
    }
    request.log.error(error, 'login failed');
    throw error;
  }
};

export const logout = async (request: FastifyRequest, reply: FastifyReply) => {
  const cookieOpts3 = getCookieOptions(isHttps(request));
  reply.clearCookie('token', { ...cookieOpts3, secure: cookieOpts3.secure ?? true });
  return reply.send({ statusCode: 200, message: 'Logged out successfully' });
};

export const refresh = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    let token: string | undefined = (request.cookies as any).token;
    if (!token && request.headers.authorization?.startsWith('Bearer ')) {
      token = request.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'No token provided' });
    }

    const decoded: any = (request.server as any).jwt.decode(token);
    if (!decoded || !decoded.id) {
      return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Invalid token' });
    }

    const signJwt = (payload: { id: string; role: string | null }) => reply.jwtSign(payload);
    const result = await authRefresh(decoded.id, signJwt);
    const cookieOpts4 = getCookieOptions(isHttps(request));
    reply.setCookie('token', result.token, { ...cookieOpts4, secure: cookieOpts4.secure ?? true });
    return reply.send({ statusCode: 200, token: result.token, message: 'Token refreshed' });
  } catch (error) {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ statusCode: error.statusCode, error: 'Unauthorized', message: error.message });
    }
    request.log.error(error, 'refresh failed');
    return reply.status(500).send({ statusCode: 500, error: 'Internal Server Error' });
  }
};

export const getMe = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = await authGetMe((request.user as any).id);
    return reply.send({ user });
  } catch (error) {
    request.log.error(error, 'getMe failed');
    throw error;
  }
};

export const forgotPassword = async (request: FastifyRequest<{ Body: { email: string } }>, reply: FastifyReply) => {
  try {
    const { email } = forgotPasswordSchema.parse(request.body);
    await authForgotPassword(email);
    return reply.send({ message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    if (error instanceof z.ZodError) throw error;
    request.log.error(error, 'forgotPassword failed');
    throw error;
  }
};

export const resetPassword = async (request: FastifyRequest<{ Body: { token: string; password: string } }>, reply: FastifyReply) => {
  try {
    const { token, password } = resetPasswordSchema.parse(request.body);
    await authResetPassword(token, password);
    return reply.send({ message: 'Password has been reset successfully. You can now log in.' });
  } catch (error) {
    if (error instanceof z.ZodError) throw error;
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ statusCode: error.statusCode, message: error.message });
    }
    request.log.error(error, 'resetPassword failed');
    throw error;
  }
};
