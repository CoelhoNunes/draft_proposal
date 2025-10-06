/**
 * @fileoverview Change log management routes
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../utils/logger.js';

export async function changeRoutes(fastify: FastifyInstance) {
  // TODO: Implement change routes
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    return { success: true, data: [], message: 'Changes endpoint - TODO' };
  });
}
