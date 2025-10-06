/**
 * @fileoverview Global error handler middleware
 */

import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

export async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Log the error
  logger.error({
    error: error.message,
    stack: error.stack,
    request: {
      method: request.method,
      url: request.url,
      headers: request.headers,
    },
  }, 'Request error');

  // Handle different error types
  if (error instanceof ZodError) {
    // Validation errors
    const validationErrors = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    }));

    return reply.status(400).send({
      success: false,
      error: 'Validation failed',
      details: validationErrors,
    });
  }

  if (error.statusCode) {
    // HTTP errors
    return reply.status(error.statusCode).send({
      success: false,
      error: error.message,
      ...(config.logging.level === 'debug' && { stack: error.stack }),
    });
  }

  // Default error response
  const statusCode = error.statusCode || 500;
  const message = config.logging.level === 'debug' ? error.message : 'Internal server error';

  return reply.status(statusCode).send({
    success: false,
    error: message,
    ...(config.logging.level === 'debug' && { stack: error.stack }),
  });
}
