import test from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import { draftRoutes } from '../dist/routes/drafts.js';

async function buildServer() {
  const fastify = Fastify();
  await fastify.register(draftRoutes, { prefix: '/api' });
  await fastify.ready();
  return fastify;
}

test('create, fetch and update a draft', async (t) => {
  const fastify = await buildServer();
  t.after(() => fastify.close());

  const samplePayload = {
    projectId: '11111111-1111-1111-1111-111111111111',
    pdfId: '22222222-2222-2222-2222-222222222222',
    title: 'Initial Draft',
    summary: 'Executive summary placeholder',
  };

  const createResponse = await fastify.inject({
    method: 'POST',
    url: '/api/drafts',
    payload: samplePayload,
  });

  assert.equal(createResponse.statusCode, 201);
  const created = createResponse.json().data;
  assert.deepEqual(
    {
      projectId: created.projectId,
      pdfId: created.pdfId,
      title: created.title,
      status: created.status,
    },
    {
      projectId: samplePayload.projectId,
      pdfId: samplePayload.pdfId,
      title: samplePayload.title,
      status: 'draft',
    },
  );

  const listResponse = await fastify.inject({
    method: 'GET',
    url: `/api/projects/${samplePayload.projectId}/drafts`,
  });
  assert.equal(listResponse.statusCode, 200);
  assert.equal(listResponse.json().data.length, 1);

  const updateResponse = await fastify.inject({
    method: 'PATCH',
    url: `/api/drafts/${created.id}`,
    payload: { status: 'completed', summary: 'Updated summary' },
  });
  assert.equal(updateResponse.statusCode, 200);
  assert.equal(updateResponse.json().data.status, 'completed');
  assert.equal(updateResponse.json().data.summary, 'Updated summary');

  const getResponse = await fastify.inject({
    method: 'GET',
    url: `/api/drafts/${created.id}`,
  });
  assert.equal(getResponse.statusCode, 200);
  assert.equal(getResponse.json().data.id, created.id);
});

test('returns 404 for unknown draft', async (t) => {
  const fastify = await buildServer();
  t.after(() => fastify.close());

  const response = await fastify.inject({
    method: 'GET',
    url: '/api/drafts/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  });

  assert.equal(response.statusCode, 404);
});

test('filters drafts by search term and status', async (t) => {
  const fastify = await buildServer();
  t.after(() => fastify.close());

  const samplePayload = {
    projectId: '11111111-1111-1111-1111-111111111111',
    pdfId: '22222222-2222-2222-2222-222222222222',
    title: 'Initial Draft',
    summary: 'Executive summary placeholder',
  };

  await fastify.inject({ method: 'POST', url: '/api/drafts', payload: samplePayload });
  await fastify.inject({
    method: 'POST',
    url: '/api/drafts',
    payload: {
      ...samplePayload,
      pdfId: '33333333-3333-3333-3333-333333333333',
      title: 'Security Deliverable Plan',
      status: 'completed',
      summary: 'Includes SSP and POA&M deliverables',
    },
  });

  const filteredByStatus = await fastify.inject({
    method: 'GET',
    url: `/api/projects/${samplePayload.projectId}/drafts?status=completed`,
  });
  assert.equal(filteredByStatus.json().data.length, 1);

  const filteredBySearch = await fastify.inject({
    method: 'GET',
    url: `/api/projects/${samplePayload.projectId}/drafts?search=deliverable`,
  });
  assert.equal(filteredBySearch.json().data.length, 1);
});
