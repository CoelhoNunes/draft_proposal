import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { randomUUID } from 'crypto';
import { z } from '@microtech/core';
import { logger } from '../utils/logger.js';
import { incrementCounter } from '../utils/telemetry.js';
import { config } from '../config/index.js';

type DraftStatus = 'draft' | 'final';

const draftStatusSchema = z.enum(['draft', 'final']);

const sectionSchema = z.object({
  id: z.string().optional(),
  heading: z.string().min(1),
  body: z.string().default(''),
  deliverableIds: z.array(z.string()).optional().default([]),
});

const deliverableSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  sectionHint: z.string().optional(),
});

const llmChangeSchema = z.object({
  id: z.string().optional(),
  summary: z.string().min(1),
  content: z.string().min(1),
  createdAt: z.string().optional(),
  highlight: z.boolean().optional(),
  sourceMessageId: z.string().optional(),
});

const sourceSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  page: z.number().int().nonnegative().optional(),
  snippet: z.string().optional(),
});

interface DraftSection {
  id?: string;
  heading: string;
  body: string;
  deliverableIds: string[];
}

interface DraftDeliverable {
  id?: string;
  title: string;
  description?: string;
  sectionHint?: string;
}

interface DraftLlmChange {
  id?: string;
  summary: string;
  content: string;
  createdAt?: string;
  highlight?: boolean;
  sourceMessageId?: string;
}

interface DraftSource {
  id?: string;
  title?: string;
  page?: number;
  snippet?: string;
}

const baseDraftSchema = z.object({
  projectId: z.string().uuid(),
  fileName: z.string().min(1).max(200),
  uniqueSlugOrHash: z.string().optional(),
  pdfId: z.string().uuid().optional(),
  title: z.string().min(1),
  status: draftStatusSchema.default('draft'),
  sections: z.array(sectionSchema).optional().default([]),
  deliverables: z.array(deliverableSchema).optional().default([]),
  llmChanges: z.array(llmChangeSchema).optional().default([]),
  sources: z.array(sourceSchema).optional().default([]),
  version: z.number().int().nonnegative().optional().default(1),
});

interface DraftCreateInput {
  projectId: string;
  fileName: string;
  uniqueSlugOrHash?: string;
  pdfId?: string;
  title: string;
  status: DraftStatus;
  sections: DraftSection[];
  deliverables: DraftDeliverable[];
  llmChanges: DraftLlmChange[];
  sources: DraftSource[];
  version: number;
}

interface DraftRun extends DraftCreateInput {
  id: string;
  createdAt: string;
  updatedAt: string;
}

const draftsStore = new Map<string, DraftRun>();
const archiveStore = new Map<string, DraftRun>();
const projectIndex = new Map<string, Set<string>>();
const projectNameIndex = new Map<string, Map<string, string>>();

const makeSlug = (fileName: string) =>
  fileName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_.]/g, '')
    .replace(/-+/g, '-');

function ensureProjectIndex(projectId: string) {
  if (!projectIndex.has(projectId)) {
    projectIndex.set(projectId, new Set());
  }
  if (!projectNameIndex.has(projectId)) {
    projectNameIndex.set(projectId, new Map());
  }
}

function addToIndex(draft: DraftRun) {
  ensureProjectIndex(draft.projectId);
  projectIndex.get(draft.projectId)!.add(draft.id);
  if (config.features.archiveUniqueNames) {
    projectNameIndex.get(draft.projectId)!.set(draft.fileName.toLowerCase(), draft.id);
  }
}

function removeFromIndex(draft: DraftRun) {
  const ids = projectIndex.get(draft.projectId);
  const names = projectNameIndex.get(draft.projectId);
  if (ids) ids.delete(draft.id);
  if (names && config.features.archiveUniqueNames) names.delete(draft.fileName.toLowerCase());
}

function listDrafts(projectId: string) {
  const ids = projectIndex.get(projectId);
  if (!ids) return [] as DraftRun[];
  return Array.from(ids)
    .map((id) => draftsStore.get(id))
    .filter((draft): draft is DraftRun => Boolean(draft))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

const createLogger = logger.child({ module: 'draftRoutes' });

function buildSuggestedName(fileName: string) {
  const dotIndex = fileName.lastIndexOf('.');
  const base = dotIndex !== -1 ? fileName.slice(0, dotIndex) : fileName;
  const ext = dotIndex !== -1 ? fileName.slice(dotIndex) : '';
  return `${base}_2${ext}`;
}

function handleCreateDraft(payload: DraftCreateInput) {
  ensureProjectIndex(payload.projectId);
  const nameIndex = projectNameIndex.get(payload.projectId)!;
  const lowerName = payload.fileName.toLowerCase();

  if (config.features.archiveUniqueNames && nameIndex.has(lowerName)) {
    createLogger.warn({ projectId: payload.projectId, fileName: payload.fileName }, 'Duplicate draft name blocked');
    return {
      ok: false as const,
      error: 'A draft with that file name already exists for this project.',
      suggestedName: buildSuggestedName(payload.fileName),
    };
  }

  const now = new Date().toISOString();
  const draft: DraftRun = {
    ...payload,
    id: randomUUID(),
    uniqueSlugOrHash: payload.uniqueSlugOrHash ?? makeSlug(payload.fileName),
    createdAt: now,
    updatedAt: now,
  };
  draftsStore.set(draft.id, draft);
  addToIndex(draft);
  createLogger.info({ draftId: draft.id, projectId: draft.projectId }, 'Draft created');
  return {
    ok: true as const,
    draft,
  };
}

const mapSections = (sections: any[] = []): DraftSection[] =>
  sections.map((section: any): DraftSection => ({
    id: section.id,
    heading: section.heading,
    body: section.body ?? '',
    deliverableIds: section.deliverableIds ?? [],
  }));

const mapDeliverables = (deliverables: any[] = []): DraftDeliverable[] =>
  deliverables.map((deliverable: any): DraftDeliverable => ({
    id: deliverable.id,
    title: deliverable.title,
    description: deliverable.description,
    sectionHint: deliverable.sectionHint,
  }));

const mapLlmChanges = (changes: any[] = []): DraftLlmChange[] =>
  changes.map((change: any): DraftLlmChange => ({
    id: change.id,
    summary: change.summary,
    content: change.content,
    createdAt: change.createdAt,
    highlight: change.highlight,
    sourceMessageId: change.sourceMessageId,
  }));

const mapSources = (sources: any[] = []): DraftSource[] =>
  sources.map((source: any): DraftSource => ({
    id: source.id,
    title: source.title,
    page: source.page,
    snippet: source.snippet,
  }));

function toDraftCreateInput(raw: any): DraftCreateInput {
  return {
    projectId: raw.projectId,
    fileName: raw.fileName,
    uniqueSlugOrHash: raw.uniqueSlugOrHash,
    pdfId: raw.pdfId,
    title: raw.title,
    status: (raw.status ?? 'draft') as DraftStatus,
    sections: mapSections(raw.sections),
    deliverables: mapDeliverables(raw.deliverables),
    llmChanges: mapLlmChanges(raw.llmChanges),
    sources: mapSources(raw.sources),
    version: raw.version ?? 1,
  };
}

function toDraftUpdate(raw: any): Partial<DraftCreateInput> {
  const update: Partial<DraftCreateInput> = {};
  if (raw.fileName !== undefined) update.fileName = raw.fileName;
  if (raw.uniqueSlugOrHash !== undefined) update.uniqueSlugOrHash = raw.uniqueSlugOrHash;
  if (raw.pdfId !== undefined) update.pdfId = raw.pdfId;
  if (raw.title !== undefined) update.title = raw.title;
  if (raw.status !== undefined) update.status = raw.status as DraftStatus;
  if (raw.sections !== undefined) update.sections = mapSections(raw.sections ?? []);
  if (raw.deliverables !== undefined) update.deliverables = mapDeliverables(raw.deliverables ?? []);
  if (raw.llmChanges !== undefined) update.llmChanges = mapLlmChanges(raw.llmChanges ?? []);
  if (raw.sources !== undefined) update.sources = mapSources(raw.sources ?? []);
  if (raw.version !== undefined) update.version = raw.version;
  return update;
}

export async function draftRoutes(fastify: FastifyInstance) {
  fastify.addHook('onClose', async () => {
    draftsStore.clear();
    archiveStore.clear();
    projectIndex.clear();
    projectNameIndex.clear();
  });

  fastify.get(
    '/projects/:projectId/drafts',
    async (request: FastifyRequest<{ Params: { projectId: string }; Querystring: { search?: string; page?: string; limit?: string; status?: DraftStatus } }>) => {
      const paramsSchema = z.object({ projectId: z.string().uuid() });
      const querySchema = z.object({
        search: z.string().optional(),
        page: z.string().optional(),
        limit: z.string().optional(),
        status: draftStatusSchema.optional(),
      });

      const { projectId } = paramsSchema.parse(request.params);
      const { search, page, limit, status } = querySchema.parse(request.query ?? {});

      const filtered = listDrafts(projectId).filter((draft) => {
        if (status && draft.status !== status) {
          return false;
        }
        if (!search) return true;
        const needle = search.toLowerCase();
        return (
          draft.fileName.toLowerCase().includes(needle) ||
          draft.title.toLowerCase().includes(needle) ||
          draft.sections.some((section) => section.heading.toLowerCase().includes(needle))
        );
      });

      const limitNumber = limit ? Math.max(parseInt(limit, 10) || 10, 1) : 10;
      const pageNumber = page ? Math.max(parseInt(page, 10) || 1, 1) : 1;
      const start = (pageNumber - 1) * limitNumber;
      const data = filtered.slice(start, start + limitNumber);

      return {
        success: true,
        data,
        pagination: {
          total: filtered.length,
          page: pageNumber,
          limit: limitNumber,
        },
      };
    },
  );

  fastify.post('/drafts', async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = baseDraftSchema.parse(request.body);
    const payload = toDraftCreateInput(parsed);
    const result = handleCreateDraft(payload);
    if (!result.ok) {
      reply.code(409);
      return { success: false, error: result.error, suggestedName: result.suggestedName };
    }
    reply.code(201);
    return { success: true, data: result.draft };
  });

  fastify.get('/drafts/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const paramsSchema = z.object({ id: z.string().uuid() });
    const { id } = paramsSchema.parse(request.params);
    const draft = draftsStore.get(id);
    if (!draft) {
      reply.code(404);
      return { success: false, error: 'Draft not found' };
    }
    return { success: true, data: draft };
  });

  fastify.patch('/drafts/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const paramsSchema = z.object({ id: z.string().uuid() });
    const { id } = paramsSchema.parse(request.params);
    const draft = draftsStore.get(id);
    if (!draft) {
      reply.code(404);
      return { success: false, error: 'Draft not found' };
    }

    const updateSchema = baseDraftSchema.partial().omit({ projectId: true });
    const updatesRaw = updateSchema.parse(request.body ?? {});
    const updates = toDraftUpdate(updatesRaw);

    if (
      config.features.archiveUniqueNames &&
      updates.fileName &&
      updates.fileName.toLowerCase() !== draft.fileName.toLowerCase()
    ) {
      ensureProjectIndex(draft.projectId);
      const nameIndex = projectNameIndex.get(draft.projectId)!;
      if (nameIndex.has(updates.fileName.toLowerCase())) {
        reply.code(409);
        return {
          success: false,
          error: 'A draft with that file name already exists for this project.',
          suggestedName: buildSuggestedName(updates.fileName),
        };
      }
      removeFromIndex(draft);
      draft.fileName = updates.fileName;
      addToIndex(draft);
    }

    const now = new Date().toISOString();
    const updatedDraft: DraftRun = {
      ...draft,
      ...updates,
      uniqueSlugOrHash: updates.fileName ? makeSlug(updates.fileName) : draft.uniqueSlugOrHash,
      sections: updates.sections ?? draft.sections,
      deliverables: updates.deliverables ?? draft.deliverables,
      llmChanges: updates.llmChanges ?? draft.llmChanges,
      sources: updates.sources ?? draft.sources,
      version: updates.version ?? draft.version,
      updatedAt: now,
    };
    draftsStore.set(id, updatedDraft);
    createLogger.info({ draftId: id }, 'Draft updated');
    return { success: true, data: updatedDraft };
  });

  fastify.post('/archive', async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = baseDraftSchema.parse(request.body);
    const payload = toDraftCreateInput(parsed);
    const result = handleCreateDraft(payload);
    if (!result.ok) {
      incrementCounter('archive_save_fail');
      reply.code(409);
      return { success: false, error: result.error, suggestedName: result.suggestedName };
    }
    const draft = result.draft;
    archiveStore.set(draft.id, draft);
    incrementCounter('archive_save_success');
    reply.code(201);
    return { success: true, data: draft };
  });

  fastify.get('/archive/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const paramsSchema = z.object({ id: z.string().uuid() });
    const { id } = paramsSchema.parse(request.params);
    const draft = archiveStore.get(id) ?? draftsStore.get(id);
    if (!draft) {
      reply.code(404);
      return { success: false, error: 'Archived draft not found' };
    }
    return { success: true, data: draft };
  });
}

export type { DraftRun };
