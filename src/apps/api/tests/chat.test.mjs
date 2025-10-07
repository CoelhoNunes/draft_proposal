import test from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';

process.env.OPENAI_KEY = '';

const { chatRoutes } = await import('../dist/routes/chat.js');
const { errorHandler } = await import('../dist/middleware/errorHandler.js');

async function buildServer() {
  const fastify = Fastify();
  fastify.setErrorHandler(errorHandler);
  await fastify.register(chatRoutes, { prefix: '/api/chat' });
  await fastify.ready();
  return fastify;
}

test('POST /api/chat/send returns a mock response when no API key is configured', async (t) => {
  const fastify = await buildServer();
  t.after(() => fastify.close());

  const response = await fastify.inject({
    method: 'POST',
    url: '/api/chat/send',
    payload: {
      message: 'Hello assistant, summarize the compliance section.',
    },
  });

  assert.equal(response.statusCode, 200);
  const body = response.json();
  assert.equal(body.success, true);
  assert.equal(body.data.role, 'assistant');
  assert.match(body.data.content, /Mock Assistant/);
});

test('POST /api/chat/edit returns a structured mock edit proposal', async (t) => {
  const fastify = await buildServer();
  t.after(() => fastify.close());

  const response = await fastify.inject({
    method: 'POST',
    url: '/api/chat/edit',
    payload: {
      context: 'The system shall maintain an audit log.',
      instruction: 'Clarify retention requirements',
      workspaceId: '123e4567-e89b-12d3-a456-426614174000',
    },
  });

  assert.equal(response.statusCode, 200);
  const body = response.json();
  assert.equal(body.success, true);
  assert.equal(body.data.operations[0].type, 'insert');
  assert.match(body.data.operations[0].content, /Clarify retention requirements/);
});

test('POST /api/chat/send validates input payloads', async (t) => {
  const fastify = await buildServer();
  t.after(() => fastify.close());

  const response = await fastify.inject({
    method: 'POST',
    url: '/api/chat/send',
    payload: {
      message: '',
    },
  });

  assert.equal(response.statusCode, 400);
  const body = response.json();
  assert.equal(body.success, false);
  assert.ok(
    body.error === 'Validation failed' || /must NOT have fewer than 1 characters/.test(body.error),
    `Unexpected validation error message: ${body.error}`
  );
});
