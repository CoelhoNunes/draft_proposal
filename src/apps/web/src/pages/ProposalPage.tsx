import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, Plus, Send } from 'lucide-react';
import { DraftEditor } from '@/components/DraftEditor';
import { ChangeLog } from '@/components/ChangeLog';
import { useDraftStore, DeliverableStatus, DraftDeliverable } from '@/store/draftStore';
import { useChatStore } from '@/store/chatStore';
import { listProjectDrafts, openArchivedRun } from '@/api/drafts';
import {
  commitLlmChange,
  exportRun,
  updateChecklistItem,
  updateDeliverableStatus as updateDeliverableStatusApi,
} from '@/api/runs';

const PROJECT_ID = '11111111-1111-1111-1111-111111111111';
const WORKSPACE_ID = 'proposal-workspace';

const statusOptions: { value: DeliverableStatus; label: string }[] = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Completed' },
];

const createId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;

type ArchiveItem = {
  id: string;
  fileName: string;
  title: string;
  updatedAt: string;
};

type ChatMessageState = 'pending' | 'inserted' | 'dismissed';

const Button = ({ children, className, onClick, type = 'button', disabled, ...props }: any) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`rounded-md px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
      disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-blue-50'
    } ${className || ''}`}
    {...props}
  >
    {children}
  </button>
);

export function ProposalPage() {
  const {
    deliverables,
    sections,
    setDeliverables,
    toggleChecklistItem,
    updateDeliverableStatus,
    llmChanges,
    addToDraft,
    highlightChange,
    exportReady,
    run,
  } = useDraftStore();
  const {
    messages,
    sendMessage,
    isLoading,
    error,
    setContext,
    openChat,
  } = useChatStore();

  const [archiveItems, setArchiveItems] = useState<ArchiveItem[]>([]);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [isArchiveLoading, setIsArchiveLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'changes' | 'chat'>('changes');
  const [isAddingDeliverable, setIsAddingDeliverable] = useState(false);
  const [newDeliverableTitle, setNewDeliverableTitle] = useState('');
  const [newDeliverableDescription, setNewDeliverableDescription] = useState('');
  const [chatStates, setChatStates] = useState<Record<string, ChatMessageState>>({});
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    setContext({ workspaceId: WORKSPACE_ID, tab: 'proposals' });
    openChat();
  }, [setContext, openChat]);

  useEffect(() => {
    refreshArchive();
  }, []);

  useEffect(() => {
    const latestAssistant = messages
      .slice()
      .reverse()
      .find((message) => message.role === 'assistant');
    if (latestAssistant && !chatStates[latestAssistant.id]) {
      setChatStates((prev) => ({ ...prev, [latestAssistant.id]: 'pending' }));
    }
  }, [messages, chatStates]);

  const refreshArchive = async () => {
    try {
      setIsArchiveLoading(true);
      setArchiveError(null);
      const response = await listProjectDrafts(PROJECT_ID);
      setArchiveItems(response.data ?? []);
    } catch (err: any) {
      setArchiveError(err?.message || 'Unable to load archive');
    } finally {
      setIsArchiveLoading(false);
    }
  };

  const handleOpenArchivedRun = async (id: string) => {
    try {
      const result = await openArchivedRun(id);
      if (result?.data) {
        setDeliverables(result.data.deliverables ?? []);
      }
    } catch (err) {
      console.error('Unable to open archive', err);
    }
  };

  const handleStatusChange = async (deliverable: DraftDeliverable, status: DeliverableStatus) => {
    updateDeliverableStatus(deliverable.id, status);
    try {
      await updateDeliverableStatusApi(deliverable.id, status);
    } catch (err) {
      console.warn('Failed to persist deliverable status', err);
    }
  };

  const handleChecklistToggle = async (deliverableId: string, itemId: string, done: boolean) => {
    toggleChecklistItem(deliverableId, itemId, done);
    try {
      await updateChecklistItem(deliverableId, itemId, done);
    } catch (err) {
      console.warn('Failed to persist checklist toggle', err);
    }
  };

  const handleAddRequirement = () => {
    if (!newDeliverableTitle.trim()) {
      return;
    }
    const next: DraftDeliverable = {
      id: createId(),
      title: newDeliverableTitle.trim(),
      description: newDeliverableDescription.trim(),
      status: 'todo',
      checklistItems: [
        {
          id: createId(),
          text: newDeliverableTitle.trim(),
          done: false,
        },
      ],
    };
    setDeliverables([...deliverables, next]);
    setNewDeliverableTitle('');
    setNewDeliverableDescription('');
    setIsAddingDeliverable(false);
  };

  const handleAddChatSuggestion = async (messageId: string, content: string) => {
    if (!content.trim()) {
      return;
    }
    setChatStates((prev) => ({ ...prev, [messageId]: 'inserted' }));
    addToDraft({
      sectionId: sections[0]?.id,
      text: content,
      summary: 'Assistant suggestion',
      runId: run?.id,
      sourceMessageId: messageId,
    });
    try {
      if (run?.id) {
        await commitLlmChange(run.id, {
          sectionId: null,
          insertedText: content,
          summary: 'Assistant suggestion',
        });
      }
    } catch (err) {
      console.warn('Unable to persist LLM change', err);
    }
  };

  const handleDismissSuggestion = (messageId: string) => {
    setChatStates((prev) => ({ ...prev, [messageId]: 'dismissed' }));
  };

  const handleSendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const message = (formData.get('message') as string) || '';
    if (!message.trim()) {
      return;
    }
    await sendMessage(message.trim());
    event.currentTarget.reset();
  };

  const handleHighlightChange = (changeId: string) => {
    highlightChange(changeId);
    window.requestAnimationFrame(() => {
      const element = document.querySelector('[data-highlight="true"]');
      if (element instanceof HTMLElement) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  };

  const handleExport = async () => {
    if (!run?.id) {
      setExportError('No active run to export.');
      return;
    }
    try {
      setExportError(null);
      setExportSuccess(null);
      setIsExporting(true);
      const result = await exportRun(run.id);
      setExportSuccess(result?.message || 'Export requested successfully.');
    } catch (err: any) {
      setExportError(err?.message || 'Export failed. Ensure all deliverables are complete.');
    } finally {
      setIsExporting(false);
    }
  };

  const chatMessages = useMemo(() => {
    return messages.filter((message) => message.context?.tab === 'proposals');
  }, [messages]);

  const renderChatActions = (messageId: string, content: string) => {
    const state = chatStates[messageId] || 'pending';
    if (state === 'dismissed') {
      return (
        <span className="mt-2 inline-flex items-center gap-1 text-xs text-gray-500">Dismissed</span>
      );
    }
    if (state === 'inserted') {
      return (
        <span className="mt-2 inline-flex items-center gap-1 text-xs text-green-600">
          <CheckCircle2 className="h-3 w-3" /> Added to draft
        </span>
      );
    }
    return (
      <div className="mt-2 flex items-center gap-2">
        <Button
          className="bg-blue-600 text-white"
          onClick={() => handleAddChatSuggestion(messageId, content)}
        >
          Add
        </Button>
        <Button className="border border-gray-200 bg-white" onClick={() => handleDismissSuggestion(messageId)}>
          Cancel
        </Button>
      </div>
    );
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="px-6 py-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Proposal workspace</h1>
            <p className="text-sm text-gray-500">
              Deliverables, draft, and AI collaboration work together. The assistant only updates the draft once you confirm.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
          <aside className="flex flex-col gap-4" aria-label="Deliverables column">
            <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">Deliverables</h2>
                <Button
                  className="inline-flex items-center gap-1 border border-gray-200 bg-white"
                  onClick={() => setIsAddingDeliverable((prev) => !prev)}
                >
                  <Plus className="h-4 w-4" /> Add requirement
                </Button>
              </div>

              {isAddingDeliverable && (
                <form
                  className="space-y-2 rounded-md bg-gray-50 p-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleAddRequirement();
                  }}
                >
                  <input
                    value={newDeliverableTitle}
                    onChange={(event) => setNewDeliverableTitle(event.target.value)}
                    className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
                    placeholder="Deliverable title"
                    aria-label="New deliverable title"
                    required
                  />
                  <textarea
                    value={newDeliverableDescription}
                    onChange={(event) => setNewDeliverableDescription(event.target.value)}
                    className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
                    rows={2}
                    placeholder="Description (optional)"
                    aria-label="New deliverable description"
                  />
                  <div className="flex justify-end gap-2 text-sm">
                    <Button type="button" className="border border-gray-200 bg-white" onClick={() => setIsAddingDeliverable(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-blue-600 text-white">
                      Save
                    </Button>
                  </div>
                </form>
              )}

              <div className="space-y-4">
                {deliverables.map((deliverable) => (
                  <article key={deliverable.id} className="rounded border border-gray-200 p-3 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-medium text-gray-900">{deliverable.title}</h3>
                        {deliverable.description && (
                          <p className="mt-1 text-xs text-gray-600">{deliverable.description}</p>
                        )}
                      </div>
                      <select
                        value={deliverable.status}
                        onChange={(event) => handleStatusChange(deliverable, event.target.value as DeliverableStatus)}
                        className="rounded border border-gray-200 bg-white px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label={`Update status for ${deliverable.title}`}
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {deliverable.checklistItems.length > 0 && (
                      <ul className="mt-3 space-y-2">
                        {deliverable.checklistItems.map((item) => (
                          <li key={item.id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={item.done}
                              onChange={(event) => handleChecklistToggle(deliverable.id, item.id, event.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              aria-label={`Checklist item: ${item.text}`}
                            />
                            <span className={`text-xs ${item.done ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                              {item.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>
                ))}
                {deliverables.length === 0 && (
                  <div className="rounded border border-dashed border-gray-200 p-6 text-center text-xs text-gray-500">
                    No deliverables yet. Import a PDF or add requirements manually.
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-2">
                <Button
                  className={`w-full ${exportReady ? 'bg-blue-600 text-white' : 'border border-gray-200 bg-white text-gray-400'}`}
                  onClick={handleExport}
                  disabled={!exportReady || isExporting}
                >
                  {isExporting ? 'Exporting…' : 'Export proposal'}
                </Button>
                {!exportReady && (
                  <p className="text-xs text-gray-500">
                    Complete all deliverables and checklist items to enable export.
                  </p>
                )}
                {exportError && (
                  <div className="flex items-start gap-2 rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">
                    <AlertTriangle className="mt-0.5 h-4 w-4" />
                    <span>{exportError}</span>
                  </div>
                )}
                {exportSuccess && (
                  <div className="rounded border border-green-200 bg-green-50 p-2 text-xs text-green-700">{exportSuccess}</div>
                )}
              </div>
            </section>

            <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-sm">
                <h2 className="font-semibold text-gray-900">Archives</h2>
                <Button className="border border-gray-200 bg-white" onClick={refreshArchive}>
                  Refresh
                </Button>
              </div>
              {archiveError && <p className="text-xs text-red-600">{archiveError}</p>}
              {isArchiveLoading ? (
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </div>
              ) : (
                <ul className="space-y-2 text-xs">
                  {archiveItems.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className="w-full rounded border border-gray-200 px-3 py-2 text-left hover:border-blue-300 hover:bg-blue-50"
                        onClick={() => handleOpenArchivedRun(item.id)}
                      >
                        <span className="block font-medium text-gray-900">{item.title || item.fileName}</span>
                        <span className="text-gray-500">Updated {new Date(item.updatedAt).toLocaleString()}</span>
                      </button>
                    </li>
                  ))}
                  {archiveItems.length === 0 && (
                    <li className="rounded border border-dashed border-gray-200 px-3 py-6 text-center text-gray-500">
                      No saved drafts yet.
                    </li>
                  )}
                </ul>
              )}
            </section>
          </aside>

          <section className="min-h-[720px] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm" aria-label="Draft column">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-900">Draft</h2>
            </div>
            <DraftEditor workspaceId={WORKSPACE_ID} projectId={PROJECT_ID} />
          </section>

          <section className="flex min-h-[720px] flex-col rounded-lg border border-gray-200 bg-white shadow-sm" aria-label="Assistant column">
            <div className="flex border-b bg-gray-50">
              <button
                type="button"
                className={`flex-1 px-4 py-3 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  activeTab === 'changes' ? 'border-b-2 border-blue-600 text-blue-700' : 'text-gray-500'
                }`}
                onClick={() => setActiveTab('changes')}
                role="tab"
                aria-selected={activeTab === 'changes'}
              >
                LLM Changes
              </button>
              <button
                type="button"
                className={`flex-1 px-4 py-3 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  activeTab === 'chat' ? 'border-b-2 border-blue-600 text-blue-700' : 'text-gray-500'
                }`}
                onClick={() => setActiveTab('chat')}
                role="tab"
                aria-selected={activeTab === 'chat'}
              >
                Chat
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4" role="tabpanel">
              {activeTab === 'changes' ? (
                <ChangeLog changes={llmChanges} onHighlight={(change) => handleHighlightChange(change.id)} />
              ) : (
                <div className="flex h-full flex-col">
                  <div className="flex-1 space-y-4 overflow-y-auto">
                    {chatMessages.length === 0 && (
                      <div className="rounded border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                        Ask the assistant for help drafting proposal content.
                      </div>
                    )}
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`rounded-lg border px-3 py-2 text-sm ${
                          message.role === 'user'
                            ? 'border-blue-200 bg-blue-50 text-blue-900'
                            : message.role === 'assistant'
                            ? 'border-gray-200 bg-white text-gray-800'
                            : 'border-amber-200 bg-amber-50 text-amber-800'
                        }`}
                      >
                        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                        {message.role === 'assistant' && renderChatActions(message.id, message.content)}
                      </div>
                    ))}
                    {isLoading && (
                      <div className="rounded border border-gray-200 bg-white p-3 text-sm text-gray-600">Assistant is thinking…</div>
                    )}
                    {error && (
                      <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
                    )}
                  </div>
                  <form className="mt-4 space-y-3" onSubmit={handleSendMessage}>
                    <div className="flex items-center gap-2">
                      <textarea
                        name="message"
                        className="h-24 flex-1 resize-none rounded border border-gray-200 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ask for a section, edit, or summary…"
                      />
                      <Button type="submit" className="bg-blue-600 text-white" disabled={isLoading}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Suggestions are only added to the draft when you confirm with Add.
                    </p>
                  </form>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
