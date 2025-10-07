/**
 * @fileoverview MicroTech Platform API Server
 * 
 * This is the main entry point for the MicroTech Platform API server.
 * It configures and starts a Fastify server with all necessary middleware,
 * security measures, and route handlers for the proposal assistance and
 * recruiting platform.
 * 
 * @author MicroTech Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Internal modules
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authMiddleware } from './middleware/auth.js';

// API Route handlers
import { workspaceRoutes } from './routes/workspaces.js';
import { documentRoutes } from './routes/documents.js';
import { checklistRoutes } from './routes/checklist.js';
import { changeRoutes } from './routes/changes.js';
import { chatRoutes } from './routes/chat.js';
import { exportRoutes } from './routes/exports.js';
import { uploadRoutes } from './routes/upload.js';
import { draftRoutes } from './routes/drafts.js';
import { runsRoutes } from './routes/runs.js';
import { ragDebugRoutes } from './routes/ragDebug.js';
import { healthRoutes } from './routes/health.js';
import { telemetryRoutes } from './routes/telemetry.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function createServer() {
  const fastify = Fastify({
    logger: logger as any,
    trustProxy: true,
  });

  // Error handling
  fastify.setErrorHandler(errorHandler as any);

  // Security
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
  });

  // CORS
  await fastify.register(cors, {
    origin: config.cors.origins,
    credentials: true,
  });

  // Multipart support for file uploads
  await fastify.register(multipart, {
    limits: {
      fileSize: config.upload.maxFileSize,
      files: config.upload.maxFiles,
    },
  });

  // Static files
  await fastify.register(fastifyStatic, {
    root: join(__dirname, '../../public'),
    prefix: '/public/',
  });

  // Swagger documentation
  await fastify.register(swagger, {
    swagger: {
      info: {
        title: 'MicroTech Platform API',
        description: 'Professional FedRAMP proposal assistance and recruiting platform API',
        version: '1.0.0',
      },
      host: config.server.host + ':' + config.server.port,
      schemes: [config.server.scheme],
      consumes: ['application/json', 'multipart/form-data'],
      produces: ['application/json'],
      securityDefinitions: {
        bearerAuth: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header',
          description: 'JWT token',
        },
      },
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false,
    },
    uiHooks: {
      onRequest: function (request, reply, next) {
        next();
      },
      preHandler: function (request, reply, next) {
        next();
      },
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    transformSpecification: (swaggerObject, request, reply) => {
      return swaggerObject;
    },
    transformSpecificationClone: true,
  });

  // Authentication middleware
  await fastify.register(authMiddleware);

  // Routes
  await fastify.register(healthRoutes, { prefix: '/api' });
  await fastify.register(workspaceRoutes, { prefix: '/api/workspaces' });
  await fastify.register(documentRoutes, { prefix: '/api/documents' });
  await fastify.register(checklistRoutes, { prefix: '/api/checklist' });
  await fastify.register(changeRoutes, { prefix: '/api/changes' });
  await fastify.register(chatRoutes, { prefix: '/api/chat' });
  await fastify.register(exportRoutes, { prefix: '/api/exports' });
  await fastify.register(uploadRoutes, { prefix: '/api/upload' });
  await fastify.register(runsRoutes, { prefix: '/api' });
  await fastify.register(telemetryRoutes, { prefix: '/api/telemetry' });
  if (config.features.archiveV2) {
    await fastify.register(draftRoutes, { prefix: '/api' });
  }
  if (config.features.strongRag) {
    await fastify.register(ragDebugRoutes, { prefix: '/api/rag' });
  }

  // Graceful shutdown
  const gracefulShutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully`);
    try {
      await fastify.close();
      logger.info('Server closed successfully');
      process.exit(0);
    } catch (error) {
      logger.error({ error }, 'Error during shutdown');
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  return fastify;
}

// Start server if this file is run directly
if (require.main === module) {
  (async () => {
    try {
      const server = await createServer();
      await server.listen({
        port: config.server.port,
        host: config.server.host,
      });

      logger.info(`🚀 Server running at ${config.server.scheme}://${config.server.host}:${config.server.port}`);
      logger.info(`📚 API documentation available at ${config.server.scheme}://${config.server.host}:${config.server.port}/docs`);
    } catch (error) {
      logger.error({ error }, 'Failed to start server');
      process.exit(1);
    }
  })();
}
