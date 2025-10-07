import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';
import { ChecklistPanel } from '@/components/ChecklistPanel';
import { DraftEditor } from '@/components/DraftEditor';
import { ChangeLog } from '@/components/ChangeLog';
import { ChatDock } from '@/components/ChatDock';
import { useDraftStore } from '@/store/draftStore';
import { listProjectDrafts, openArchivedRun } from '@/api/drafts';
import { useChatStore } from '@/store/chatStore';

const PROJECT_ID = '11111111-1111-1111-1111-111111111111';
const WORKSPACE_ID = 'proposal-workspace';

const Button = ({ children, className, onClick, type = 'button', disabled }: any) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
      disabled
        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
        : 'bg-blue-600 text-white hover:bg-blue-700'
    } ${className || ''}`}
  >
    {children}
  </button>
);

interface ArchiveItem {
  id: string;
  fileName: string;
  title: string;
  updatedAt: string;
}

export function ProposalPage() {
  const {
    parseChecklist,
    addDeliverables,
    setDeliverables,
    deliverables,
    llmChanges,
    } = useDraftStore();
  const { openChat } = useChatStore();

  const [checklistInput, setChecklistInput] = useState('Executive Summary\nSecurity Controls\nImplementation Timeline');
  const [checklistItems, setChecklistItems] = useState(
    parseChecklist(checklistInput).map((item) => ({
      id: item.id,
      label: item.title,
      status: 'missing' as const,
      source: 'Manual',
      anchors: [],
    })),
  );
  const [archiveItems, setArchiveItems] = useState<ArchiveItem[]>([]);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [isArchiveLoading, setIsArchiveLoading] = useState(false);

  const deliverablesList = useMemo(
    () =>
      deliverables.map((item) => (
        <li key={item.id} className="rounded border border-gray-200 px-3 py-2 text-sm text-gray-700">
          {item.title}
        </li>
      )),
    [deliverables],
  );

  useEffect(() => {
    setChecklistItems(
      parseChecklist(checklistInput).map((item) => ({
        id: item.id,
        label: item.title,
        status: 'missing' as const,
        source: 'Manual',
        anchors: [],
      })),
    );
  }, []);

  const refreshArchive = async () => {
    try {
      setIsArchiveLoading(true);
      setArchiveError(null);
      const response = await listProjectDrafts(PROJECT_ID);
      setArchiveItems(response.data ?? []);
    } catch (error: any) {
      setArchiveError(error?.message || 'Unable to load archive');
    } finally {
      setIsArchiveLoading(false);
    }
  };

  useEffect(() => {
    refreshArchive();
  }, []);

  const handleParseChecklist = () => {
    const parsed = parseChecklist(checklistInput);
    setChecklistItems(
      parsed.map((item) => ({
        id: item.id,
        label: item.title,
        status: 'needs_revision' as const,
        source: 'Checklist',
        anchors: [],
      })),
    );
    addDeliverables(parsed);
  };

  const handleOpenArchivedRun = async (id: string) => {
    try {
      const result = await openArchivedRun(id);
      if (result?.data) {
        useDraftStore.getState().setContent(result.data.body ?? '');
        setDeliverables(result.data.deliverables ?? []);
      }
    } catch (error) {
      console.error('Unable to open archive', error);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Proposal workspace</h1>
            <p className="text-sm text-gray-500">
              Use the checklist and deliverables to curate your proposal. Content is only added to the draft when you press
              <span className="mx-1 inline-flex items-center rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">Add to draft</span>.
            </p>
          </div>
          <Button onClick={openChat}>Open assistant</Button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)_280px]">
          <section className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-gray-900">Checklist parser</h2>
              <textarea
                value={checklistInput}
                onChange={(event) => setChecklistInput(event.target.value)}
                className="mt-2 w-full rounded border border-gray-200 p-2 text-sm"
                rows={6}
              />
              <div className="mt-2 flex justify-between text-xs text-gray-500">
                <span>Paste proposal checklist or deliverables.</span>
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-800"
                  onClick={handleParseChecklist}
                >
                  Parse items
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">Checklist</h2>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
              <ChecklistPanel items={checklistItems} workspaceId={WORKSPACE_ID} detailed />
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-gray-900">Deliverables</h2>
              <ul className="mt-3 space-y-2">{deliverablesList}</ul>
            </div>
          </section>

          <section className="min-h-[720px] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <DraftEditor workspaceId={WORKSPACE_ID} projectId={PROJECT_ID} />
          </section>

          <section className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-gray-900">LLM Changes</h2>
              <p className="text-xs text-gray-500">Only updates added through “Add to draft” appear here.</p>
              <div className="mt-3 max-h-[360px] overflow-y-auto">
                <ChangeLog changes={llmChanges} workspaceId={WORKSPACE_ID} compact />
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">Archive</h2>
                <button
                  type="button"
                  className="text-xs font-medium text-blue-600 hover:text-blue-800"
                  onClick={refreshArchive}
                >
                  Refresh
                </button>
              </div>
              {archiveError && (
                <p className="mt-2 text-xs text-red-600">{archiveError}</p>
              )}
              {isArchiveLoading ? (
                <div className="mt-6 flex items-center justify-center text-sm text-gray-500">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading archive…
                </div>
              ) : (
                <ul className="mt-3 space-y-2">
                  {archiveItems.map((item) => (
                    <li key={item.id} className="rounded border border-gray-200 px-3 py-2 text-sm">
                      <button
                        type="button"
                        className="w-full text-left text-blue-600 hover:text-blue-800"
                        onClick={() => handleOpenArchivedRun(item.id)}
                      >
                        <span className="block font-medium">{item.title || item.fileName}</span>
                        <span className="text-xs text-gray-500">Updated {new Date(item.updatedAt).toLocaleString()}</span>
                      </button>
                    </li>
                  ))}
                  {archiveItems.length === 0 && (
                    <li className="rounded border border-dashed border-gray-200 px-3 py-6 text-center text-xs text-gray-500">
                      No saved drafts yet.
                    </li>
                  )}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>

      <ChatDock workspaceId={WORKSPACE_ID} tab="proposals" />
    </div>
  );
}
