import { FastifyReply } from 'fastify';

export function sendSuccess(reply: FastifyReply, data: any, statusCode = 200) {
  return reply.status(statusCode).send({ success: true, data });
}

export function sendError(reply: FastifyReply, statusCode: number, message: string, error?: any) {
  const body: any = { success: false, message };
  if (error && process.env.NODE_ENV !== 'production') body.error = String(error);
  if (statusCode === 400) body.issues = error?.issues;
  return reply.status(statusCode).send(body);
}
