import test from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import { healthRoutes } from '../dist/routes/health.js';

async function buildServer() {
  const fastify = Fastify();
  await fastify.register(healthRoutes, { prefix: '/api' });
  await fastify.ready();
  return fastify;
}

test('GET /health returns 200', async (t) => {
  const fastify = await buildServer();
  t.after(() => fastify.close());

  const response = await fastify.inject({
    method: 'GET',
    url: '/api/health',
  });

  assert.equal(response.statusCode, 200);
  const body = response.json();
  assert.equal(body.status, 'ok');
  assert.equal(typeof body.timestamp, 'string');
});
