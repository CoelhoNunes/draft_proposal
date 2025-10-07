import test from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import { draftRoutes } from '../dist/routes/drafts.js';

process.env.FF_ARCHIVE_UNIQUE_NAMES = 'true';

async function buildServer() {
  const fastify = Fastify();
  await fastify.register(draftRoutes, { prefix: '/api' });
  await fastify.ready();
  return fastify;
}

const basePayload = {
  projectId: '11111111-1111-1111-1111-111111111111',
  fileName: 'proposal-draft.md',
  title: 'Initial Draft',
  status: 'draft',
  sections: [
    { heading: 'Executive Summary', body: 'Summary paragraph.' },
  ],
  deliverables: [
    { title: 'Plan of Actions and Milestones' },
  ],
  llmChanges: [],
  sources: [],
};

test('create, fetch and update a draft with unique enforcement', async (t) => {
  const fastify = await buildServer();
  t.after(() => fastify.close());

  const createResponse = await fastify.inject({
    method: 'POST',
    url: '/api/drafts',
    payload: basePayload,
  });

  assert.equal(createResponse.statusCode, 201);
  const created = createResponse.json().data;
  assert.ok(created.id);
  assert.equal(created.fileName, basePayload.fileName);

  const duplicateResponse = await fastify.inject({
    method: 'POST',
    url: '/api/drafts',
    payload: basePayload,
  });
  assert.equal(duplicateResponse.statusCode, 409);
  assert.equal(duplicateResponse.json().success, false);
  assert.ok(duplicateResponse.json().suggestedName.includes('_2'));

  const listResponse = await fastify.inject({
    method: 'GET',
    url: `/api/projects/${basePayload.projectId}/drafts?page=1&limit=5`,
  });
  assert.equal(listResponse.statusCode, 200);
  assert.equal(listResponse.json().data.length, 1);
  assert.equal(listResponse.json().pagination.total, 1);

  const updateResponse = await fastify.inject({
    method: 'PATCH',
    url: `/api/drafts/${created.id}`,
    payload: { title: 'Updated Draft' },
  });
  assert.equal(updateResponse.statusCode, 200);
  assert.equal(updateResponse.json().data.title, 'Updated Draft');

  const archiveResponse = await fastify.inject({
    method: 'POST',
    url: '/api/archive',
    payload: {
      ...basePayload,
      fileName: 'proposal-draft-2.md',
      title: 'Archived Draft',
    },
  });
  assert.equal(archiveResponse.statusCode, 201);
  const archivedId = archiveResponse.json().data.id;

  const listAfterArchive = await fastify.inject({
    method: 'GET',
    url: `/api/projects/${basePayload.projectId}/drafts`,
  });
  assert.equal(listAfterArchive.json().data.length, 2);

  const archiveGet = await fastify.inject({
    method: 'GET',
    url: `/api/archive/${archivedId}`,
  });
  assert.equal(archiveGet.statusCode, 200);
  assert.equal(archiveGet.json().data.title, 'Archived Draft');
});
