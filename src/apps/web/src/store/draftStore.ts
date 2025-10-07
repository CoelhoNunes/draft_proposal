import { create } from 'zustand';

type DeliverableStatus = 'todo' | 'in_progress' | 'done';

type DraftToast = {
  id: string;
  message: string;
  tone: 'success' | 'error';
};

type HighlightAnchor = { startOffset: number; endOffset: number } | null;

type DraftChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

type DraftDeliverable = {
  id: string;
  runId?: string;
  title: string;
  description: string;
  status: DeliverableStatus;
  checklistItems: DraftChecklistItem[];
};

type DraftSection = {
  id: string;
  heading: string;
  content: string;
  order: number;
};

type DraftLlmChange = {
  id: string;
  runId?: string;
  sectionId: string | null;
  summary: string;
  insertedText: string;
  createdAt: string;
  approvedByUser: boolean;
  highlightAnchor: HighlightAnchor;
  highlight: boolean;
  sourceMessageId?: string;
};

type DraftRunMeta = {
  id: string;
  projectId: string | null;
  runName: string;
  fileName: string;
  createdAt: string;
  updatedAt: string;
  pdfMeta: { filename: string; pages: number } | null;
  status: 'draft' | 'exported';
};

type DraftState = {
  run: DraftRunMeta | null;
  sections: DraftSection[];
  deliverables: DraftDeliverable[];
  llmChanges: DraftLlmChange[];
  draftContent: string;
  lastCursor: number | null;
  focusedSectionId: string | null;
  toast: DraftToast | null;
  exportReady: boolean;
  activeHighlight: { changeId: string; sectionId: string | null; start: number; end: number } | null;
};

type DraftActions = {
  initialiseRun: (meta: DraftRunMeta, sections: DraftSection[], deliverables: DraftDeliverable[], changes?: DraftLlmChange[]) => void;
  hydrateFromRun: (payload: {
    meta: DraftRunMeta;
    sections: DraftSection[];
    deliverables: DraftDeliverable[];
    changes: DraftLlmChange[];
  }) => void;
  setSections: (sections: DraftSection[]) => void;
  updateSectionContent: (sectionId: string, content: string) => void;
  setDeliverables: (deliverables: DraftDeliverable[]) => void;
  upsertDeliverable: (deliverable: DraftDeliverable) => void;
  updateDeliverableStatus: (deliverableId: string, status: DeliverableStatus) => void;
  toggleChecklistItem: (deliverableId: string, itemId: string, done: boolean) => void;
  setContent: (content: string) => void;
  setCursor: (payload: { sectionId: string | null; cursor: number | null }) => void;
  addLlmChange: (payload: Omit<DraftLlmChange, 'highlight'> & { highlight?: boolean }) => DraftLlmChange;
  clearHighlight: () => void;
  highlightChange: (changeId: string) => void;
  addToDraft: (payload: {
    sectionId?: string | null;
    text: string;
    summary: string;
    runId?: string;
    highlightAnchor?: HighlightAnchor;
    sourceMessageId?: string;
  }) => DraftLlmChange | null;
  registerError: (message: string) => void;
  clearToast: () => void;
  parseChecklist: (rawChecklist: string) => DraftDeliverable[];
  mapDeliverablesToSections: (items: DraftDeliverable[]) => DraftSection[];
  composeProposalFromChecklist: (items: DraftDeliverable[]) => string;
};

const createId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `draft-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`;
};

const sanitize = (value: string) => value.trim();

const trackCounter = (name: string) => {
  if (typeof fetch !== 'function') {
    return;
  }
  fetch('/api/telemetry/counter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  }).catch(() => {
    // Telemetry is best effort.
  });
};

const joinSections = (sections: DraftSection[]) =>
  sections
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((section) => {
      const heading = section.heading ? `## ${section.heading}` : '';
      return [heading, section.content.trim()].filter(Boolean).join('\n');
    })
    .filter(Boolean)
    .join('\n\n')
    .trim();

const computeExportReady = (deliverables: DraftDeliverable[]) =>
  deliverables.length > 0 &&
  deliverables.every((deliverable) =>
    deliverable.status === 'done' && deliverable.checklistItems.every((item) => item.done),
  );

export const useDraftStore = create<DraftState & DraftActions>((set, get) => ({
  run: null,
  sections: [],
  deliverables: [],
  llmChanges: [],
  draftContent: '',
  lastCursor: null,
  focusedSectionId: null,
  toast: null,
  exportReady: false,
  activeHighlight: null,

  initialiseRun(meta, sections, deliverables, changes = []) {
    const normalisedSections = sections
      .map((section, index) => ({
        ...section,
        id: section.id || createId(),
        heading: sanitize(section.heading),
        content: section.content?.trim() || '',
        order: typeof section.order === 'number' ? section.order : index,
      }))
      .sort((a, b) => a.order - b.order);

    const formattedDeliverables = deliverables.map((deliverable) => ({
      ...deliverable,
      id: deliverable.id || createId(),
      title: sanitize(deliverable.title),
      description: deliverable.description?.trim() || '',
      status: deliverable.status || 'todo',
      checklistItems: (deliverable.checklistItems || []).map((item) => ({
        ...item,
        id: item.id || createId(),
        text: sanitize(item.text),
        done: Boolean(item.done),
      })),
    }));

    const changesWithIds = changes.map((change) => ({
      ...change,
      id: change.id || createId(),
      highlight: change.highlight ?? false,
    }));

    set({
      run: meta,
      sections: normalisedSections,
      deliverables: formattedDeliverables,
      llmChanges: changesWithIds,
      draftContent: joinSections(normalisedSections),
      exportReady: computeExportReady(formattedDeliverables),
      activeHighlight: null,
    });
  },

  hydrateFromRun({ meta, sections, deliverables, changes }) {
    const normalisedSections = sections
      .map((section, index) => ({
        ...section,
        id: section.id || createId(),
        heading: sanitize(section.heading),
        content: section.content?.trim() || '',
        order: typeof section.order === 'number' ? section.order : index,
      }))
      .sort((a, b) => a.order - b.order);
    const formattedDeliverables = deliverables.map((deliverable) => ({
      ...deliverable,
      id: deliverable.id || createId(),
      title: sanitize(deliverable.title),
      description: deliverable.description?.trim() || '',
      status: deliverable.status || 'todo',
      checklistItems: (deliverable.checklistItems || []).map((item) => ({
        ...item,
        id: item.id || createId(),
        text: sanitize(item.text),
        done: Boolean(item.done),
      })),
    }));
    const mappedChanges = changes.map((change) => ({
      ...change,
      id: change.id || createId(),
      highlight: Boolean(change.highlight),
    }));
    set({
      run: {
        ...meta,
        pdfMeta: meta.pdfMeta ? { ...meta.pdfMeta } : null,
      },
      sections: normalisedSections,
      deliverables: formattedDeliverables,
      llmChanges: mappedChanges,
      draftContent: joinSections(normalisedSections),
      exportReady: computeExportReady(formattedDeliverables),
      activeHighlight: null,
    });
  },

  setSections(sections) {
    const normalised = sections
      .map((section, index) => ({
        ...section,
        id: section.id || createId(),
        heading: sanitize(section.heading),
        content: section.content?.trim() || '',
        order: typeof section.order === 'number' ? section.order : index,
      }))
      .sort((a, b) => a.order - b.order);

    set({ sections: normalised, draftContent: joinSections(normalised) });
  },

  updateSectionContent(sectionId, content) {
    set((state) => {
      const nextSections = state.sections.map((section) =>
        section.id === sectionId ? { ...section, content } : section,
      );
      return {
        sections: nextSections,
        draftContent: joinSections(nextSections),
      };
    });
  },

  setDeliverables(deliverables) {
    const formatted = deliverables.map((deliverable) => ({
      ...deliverable,
      id: deliverable.id || createId(),
      title: sanitize(deliverable.title),
      description: deliverable.description?.trim() || '',
      status: deliverable.status || 'todo',
      checklistItems: (deliverable.checklistItems || []).map((item) => ({
        ...item,
        id: item.id || createId(),
        text: sanitize(item.text),
        done: Boolean(item.done),
      })),
    }));

    set({ deliverables: formatted, exportReady: computeExportReady(formatted) });
  },

  upsertDeliverable(deliverable) {
    set((state) => {
      const exists = state.deliverables.some((item) => item.id === deliverable.id);
      const nextDeliverables = exists
        ? state.deliverables.map((item) => (item.id === deliverable.id ? deliverable : item))
        : [...state.deliverables, deliverable];
      return {
        deliverables: nextDeliverables,
        exportReady: computeExportReady(nextDeliverables),
      };
    });
  },

  updateDeliverableStatus(deliverableId, status) {
    set((state) => {
      const next = state.deliverables.map((deliverable) =>
        deliverable.id === deliverableId ? { ...deliverable, status } : deliverable,
      );
      return { deliverables: next, exportReady: computeExportReady(next) };
    });
  },

  toggleChecklistItem(deliverableId, itemId, done) {
    set((state) => {
      const nextDeliverables = state.deliverables.map((deliverable) => {
        if (deliverable.id !== deliverableId) {
          return deliverable;
        }
        return {
          ...deliverable,
          checklistItems: deliverable.checklistItems.map((item) =>
            item.id === itemId ? { ...item, done } : item,
          ),
        };
      });
      return {
        deliverables: nextDeliverables,
        exportReady: computeExportReady(nextDeliverables),
      };
    });
  },

  setContent(content) {
    set({ draftContent: content });
  },

  setCursor({ sectionId, cursor }) {
    set({ lastCursor: cursor, focusedSectionId: sectionId ?? null });
  },

  addLlmChange({ highlight, ...payload }) {
    const change: DraftLlmChange = {
      ...payload,
      highlight: highlight ?? true,
    };
    set((state) => ({
      llmChanges: [
        ...state.llmChanges.map((entry) => ({ ...entry, highlight: false })),
        change,
      ],
      activeHighlight: change.highlightAnchor
        ? { changeId: change.id, sectionId: change.sectionId, start: change.highlightAnchor.startOffset, end: change.highlightAnchor.endOffset }
        : null,
    }));
    return change;
  },

  clearHighlight() {
    set((state) => ({
      llmChanges: state.llmChanges.map((change) => ({ ...change, highlight: false })),
      activeHighlight: null,
    }));
  },

  highlightChange(changeId) {
    set((state) => {
      const change = state.llmChanges.find((entry) => entry.id === changeId);
      return {
        llmChanges: state.llmChanges.map((entry) => ({
          ...entry,
          highlight: entry.id === changeId,
        })),
        activeHighlight: change?.highlightAnchor
          ? {
              changeId,
              sectionId: change.sectionId,
              start: change.highlightAnchor.startOffset,
              end: change.highlightAnchor.endOffset,
            }
          : null,
      };
    });
  },

  addToDraft({ sectionId, text, summary, runId, highlightAnchor, sourceMessageId }) {
    const trimmed = text.trim();
    if (!trimmed) {
      set({
        toast: { id: createId(), message: 'Unable to add empty content to draft.', tone: 'error' },
      });
      trackCounter('add_to_draft_fail');
      return;
    }

    const state = get();
    const targetSectionId = sectionId ?? state.focusedSectionId ?? state.sections[0]?.id ?? null;

    if (!targetSectionId) {
      const nextContent = state.draftContent
        ? `${state.draftContent.trim()}\n\n${trimmed}`
        : trimmed;

      const change: DraftLlmChange = {
        id: createId(),
        runId,
        sectionId: null,
        summary: summary.trim() || 'Draft update',
        insertedText: trimmed,
        createdAt: new Date().toISOString(),
        approvedByUser: true,
        highlightAnchor: highlightAnchor ?? null,
        highlight: true,
        sourceMessageId,
      };

      set({
        draftContent: nextContent,
        llmChanges: [
          ...state.llmChanges.map((entry) => ({ ...entry, highlight: false })),
          change,
        ],
        toast: { id: createId(), message: 'Added to draft', tone: 'success' },
        activeHighlight: change.highlightAnchor
          ? { changeId: change.id, sectionId: change.sectionId, start: change.highlightAnchor.startOffset, end: change.highlightAnchor.endOffset }
          : null,
      });
      trackCounter('add_to_draft_success');
      return change;
    }

    const sections = state.sections.length
      ? state.sections
      : [
          {
            id: targetSectionId,
            heading: 'Draft',
            content: '',
            order: 0,
          },
        ];

    const updatedSections = sections.map((section) => {
      if (section.id !== targetSectionId) {
        return section;
      }

      const insertionPoint =
        state.focusedSectionId === section.id && typeof state.lastCursor === 'number'
          ? state.lastCursor
          : section.content.length;

      const before = section.content.slice(0, insertionPoint);
      const after = section.content.slice(insertionPoint);
      const needsLeadingBreak = before.length > 0 && !/\n$/.test(before);
      const needsTrailingBreak = after.length > 0 && !/^\n/.test(after);
      const inserted = `${needsLeadingBreak ? '\n\n' : ''}${trimmed}${needsTrailingBreak ? '\n\n' : ''}`;
      const nextContent = `${before}${inserted}${after}`.replace(/\n{3,}/g, '\n\n');
      const startOffset = before.length + (needsLeadingBreak ? 2 : 0);
      const endOffset = startOffset + trimmed.length;

      return {
        ...section,
        content: nextContent,
      };
    });

    const newContent = joinSections(updatedSections);
    const anchor: HighlightAnchor = highlightAnchor ?? {
      startOffset: state.focusedSectionId === targetSectionId && typeof state.lastCursor === 'number'
        ? state.lastCursor
        : state.sections.find((section) => section.id === targetSectionId)?.content.length ?? 0,
      endOffset: (state.focusedSectionId === targetSectionId && typeof state.lastCursor === 'number'
        ? state.lastCursor
        : state.sections.find((section) => section.id === targetSectionId)?.content.length ?? 0) + trimmed.length,
    };

    const change: DraftLlmChange = {
      id: createId(),
      runId,
      sectionId: targetSectionId,
      summary: summary.trim() || 'Draft update',
      insertedText: trimmed,
      createdAt: new Date().toISOString(),
      approvedByUser: true,
      highlightAnchor: anchor,
      highlight: true,
      sourceMessageId,
    };

    set({
      sections: updatedSections,
      draftContent: newContent,
      llmChanges: [
        ...state.llmChanges.map((entry) => ({ ...entry, highlight: false })),
        change,
      ],
      toast: { id: createId(), message: 'Added to draft', tone: 'success' },
      activeHighlight: change.highlightAnchor
        ? { changeId: change.id, sectionId: change.sectionId, start: change.highlightAnchor.startOffset, end: change.highlightAnchor.endOffset }
        : null,
    });
    trackCounter('add_to_draft_success');
    return change;
  },

  registerError(message) {
    set({ toast: { id: createId(), message, tone: 'error' } });
    trackCounter('add_to_draft_fail');
  },

  clearToast() {
    set({ toast: null });
  },

  parseChecklist(rawChecklist) {
    const lines = rawChecklist
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const results: DraftDeliverable[] = [];
    for (const line of lines) {
      const withoutPrefix = line.replace(/^[-*\d.\)\s]+/, '').trim();
      if (!withoutPrefix) continue;
      results.push({
        id: createId(),
        title: withoutPrefix,
        description: '',
        status: 'todo',
        checklistItems: [
          {
            id: createId(),
            text: withoutPrefix,
            done: false,
          },
        ],
      });
    }
    return results;
  },

  mapDeliverablesToSections(items) {
    const sections = new Map<string, DraftSection>();
    items.forEach((item, index) => {
      const heading = item.title.split(':')[0].trim() || 'Additional Deliverables';
      const key = heading.toLowerCase();
      const existing = sections.get(key);
      const bullet = `- ${item.title}${item.description ? ` — ${item.description}` : ''}`;

      if (existing) {
        sections.set(key, {
          ...existing,
          content: `${existing.content}\n${bullet}`.trim(),
        });
      } else {
        sections.set(key, {
          id: createId(),
          heading,
          content: bullet,
          order: index,
        });
      }
    });

    return Array.from(sections.values()).sort((a, b) => a.order - b.order);
  },

  composeProposalFromChecklist(items) {
    if (!items.length) {
      return '';
    }

    const sections = get().mapDeliverablesToSections(items);
    const structure = [
      '# Proposal Overview',
      'This draft consolidates the latest deliverables and checklist insights. Update each section with project-specific details.',
      ...sections.map((section) => `## ${section.heading}\n${section.content}`),
      '\n---\nGenerated from checklist context.',
    ];
    return structure.filter(Boolean).join('\n\n').trim();
  },
}));

export type {
  DraftChecklistItem,
  DraftDeliverable,
  DraftLlmChange,
  DraftRunMeta,
  DraftSection,
  DeliverableStatus,
  HighlightAnchor,
};
