/**
 * @fileoverview Observability helpers for Retrieval-Augmented Generation (RAG).
 */

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { config } from '../config';

export async function ragDebugRoutes(fastify: FastifyInstance) {
  fastify.get('/debug', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!config.features.strongRag) {
      return reply.status(404).send({
        success: false,
        error: 'RAG debugging tools are disabled',
      });
    }

    return {
      success: true,
      data: {
        rag: config.rag,
        features: config.features,
      },
    };
  });
}
