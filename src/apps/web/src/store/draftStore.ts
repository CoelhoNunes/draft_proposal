import { create } from 'zustand';

interface DraftToast {
  id: string;
  message: string;
  tone: 'success' | 'error';
}

interface DraftSection {
  id: string;
  heading: string;
  body: string;
  deliverableIds: string[];
}

interface DraftDeliverable {
  id: string;
  title: string;
  description?: string;
  sectionHint?: string;
}

interface DraftLlmChange {
  id: string;
  summary: string;
  content: string;
  createdAt: string;
  highlight: boolean;
  sourceMessageId?: string;
}

interface DraftState {
  content: string;
  sections: DraftSection[];
  deliverables: DraftDeliverable[];
  llmChanges: DraftLlmChange[];
  lastCursor: number | null;
  toast: DraftToast | null;
}

interface DraftActions {
  setContent: (content: string) => void;
  setCursor: (cursor: number | null) => void;
  addDeliverables: (items: DraftDeliverable[]) => void;
  setDeliverables: (items: DraftDeliverable[]) => void;
  setSections: (sections: DraftSection[]) => void;
  clearHighlight: () => void;
  addToDraft: (payload: { text: string; summary: string; sourceMessageId?: string }) => void;
  registerError: (message: string) => void;
  clearToast: () => void;
  parseChecklist: (rawChecklist: string) => DraftDeliverable[];
  mapDeliverablesToSections: (items: DraftDeliverable[]) => DraftSection[];
  composeProposalFromChecklist: (items: DraftDeliverable[]) => string;
}

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
    // Swallow network errors – telemetry is best effort only.
  });
};

export const useDraftStore = create<DraftState & DraftActions>((set, get) => ({
  content: '',
  sections: [],
  deliverables: [],
  llmChanges: [],
  lastCursor: null,
  toast: null,

  setContent(content) {
    set({ content });
  },

  setCursor(cursor) {
    set({ lastCursor: cursor });
  },

  addDeliverables(items) {
    const cleaned = items
      .map((item) => ({
        ...item,
        id: item.id || createId(),
        title: sanitize(item.title),
        description: item.description?.trim(),
        sectionHint: item.sectionHint?.trim(),
      }))
      .filter((item) => item.title.length > 0);

    set((state) => ({ deliverables: [...state.deliverables, ...cleaned] }));
  },

  setDeliverables(items) {
    const formatted = items.map((item) => ({
      ...item,
      id: item.id || createId(),
      title: sanitize(item.title),
      description: item.description?.trim(),
      sectionHint: item.sectionHint?.trim(),
    }));
    set({ deliverables: formatted });
  },

  setSections(sections) {
    const normalised = sections.map((section) => ({
      ...section,
      id: section.id || createId(),
      heading: sanitize(section.heading),
      body: section.body.trim(),
      deliverableIds: section.deliverableIds ?? [],
    }));
    set({ sections: normalised });
  },

  clearHighlight() {
    set((state) => ({
      llmChanges: state.llmChanges.map((change) => ({ ...change, highlight: false })),
    }));
  },

  addToDraft({ text, summary, sourceMessageId }) {
    const trimmed = text.trim();
    if (!trimmed) {
      set({
        toast: { id: createId(), message: 'Unable to add empty content to draft.', tone: 'error' },
      });
      trackCounter('add_to_draft_fail');
      console.warn('[draft-store]', { event: 'add_to_draft_fail', reason: 'empty_payload' });
      return;
    }

    const { content, lastCursor } = get();

    let nextContent: string;
    if (lastCursor !== null) {
      const before = content.slice(0, lastCursor);
      const after = content.slice(lastCursor);
      nextContent = `${before}${before.endsWith('\n') ? '' : '\n'}${trimmed}${after.startsWith('\n') ? '' : '\n'}${after}`.trim();
    } else {
      nextContent = content ? `${content.trim()}\n\n${trimmed}` : trimmed;
    }

    const newChange: DraftLlmChange = {
      id: createId(),
      summary: summary.trim() || 'Inserted draft content',
      content: trimmed,
      createdAt: new Date().toISOString(),
      highlight: true,
      sourceMessageId,
    };

    set((state) => ({
      content: nextContent,
      llmChanges: [...state.llmChanges.map((change) => ({ ...change, highlight: false })), newChange],
      toast: { id: createId(), message: 'Added to draft', tone: 'success' },
    }));
    trackCounter('add_to_draft_success');
    console.info('[draft-store]', {
      event: 'add_to_draft_success',
      sourceMessageId,
      charactersInserted: trimmed.length,
    });
  },

  registerError(message) {
    set({ toast: { id: createId(), message, tone: 'error' } });
    trackCounter('add_to_draft_fail');
    console.error('[draft-store]', { event: 'add_to_draft_error', message });
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
        sectionHint: withoutPrefix.split(':')[0],
      });
    }
    return results;
  },

  mapDeliverablesToSections(items) {
    const sections = new Map<string, DraftSection>();
    items.forEach((item) => {
      const hint = item.sectionHint || item.title.split(':')[0];
      const heading = hint.replace(/deliverable/i, '').trim() || 'Additional Deliverables';
      const sectionKey = heading.toLowerCase();
      const existing = sections.get(sectionKey);
      const bullet = `- ${item.title}${item.description ? ` — ${item.description}` : ''}`;

      if (existing) {
        existing.body = `${existing.body}\n${bullet}`.trim();
        existing.deliverableIds.push(item.id);
      } else {
        sections.set(sectionKey, {
          id: createId(),
          heading,
          body: bullet,
          deliverableIds: [item.id],
        });
      }
    });

    return Array.from(sections.values());
  },

  composeProposalFromChecklist(items) {
    if (!items.length) {
      return '';
    }

    const sections = get().mapDeliverablesToSections(items);
    const sectionText = sections
      .map((section) => `## ${section.heading}\n${section.body}`)
      .join('\n\n');

    const intro = `# Proposal Overview\nThis draft consolidates the current checklist and mapped deliverables into actionable sections.`;
    const outro = '\n\n---\nGenerated via Draft Intelligence tooling.';

    return `${intro}\n\n${sectionText}${outro}`.trim();
  },
}));

export type { DraftDeliverable, DraftLlmChange, DraftSection };
