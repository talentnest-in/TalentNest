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

export function logError(context: string, error: unknown, meta?: Record<string, unknown>): void {
  const logData: Record<string, unknown> = {
    context,
    message: error instanceof Error ? error.message : String(error),
    timestamp: new Date().toISOString(),
    ...meta,
  };
  if (error instanceof Error && error.stack && !isProduction) {
    logData.stack = error.stack;
  }
  console.error(JSON.stringify(logData));
}

export function logInfo(context: string, message: string, meta?: Record<string, unknown>): void {
  console.log(JSON.stringify({
    context,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  }));
}

export function logWarn(context: string, message: string, meta?: Record<string, unknown>): void {
  console.warn(JSON.stringify({
    context,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  }));
}
