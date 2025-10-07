/**
 * @fileoverview Draft run archive routes (feature flagged via FF_ARCHIVE_V2).
 *
 * These handlers provide an in-memory persistence layer for draft runs so the
 * front-end can start integrating with the Archive V2 flows without waiting on
 * the production database schema. The in-memory approach keeps the existing API
 * backwards compatible while providing deterministic behaviour for automated
 * tests.
 */

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { randomUUID } from 'crypto';
import { z } from '@microtech/core';
import { logger } from '../utils/logger';

const DraftStatusEnum = z.enum(['draft', 'processing', 'completed', 'failed']);

const draftSourceSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  page: z.number().int().positive().optional(),
  snippet: z.string().optional(),
});

const deliverableSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  status: DraftStatusEnum.optional(),
});

interface DraftCreateSchema {
  parse(input: unknown): DraftCreateInput;
  omit(keys: Record<string, true>): {
    partial(): {
      extend(shape: { status: ReturnType<typeof DraftStatusEnum.optional> }): {
        parse(input: unknown): Partial<DraftCreateInput>;
      };
    };
  };
}

const draftCreateSchema = z.object({
  projectId: z.string().uuid(),
  pdfId: z.string().uuid(),
  title: z.string().min(1).max(200),
  status: DraftStatusEnum.default('draft'),
  summary: z.string().optional(),
  llmPlan: z.string().optional(),
  deliverables: z.array(deliverableSchema).optional().default([]),
  sources: z.array(draftSourceSchema).optional().default([]),
  tokensUsed: z.number().int().nonnegative().optional(),
}) as unknown as DraftCreateSchema;

const draftUpdateSchema: { parse(input: unknown): Partial<DraftCreateInput> } = draftCreateSchema
  .omit({ projectId: true, pdfId: true })
  .partial()
  .extend({
    status: DraftStatusEnum.optional(),
  });

type DraftStatus = 'draft' | 'processing' | 'completed' | 'failed';

interface DraftSource {
  id?: string;
  title: string;
  page?: number;
  snippet?: string;
}

interface DraftDeliverable {
  id?: string;
  title: string;
  description?: string;
  status?: DraftStatus;
}

interface DraftCreateInput {
  projectId: string;
  pdfId: string;
  title: string;
  status: DraftStatus;
  summary?: string;
  llmPlan?: string;
  deliverables: DraftDeliverable[];
  sources: DraftSource[];
  tokensUsed?: number;
}

type DraftRun = DraftCreateInput & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

const draftsStore = new Map<string, DraftRun>();
const projectIndex = new Map<string, Set<string>>();

function listProjectDrafts(projectId: string) {
  const ids = projectIndex.get(projectId);
  if (!ids) return [] as DraftRun[];
  return Array.from(ids)
    .map((id) => draftsStore.get(id)!)
    .filter(Boolean)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

function indexDraft(draft: DraftRun) {
  if (!projectIndex.has(draft.projectId)) {
    projectIndex.set(draft.projectId, new Set());
  }
  projectIndex.get(draft.projectId)!.add(draft.id);
}

export async function draftRoutes(fastify: FastifyInstance) {
  fastify.addHook('onClose', async () => {
    draftsStore.clear();
    projectIndex.clear();
  });

  fastify.get('/projects/:projectId/drafts', async (request: FastifyRequest, reply: FastifyReply) => {
    const paramsSchema = z.object({ projectId: z.string().uuid() });
    const querySchema = z.object({
      search: z.string().trim().optional(),
      status: DraftStatusEnum.optional(),
    });

    const { projectId } = paramsSchema.parse(request.params);
    const { search, status } = querySchema.parse(request.query ?? {});

    const results = listProjectDrafts(projectId).filter((draft) => {
      if (status && draft.status !== status) return false;
      if (!search) return true;
      const needle = search.toLowerCase();
      return (
        draft.title.toLowerCase().includes(needle) ||
        (draft.summary?.toLowerCase().includes(needle) ?? false) ||
        draft.deliverables.some((item: DraftRun['deliverables'][number]) =>
          item.title.toLowerCase().includes(needle)
        )
      );
    });

    return {
      success: true,
      data: results,
      pagination: {
        total: results.length,
      },
    };
  });

  fastify.post('/drafts', async (request: FastifyRequest, reply: FastifyReply) => {
    const payload = draftCreateSchema.parse(request.body) as DraftCreateInput;

    const now = new Date().toISOString();
    const draft: DraftRun = {
      ...payload,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
      deliverables: payload.deliverables ?? [],
      sources: payload.sources ?? [],
    };

    draftsStore.set(draft.id, draft);
    indexDraft(draft);

    logger.info({ draftId: draft.id, projectId: draft.projectId }, 'Draft created');

    reply.code(201);
    return {
      success: true,
      data: draft,
    };
  });

  fastify.get('/drafts/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const paramsSchema = z.object({ id: z.string().uuid() });
    const { id } = paramsSchema.parse(request.params);

    const draft = draftsStore.get(id);
    if (!draft) {
      reply.code(404);
      return {
        success: false,
        error: 'Draft not found',
      };
    }

    return {
      success: true,
      data: draft,
    };
  });

  fastify.patch('/drafts/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const paramsSchema = z.object({ id: z.string().uuid() });
    const { id } = paramsSchema.parse(request.params);
    const updates = draftUpdateSchema.parse(request.body) as Partial<DraftCreateInput>;

    const draft = draftsStore.get(id);
    if (!draft) {
      reply.code(404);
      return {
        success: false,
        error: 'Draft not found',
      };
    }

    const updatedDraft: DraftRun = {
      ...draft,
      ...updates,
      updatedAt: new Date().toISOString(),
      deliverables: updates.deliverables ?? draft.deliverables,
      sources: updates.sources ?? draft.sources,
    };

    draftsStore.set(id, updatedDraft);
    indexDraft(updatedDraft);

    logger.info({ draftId: id }, 'Draft updated');

    return {
      success: true,
      data: updatedDraft,
    };
  });
}

export type { DraftRun };
