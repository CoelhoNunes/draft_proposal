import { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from '@microtech/core';
import { getCounters, incrementCounter } from '../utils/telemetry.js';

export async function telemetryRoutes(fastify: FastifyInstance) {
  fastify.post('/counter', async (request: FastifyRequest) => {
    const schema = z.object({ name: z.string().min(1) });
    const { name } = schema.parse(request.body ?? {});
    incrementCounter(name);
    return { success: true };
  });

  fastify.get('/counter', async () => {
    return { success: true, data: getCounters() };
  });
}
