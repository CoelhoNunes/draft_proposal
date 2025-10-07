import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDraftStore } from '../draftStore';

describe('draftStore behaviours', () => {
  beforeEach(() => {
    useDraftStore.setState({
      run: null,
      sections: [],
      deliverables: [],
      llmChanges: [],
      draftContent: '',
      lastCursor: null,
      focusedSectionId: null,
      toast: null,
      exportReady: false,
    });
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }) as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('does not insert empty content and records telemetry failure', () => {
    const store = useDraftStore.getState();
    store.addToDraft({ text: '   ', summary: 'Empty suggestion' });

    expect(useDraftStore.getState().draftContent).toBe('');
    expect(useDraftStore.getState().llmChanges).toHaveLength(0);
    expect(useDraftStore.getState().toast?.tone).toBe('error');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/telemetry/counter',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'add_to_draft_fail' }),
      }),
    );
  });

  it('inserts content into the targeted section and highlights the change', () => {
    useDraftStore.setState((state) => ({
      ...state,
      sections: [
        { id: 'section-1', heading: 'Overview', content: 'Existing intro.', order: 0 },
        { id: 'section-2', heading: 'Details', content: '', order: 1 },
      ],
    }));

    const store = useDraftStore.getState();
    store.setCursor({ sectionId: 'section-2', cursor: 0 });
    store.addToDraft({ sectionId: 'section-2', text: 'New assistant text', summary: 'Assistant suggestion' });

    const { sections, llmChanges, draftContent } = useDraftStore.getState();
    expect(sections[1].content).toContain('New assistant text');
    expect(draftContent).toContain('New assistant text');
    expect(llmChanges).toHaveLength(1);
    expect(llmChanges[0].highlight).toBe(true);
    expect(llmChanges[0].sectionId).toBe('section-2');
    expect(llmChanges[0].insertedText).toBe('New assistant text');
    expect(llmChanges[0].highlightAnchor).not.toBeNull();
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/telemetry/counter',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'add_to_draft_success' }),
      }),
    );
  });

  it('requires all deliverables and checklist items to complete before export', () => {
    useDraftStore.setState((state) => ({
      ...state,
      deliverables: [
        {
          id: 'd1',
          title: 'Security Plan',
          description: '',
          status: 'todo',
          checklistItems: [
            { id: 'c1', text: 'Map controls', done: false },
            { id: 'c2', text: 'Provide diagrams', done: false },
          ],
        },
      ],
    }));

    expect(useDraftStore.getState().exportReady).toBe(false);

    const store = useDraftStore.getState();
    store.updateDeliverableStatus('d1', 'done');
    expect(useDraftStore.getState().exportReady).toBe(false);
    store.toggleChecklistItem('d1', 'c1', true);
    store.toggleChecklistItem('d1', 'c2', true);
    expect(useDraftStore.getState().exportReady).toBe(true);
  });
});
