/**
 * @fileoverview Global error handler middleware
 */

import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from '@microtech/core';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

export async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const errorMessage = error instanceof Error ? error.message : 'Unexpected error';
  const errorStack = error instanceof Error ? error.stack : undefined;

  // Log the error
  logger.error({
    error: errorMessage,
    stack: errorStack,
    request: {
      method: request.method,
      url: request.url,
      headers: request.headers,
    },
  }, 'Request error');

  // Handle different error types
  if (error instanceof ZodError) {
    // Validation errors
    const validationErrors = error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));

    return reply.status(400).send({
      success: false,
      error: 'Validation failed',
      details: validationErrors,
    });
  }

  if (typeof error.statusCode === 'number') {
    // HTTP errors
    return reply.status(error.statusCode).send({
      success: false,
      error: errorMessage,
      ...(config.logging.level === 'debug' && { stack: errorStack }),
    });
  }

  // Default error response
  const statusCode = typeof error.statusCode === 'number' ? error.statusCode : 500;
  const message = config.logging.level === 'debug' ? errorMessage : 'Internal server error';

  return reply.status(statusCode).send({
    success: false,
    error: message,
    ...(config.logging.level === 'debug' && { stack: errorStack }),
  });
}
