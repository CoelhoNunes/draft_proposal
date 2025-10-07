import { randomUUID } from 'crypto';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from '@microtech/core';
import { ChatService, ChatConfig } from '@microtech/ai';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
  order: number;
}

interface Deliverable {
  id: string;
  runId: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  checklistItems: ChecklistItem[];
}

interface Section {
  id: string;
  heading: string;
  content: string;
  order: number;
}

interface HighlightAnchor {
  startOffset: number;
  endOffset: number;
}

interface LlmChange {
  id: string;
  runId: string;
  sectionId: string | null;
  summary: string;
  insertedText: string;
  createdAt: string;
  approvedByUser: boolean;
  highlightAnchor: HighlightAnchor | null;
  sourceMessageId?: string;
}

interface ChatSuggestion {
  id: string;
  summary: string;
  content: string;
  status: 'pending' | 'inserted' | 'dismissed';
}

interface ChatEntry {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  suggestions?: ChatSuggestion[];
}

interface RunRecord {
  id: string;
  projectId: string | null;
  runName: string;
  fileName: string;
  status: 'draft' | 'exported';
  createdAt: string;
  updatedAt: string;
  deliverables: Deliverable[];
  sections: Section[];
  llmChanges: LlmChange[];
  chat: ChatEntry[];
  pdfMeta: { filename: string; pages: number } | null;
  exports: Array<{ id: string; createdAt: string }>;
}

interface ArchiveEntry {
  id: string;
  runId: string;
  runName: string;
  fileName: string;
  createdAt: string;
  updatedAt: string;
  snapshot: RunRecord;
}

const runs = new Map<string, RunRecord>();
const runNameIndex = new Map<string, string>();
const deliverableIndex = new Map<string, string>();
const archives = new Map<string, ArchiveEntry>();

const runLogger = logger.child({ module: 'runsRoutes' });

const baseChatConfig: ChatConfig = {
  provider:
    config.ai.apiKey && (config.ai.provider === 'azure' || config.ai.provider === 'custom')
      ? config.ai.provider
      : config.ai.apiKey
      ? 'openai'
      : 'mock',
  apiKey: config.ai.apiKey,
  baseUrl: config.ai.baseUrl,
  model: config.ai.model,
  temperature: config.ai.temperature ?? 0.3,
  maxTokens: config.ai.maxTokens ?? 1200,
};

const chatService = new ChatService(baseChatConfig);

const createRunSchema = z.object({
  runName: z.string().min(1).max(160),
  fileName: z.string().min(1).max(200),
  projectId: z.string().uuid().optional(),
});

const updateRunSchema = z.object({
  runName: z.string().min(1).max(160).optional(),
  status: z.enum(['draft', 'exported']).optional(),
  sections: z
    .array(
      z.object({
        id: z.string().uuid(),
        heading: z.string(),
        content: z.string(),
        order: z.number().int().nonnegative(),
      }),
    )
    .optional(),
  deliverables: z
    .array(
      z.object({
        id: z.string().uuid(),
        title: z.string(),
        description: z.string().optional(),
        status: z.enum(['todo', 'in_progress', 'done']),
        checklistItems: z
          .array(
            z.object({
              id: z.string().uuid(),
              text: z.string(),
              done: z.boolean(),
              order: z.number().int().nonnegative(),
            }),
          )
          .optional(),
      }),
    )
    .optional(),
  llmChanges: z
    .array(
      z.object({
        id: z.string().uuid(),
        sectionId: z.string().uuid().nullable(),
        summary: z.string(),
        insertedText: z.string(),
        createdAt: z.string(),
        approvedByUser: z.boolean(),
        highlightAnchor: z
          .object({
            startOffset: z.number().int().nonnegative(),
            endOffset: z.number().int().nonnegative(),
          })
          .nullable(),
      }),
    )
    .optional(),
});

const deliverableCollectionSchema = z.object({
  deliverables: z.array(
    z.object({
      title: z.string().min(1),
      description: z.string().optional().default(''),
      checklist: z.array(z.string()).optional().default([]),
    }),
  ),
});

const commitChangeSchema = z.object({
  sectionId: z.string().uuid().nullable(),
  insertedText: z.string().min(1),
  summary: z.string().min(1),
  anchor: z
    .object({
      startOffset: z.number().int().nonnegative(),
      endOffset: z.number().int().nonnegative(),
    })
    .nullable()
    .optional(),
  sourceMessageId: z.string().optional(),
  suggestionId: z.string().optional(),
});

const suggestionStatusSchema = z.object({
  suggestionId: z.string().min(1),
  status: z.enum(['pending', 'inserted', 'dismissed']),
});

const suggestionRequestSchema = z.object({
  prompt: z.string().min(1).max(4000),
  sectionId: z.string().uuid().optional().nullable(),
  cursor: z.number().int().nonnegative().optional(),
});

const exportRequestSchema = z.object({});

const sanitizeText = (value: string) => value.replace(/\s+/g, ' ').trim();

const buildSuggestedName = (name: string) => {
  const dotIndex = name.lastIndexOf('.');
  const base = dotIndex >= 0 ? name.slice(0, dotIndex) : name;
  const ext = dotIndex >= 0 ? name.slice(dotIndex) : '';
  return `${base}_2${ext}`;
};

const serialiseRun = (run: RunRecord) => ({
  ...run,
  deliverables: run.deliverables.map((deliverable) => ({
    ...deliverable,
  })),
  sections: run.sections.map((section) => ({ ...section })),
  llmChanges: run.llmChanges.map((change) => ({ ...change })),
  chat: run.chat.map((entry) => ({
    ...entry,
    suggestions: entry.suggestions ? entry.suggestions.map((suggestion) => ({ ...suggestion })) : undefined,
  })),
});

const ensureArchive = (run: RunRecord) => {
  const snapshot: RunRecord = JSON.parse(JSON.stringify(run));
  const entry: ArchiveEntry = archives.get(run.id) ?? {
    id: run.id,
    runId: run.id,
    runName: run.runName,
    fileName: run.fileName,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
    snapshot,
  };
  entry.runName = run.runName;
  entry.fileName = run.fileName;
  entry.updatedAt = run.updatedAt;
  entry.snapshot = snapshot;
  archives.set(run.id, entry);
};

const updateDeliverableIndex = (run: RunRecord) => {
  run.deliverables.forEach((deliverable) => {
    deliverableIndex.set(deliverable.id, run.id);
  });
};

const parseJsonFromModel = <T>(value: string, fallback: T): T => {
  const start = value.indexOf('{');
  const end = value.lastIndexOf('}');
  if (start === -1 || end === -1) {
    return fallback;
  }
  try {
    return JSON.parse(value.slice(start, end + 1)) as T;
  } catch (error) {
    runLogger.warn({ error: (error as Error).message }, 'Failed to parse JSON payload from model');
    return fallback;
  }
};

const defaultPlan = (runName: string, fileName: string) => {
  const changeText = `This draft for ${runName} summarises the uploaded document ${fileName}.

• Provide an executive summary highlighting security outcomes.
• Detail FedRAMP control alignment and mitigation activities.
• Outline deliverables, timelines, and responsible parties.`;
  return {
    summary: `Initial draft generated for ${runName}.`,
    draft: `# Executive Summary\n${changeText}\n\n# Security Implementation\nDescribe control families, inherited controls, and compensating measures.\n\n# Compliance & Assurance\nDocument testing cadence, evidence handling, and continuous monitoring.`,
    deliverables: [
      {
        title: 'System Security Plan (SSP) Refresh',
        description: 'Update SSP with current architecture diagrams, components, and boundary definition.',
        checklist: [
          'Confirm latest asset inventory and network diagrams',
          'Validate control implementations for all FedRAMP families',
        ],
      },
      {
        title: 'Plan of Action & Milestones (POA&M)',
        description: 'Compile remediation tasks with owners and completion dates.',
        checklist: [
          'List all open findings with severity ratings',
          'Assign remediation owners and target dates',
        ],
      },
      {
        title: 'Continuous Monitoring Strategy',
        description: 'Summarise monthly/quarterly monitoring cadence and reporting workflow.',
        checklist: [
          'Define metrics and tooling for ongoing monitoring',
          'Identify escalation paths and notification windows',
        ],
      },
    ],
  };
};

const generatePlan = async (run: RunRecord, fileBuffer: Buffer | null, companyPrompt?: string) => {
  const placeholder = defaultPlan(run.runName, run.fileName);
  try {
    const systemPrompt =
      'You are a FedRAMP proposal assistant. Produce JSON with keys summary (string), draft (markdown string), and deliverables (array of objects with title, description, checklist array of bullet strings). Keep checklist actionable.';
    const descriptor = fileBuffer
      ? `The PDF (${run.fileName}) contains ${Math.max(Math.round(fileBuffer.length / 1024), 1)}KB of material. Use any readable text snippets below if helpful.\n\n${fileBuffer.toString('utf8').slice(0, 2000)}`
      : `No PDF text was readable. Base the outline on the company prompt and run metadata.`;
    const userPrompt = `Company prompt: ${companyPrompt || 'MicroTech federal solutions emphasising compliance readiness.'}\n\nRun name: ${run.runName}\nFile: ${run.fileName}\n\n${descriptor}`;
    const response = await chatService.sendMessage([
      {
        id: `sys_${Date.now()}`,
        role: 'system',
        content: systemPrompt,
        timestamp: new Date(),
      },
      {
        id: `user_${Date.now()}`,
        role: 'user',
        content: userPrompt,
        timestamp: new Date(),
      },
    ]);
    const parsed = parseJsonFromModel(response, placeholder);
    return parsed;
  } catch (error) {
    runLogger.warn({ error: (error as Error).message }, 'Falling back to default plan');
    return placeholder;
  }
};

const generateSuggestions = async (
  run: RunRecord,
  prompt: string,
): Promise<{ suggestions: ChatSuggestion[]; summary: string }> => {
  const fallback: { suggestions: ChatSuggestion[]; summary: string } = {
    summary: 'Draft alternatives generated locally.',
    suggestions: [
      {
        id: randomUUID(),
        summary: 'Structured compliance response',
        content: `Provide a structured answer that references the FedRAMP control families relevant to "${prompt}" and outlines key actions, owners, and evidence expectations.`,
        status: 'pending',
      },
      {
        id: randomUUID(),
        summary: 'Risk mitigation emphasis',
        content: `Create a paragraph describing risk mitigation activities for "${prompt}", including monitoring cadence and reporting artifacts.`,
        status: 'pending',
      },
    ],
  };

  try {
    const context = run.sections
      .map((section) => `## ${section.heading}\n${section.content}`)
      .join('\n\n')
      .slice(0, 4000);
    const systemPrompt =
      'You are an expert proposal editor. Respond in JSON with keys summary (string) and suggestions (array of 2-4 objects each with summary and content fields). Make content professional, concise, and ready for direct insertion.';
    const userPrompt = `Current proposal context:\n${context || 'No draft content yet.'}\n\nRequest:\n${prompt}`;

    const response = await chatService.sendMessage([
      {
        id: `sys_${Date.now()}`,
        role: 'system',
        content: systemPrompt,
        timestamp: new Date(),
      },
      {
        id: `user_${Date.now()}`,
        role: 'user',
        content: userPrompt,
        timestamp: new Date(),
      },
    ]);
    const parsed = parseJsonFromModel(response, {
      summary: 'Generated suggestions.',
      suggestions: fallback.suggestions.map((item) => ({ summary: item.summary, content: item.content })),
    });
    const suggestions = (parsed.suggestions || []).slice(0, 4).map((item: any) => ({
      id: randomUUID(),
      summary: sanitizeText(item.summary || prompt.slice(0, 60)),
      content: sanitizeText(item.content || ''),
      status: 'pending' as const,
    }));
    if (suggestions.length < 2) {
      return fallback;
    }
    return {
      summary: sanitizeText(parsed.summary || 'Generated suggestions.'),
      suggestions,
    };
  } catch (error) {
    runLogger.warn({ error: (error as Error).message }, 'Falling back to default suggestions');
    return fallback;
  }
};

const computeExportReady = (run: RunRecord) =>
  run.deliverables.length > 0 &&
  run.deliverables.every(
    (deliverable) =>
      deliverable.status === 'done' && deliverable.checklistItems.every((item) => item.done),
  );

const insertInitialPlan = (run: RunRecord, plan: { summary: string; draft: string; deliverables: Array<{ title: string; description?: string; checklist?: string[] }> }) => {
  const sectionId = randomUUID();
  const section: Section = {
    id: sectionId,
    heading: 'Executive Summary',
    content: plan.draft,
    order: 0,
  };
  run.sections = [section];
  run.deliverables = plan.deliverables.map((item, index) => ({
    id: randomUUID(),
    runId: run.id,
    title: sanitizeText(item.title),
    description: sanitizeText(item.description || ''),
    status: 'todo',
    checklistItems: (item.checklist || []).map((entry, idx) => ({
      id: randomUUID(),
      text: sanitizeText(entry),
      done: false,
      order: idx,
    })),
  }));
  const change: LlmChange = {
    id: randomUUID(),
    runId: run.id,
    sectionId,
    summary: sanitizeText(plan.summary || 'Initial draft generated'),
    insertedText: plan.draft,
    createdAt: new Date().toISOString(),
    approvedByUser: true,
    highlightAnchor: { startOffset: 0, endOffset: plan.draft.length },
  };
  run.llmChanges = [change];
  ensureArchive(run);
  updateDeliverableIndex(run);
  return change;
};

export async function runsRoutes(fastify: FastifyInstance) {
  fastify.addHook('onClose', async () => {
    runs.clear();
    runNameIndex.clear();
    deliverableIndex.clear();
    archives.clear();
  });

  fastify.post('/runs', async (request: FastifyRequest, reply: FastifyReply) => {
    const payload = createRunSchema.parse(request.body);
    const runNameKey = payload.runName.toLowerCase();
    if (runNameIndex.has(runNameKey)) {
      reply.code(409);
      return {
        success: false,
        error: 'A run with that name already exists.',
        suggestedName: buildSuggestedName(payload.runName),
      };
    }
    const now = new Date().toISOString();
    const run: RunRecord = {
      id: randomUUID(),
      projectId: payload.projectId ?? null,
      runName: payload.runName,
      fileName: payload.fileName,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      deliverables: [],
      sections: [],
      llmChanges: [],
      chat: [],
      pdfMeta: null,
      exports: [],
    };
    runs.set(run.id, run);
    runNameIndex.set(runNameKey, run.id);
    ensureArchive(run);
    runLogger.info({ runId: run.id }, 'Run created');
    return { success: true, data: serialiseRun(run) };
  });

  fastify.get('/runs', async () => {
    const list = Array.from(runs.values())
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
      .map((run) => serialiseRun(run));
    return { success: true, data: list };
  });

  fastify.get('/runs/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const run = runs.get(id);
    if (!run) {
      reply.code(404);
      return { success: false, error: 'Run not found.' };
    }
    return { success: true, data: serialiseRun(run) };
  });

  fastify.patch('/runs/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const run = runs.get(id);
    if (!run) {
      reply.code(404);
      return { success: false, error: 'Run not found.' };
    }
    const updates = updateRunSchema.parse(request.body ?? {});
    if (updates.runName && updates.runName.toLowerCase() !== run.runName.toLowerCase()) {
      const key = updates.runName.toLowerCase();
      if (runNameIndex.has(key)) {
        reply.code(409);
        return {
          success: false,
          error: 'A run with that name already exists.',
          suggestedName: buildSuggestedName(updates.runName),
        };
      }
      runNameIndex.delete(run.runName.toLowerCase());
      runNameIndex.set(key, run.id);
      run.runName = updates.runName;
    }
    if (updates.status) {
      run.status = updates.status;
    }
    if (updates.sections) {
      run.sections = updates.sections.map((section) => ({ ...section }));
    }
    if (updates.deliverables) {
      run.deliverables = updates.deliverables.map((deliverable) => ({
        ...deliverable,
        runId: run.id,
        description: deliverable.description ?? '',
        checklistItems: (deliverable.checklistItems || []).map((item) => ({
          ...item,
          text: item.text,
        })),
      }));
      updateDeliverableIndex(run);
    }
    if (updates.llmChanges) {
      run.llmChanges = updates.llmChanges.map((change) => ({ ...change, runId: run.id }));
    }
    run.updatedAt = new Date().toISOString();
    ensureArchive(run);
    return { success: true, data: serialiseRun(run) };
  });

  fastify.post('/runs/:id/deliverables', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const run = runs.get(id);
    if (!run) {
      reply.code(404);
      return { success: false, error: 'Run not found.' };
    }
    const payload = deliverableCollectionSchema.parse(request.body ?? {});
    run.deliverables = payload.deliverables.map((deliverable, index) => ({
      id: randomUUID(),
      runId: run.id,
      title: sanitizeText(deliverable.title),
      description: sanitizeText(deliverable.description || ''),
      status: 'todo',
      checklistItems: (deliverable.checklist || []).map((item, idx) => ({
        id: randomUUID(),
        text: sanitizeText(item),
        done: false,
        order: idx,
      })),
    }));
    run.updatedAt = new Date().toISOString();
    updateDeliverableIndex(run);
    ensureArchive(run);
    return { success: true, data: run.deliverables };
  });

  fastify.patch('/deliverables/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const runId = deliverableIndex.get(id);
    if (!runId) {
      reply.code(404);
      return { success: false, error: 'Deliverable not found.' };
    }
    const run = runs.get(runId);
    if (!run) {
      reply.code(404);
      return { success: false, error: 'Run not found for deliverable.' };
    }
    const payload = z
      .object({
        status: z.enum(['todo', 'in_progress', 'done']).optional(),
        checklistItem: z
          .object({ id: z.string().uuid(), done: z.boolean() })
          .optional(),
      })
      .parse(request.body ?? {});

    const deliverable = run.deliverables.find((item) => item.id === id);
    if (!deliverable) {
      reply.code(404);
      return { success: false, error: 'Deliverable not found.' };
    }
    if (payload.status) {
      deliverable.status = payload.status;
    }
    if (payload.checklistItem) {
      deliverable.checklistItems = deliverable.checklistItems.map((item) =>
        item.id === payload.checklistItem!.id ? { ...item, done: payload.checklistItem!.done } : item,
      );
    }
    run.updatedAt = new Date().toISOString();
    ensureArchive(run);
    return { success: true };
  });

  fastify.post('/runs/:id/llm/plan', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const run = runs.get(id);
    if (!run) {
      reply.code(404);
      return { success: false, error: 'Run not found.' };
    }
    let fileBuffer: Buffer | null = null;
    let companyPrompt: string | undefined;
    if ((request as any).isMultipart()) {
      const parts = request.parts();
      for await (const part of parts) {
        if (part.type === 'file') {
          fileBuffer = await part.toBuffer();
          run.pdfMeta = {
            filename: part.filename || run.fileName,
            pages: 1,
          };
        } else if (part.type === 'field' && part.fieldname === 'companyPrompt') {
          companyPrompt = part.value as string;
        }
      }
    } else if (request.body && typeof request.body === 'object') {
      const body = request.body as any;
      if (body.companyPrompt) {
        companyPrompt = String(body.companyPrompt);
      }
    }
    const plan = await generatePlan(run, fileBuffer, companyPrompt);
    const change = insertInitialPlan(run, plan);
    run.updatedAt = new Date().toISOString();
    ensureArchive(run);
    updateDeliverableIndex(run);
    return { success: true, data: { run: serialiseRun(run), initialChange: change } };
  });

  fastify.post('/runs/:id/llm/suggest', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const run = runs.get(id);
    if (!run) {
      reply.code(404);
      return { success: false, error: 'Run not found.' };
    }
    const payload = suggestionRequestSchema.parse(request.body ?? {});
    const userEntry: ChatEntry = {
      id: randomUUID(),
      role: 'user',
      content: payload.prompt,
      createdAt: new Date().toISOString(),
    };
    run.chat.push(userEntry);
    const result = await generateSuggestions(run, payload.prompt);
    const assistantEntry: ChatEntry = {
      id: randomUUID(),
      role: 'assistant',
      content: result.summary,
      createdAt: new Date().toISOString(),
      suggestions: result.suggestions,
    };
    run.chat.push(assistantEntry);
    run.updatedAt = new Date().toISOString();
    ensureArchive(run);
    return { success: true, data: assistantEntry };
  });

  fastify.post('/runs/:id/llm/commit-change', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const run = runs.get(id);
    if (!run) {
      reply.code(404);
      return { success: false, error: 'Run not found.' };
    }
    const payload = commitChangeSchema.parse(request.body ?? {});
    const change: LlmChange = {
      id: randomUUID(),
      runId: run.id,
      sectionId: payload.sectionId,
      summary: sanitizeText(payload.summary),
      insertedText: payload.insertedText,
      createdAt: new Date().toISOString(),
      approvedByUser: true,
      highlightAnchor: payload.anchor ?? null,
      sourceMessageId: payload.sourceMessageId,
    };
    run.llmChanges.push(change);
    if (payload.sourceMessageId && payload.suggestionId) {
      const entry = run.chat.find((chat) => chat.id === payload.sourceMessageId);
      if (entry?.suggestions) {
        entry.suggestions = entry.suggestions.map((suggestion) =>
          suggestion.id === payload.suggestionId ? { ...suggestion, status: 'inserted' } : suggestion,
        );
      }
    }
    run.updatedAt = new Date().toISOString();
    ensureArchive(run);
    return { success: true, data: change };
  });

  fastify.patch(
    '/runs/:id/llm/suggestions/:messageId',
    async (
      request: FastifyRequest<{ Params: { id: string; messageId: string } }>,
      reply: FastifyReply,
    ) => {
      const { id, messageId } = request.params;
      const run = runs.get(id);
      if (!run) {
        reply.code(404);
        return { success: false, error: 'Run not found.' };
      }
      const payload = suggestionStatusSchema.parse(request.body ?? {});
      const entry = run.chat.find((chat) => chat.id === messageId);
      if (!entry || !entry.suggestions) {
        reply.code(404);
        return { success: false, error: 'Suggestion not found for message.' };
      }
      entry.suggestions = entry.suggestions.map((suggestion) =>
        suggestion.id === payload.suggestionId ? { ...suggestion, status: payload.status } : suggestion,
      );
      run.updatedAt = new Date().toISOString();
      ensureArchive(run);
      return { success: true, data: entry };
    },
  );

  fastify.post('/runs/:id/export', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const run = runs.get(id);
    if (!run) {
      reply.code(404);
      return { success: false, error: 'Run not found.' };
    }
    exportRequestSchema.parse(request.body ?? {});
    if (!computeExportReady(run)) {
      reply.code(400);
      return {
        success: false,
        error: 'Complete all deliverables and checklist items before exporting.',
      };
    }
    const exportRecord = { id: randomUUID(), createdAt: new Date().toISOString() };
    run.exports.push(exportRecord);
    run.status = 'exported';
    run.updatedAt = exportRecord.createdAt;
    ensureArchive(run);
    return {
      success: true,
      message: 'Export recorded. Download will be available shortly.',
      data: exportRecord,
    };
  });

  fastify.get('/archives', async () => {
    const items = Array.from(archives.values())
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
      .map((entry) => ({
        id: entry.id,
        runId: entry.runId,
        title: entry.runName,
        fileName: entry.fileName,
        updatedAt: entry.updatedAt,
      }));
    return { success: true, data: items };
  });

  fastify.get('/archives/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const entry = archives.get(id);
    if (!entry) {
      reply.code(404);
      return { success: false, error: 'Archive not found.' };
    }
    return { success: true, data: serialiseRun(entry.snapshot) };
  });
}
