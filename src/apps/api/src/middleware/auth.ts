/**
 * @fileoverview Authentication middleware
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config';
import { logger } from '../utils/logger';
import { sign as signJwt, verify as verifyJwt } from '../utils/jwt';

interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export async function authMiddleware(fastify: FastifyInstance) {
  // Add authentication decorator
  fastify.decorateRequest('user', null);

  // Authentication hook
  fastify.addHook('preHandler', async (request: AuthenticatedRequest, reply: FastifyReply) => {
    // Skip auth for public routes
    const publicRoutes = [
      '/api/health',
      '/api/docs',
      '/api/docs/static',
      '/api/docs/json',
      // Allow chat endpoints publicly so the frontend can call LLM without auth in this workspace
      '/api/chat/send',
      // Allow uploads to be analyzed by the LLM without auth in this workspace
      '/api/upload/pdf',
    ];

    if (publicRoutes.some(route => request.url.startsWith(route))) {
      return;
    }

    // Check for Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        success: false,
        error: 'Authorization header required',
      });
    }

    const token = authHeader.substring(7);

    try {
      // Verify JWT token
      const decoded = verifyJwt(token, config.auth.jwtSecret) as {
        id?: string;
        email?: string;
        name?: string;
      };

      if (!decoded || typeof decoded !== 'object' || !decoded.id || !decoded.email || !decoded.name) {
        throw new Error('Malformed token payload');
      }

      // Set user information
      request.user = {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
      };

      logger.debug({ userId: decoded.id }, 'User authenticated');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown authentication failure';
      logger.warn({ error: message }, 'Authentication failed');

      return reply.status(401).send({
        success: false,
        error: 'Invalid or expired token',
      });
    }
  });
}

// Helper function to generate JWT token
export function generateToken(user: { id: string; email: string; name: string }): string {
  return signJwt(
    {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    config.auth.jwtSecret,
    {
      expiresIn: config.auth.jwtExpiresIn,
    }
  );
}

// Helper function to verify JWT token
export function verifyToken(token: string): any {
  return verifyJwt(token, config.auth.jwtSecret);
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      name: string;
    };
  }
}
