import pino from 'pino';
import { randomUUID } from 'crypto';

const isProduction = process.env.NODE_ENV === 'production';

const pinoOptions: pino.LoggerOptions = {
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      requestId: req.id,
      userAgent: req.headers?.['user-agent'],
      ip: req.ip,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
    err: pino.stdSerializers.err,
  },
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'body.password', 'body.token'],
    censor: '***',
  },
};

if (!isProduction) {
  pinoOptions.transport = {
    target: 'pino-pretty',
    options: { colorize: true, translateTime: 'SYS:standard' },
  };
}

export const logger = pino(pinoOptions);

export function createRequestId(): string {
  return randomUUID();
}
