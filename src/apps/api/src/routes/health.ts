/**
 * @fileoverview Health check routes
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export async function healthRoutes(fastify: FastifyInstance) {
  // Basic health check
  fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };
  });

  // Detailed health check
  fastify.get('/health/detailed', async (request: FastifyRequest, reply: FastifyReply) => {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'unknown',
        ai: 'unknown',
        storage: 'unknown',
      },
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        external: process.memoryUsage().external,
      },
      config: {
        server: {
          host: config.server.host,
          port: config.server.port,
          scheme: config.server.scheme,
        },
        ai: {
          provider: config.ai.provider,
          model: config.ai.model,
          hasApiKey: !!config.ai.apiKey,
        },
        upload: {
          maxFileSize: config.upload.maxFileSize,
          maxFiles: config.upload.maxFiles,
          allowedMimeTypes: config.upload.allowedMimeTypes,
        },
      },
    };

    // TODO: Add actual health checks for services
    // - Database connectivity
    // - AI service availability
    // - Storage service availability

    return health;
  });

  // Readiness check
  fastify.get('/ready', async (request: FastifyRequest, reply: FastifyReply) => {
    // TODO: Check if all required services are ready
    // - Database migrations completed
    // - AI service configured
    // - Storage service accessible

    const isReady = true; // Replace with actual readiness checks

    if (!isReady) {
      return reply.status(503).send({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        message: 'Service is not ready to accept requests',
      });
    }

    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
    };
  });

  // Liveness check
  fastify.get('/live', async (request: FastifyRequest, reply: FastifyReply) => {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });
}
