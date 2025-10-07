import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDraftStore } from '../draftStore';

describe('draftStore add-to-draft gating', () => {
  beforeEach(() => {
    useDraftStore.setState({
      content: '',
      sections: [],
      deliverables: [],
      llmChanges: [],
      lastCursor: null,
      toast: null,
    });
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }) as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('does not insert empty content and registers error telemetry', () => {
    const store = useDraftStore.getState();
    store.addToDraft({ text: '   ', summary: 'Empty' });

    expect(useDraftStore.getState().content).toBe('');
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

  it('appends content and highlights the latest change', () => {
    const store = useDraftStore.getState();
    store.addToDraft({ text: 'First addition', summary: 'Initial' });
    store.addToDraft({ text: 'Second addition', summary: 'Follow up' });

    const { content, llmChanges } = useDraftStore.getState();
    expect(content).toContain('First addition');
    expect(content).toContain('Second addition');
    expect(llmChanges).toHaveLength(2);
    expect(llmChanges[0].highlight).toBe(false);
    expect(llmChanges[1].highlight).toBe(true);
    expect(llmChanges[1].content).toBe('Second addition');
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });
});
