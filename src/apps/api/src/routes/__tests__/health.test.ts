import { test, expect } from 'vitest';
import Fastify from 'fastify';
import healthRoutes from '../health';

test('GET /health returns 200', async () => {
  const fastify = Fastify();
  await fastify.register(healthRoutes);
  await fastify.ready();

  const response = await fastify.inject({
    method: 'GET',
    url: '/health'
  });

  expect(response.statusCode).toBe(200);
  expect(response.json()).toMatchObject({
    status: 'ok',
    timestamp: expect.any(String)
  });
});
