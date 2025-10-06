/**
 * @fileoverview Application logger configuration
 */

import pino from 'pino';
import { config } from '../config/index.js';

export const logger = pino({
  level: config.logging.level,
  transport: config.logging.pretty ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
    },
  } : undefined,
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      headers: {
        host: req.headers.host,
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type'],
      },
    }),
    res: (res) => ({
      statusCode: res.statusCode,
      headers: res.headers,
    }),
    err: pino.stdSerializers.err,
  },
});

// Create child loggers for different modules
export const createLogger = (name: string) => {
  return logger.child({ module: name });
};
