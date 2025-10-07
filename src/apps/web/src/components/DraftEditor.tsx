import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bold, Italic, List, Save, Eye, Sparkles } from 'lucide-react';
import { useDraftStore } from '@/store/draftStore';
import { saveDraftToArchive } from '@/api/drafts';

interface DraftEditorProps {
  workspaceId: string;
  projectId: string;
}

const Button = ({ children, className, onClick, disabled, type = 'button', ...props }: any) => (
  <button
    type={type}
    className={`px-4 py-2 rounded font-medium transition-colors ${
      disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-50'
    } ${className || ''}`}
    onClick={onClick}
    disabled={disabled}
    {...props}
  >
    {children}
  </button>
);

export function DraftEditor({ workspaceId, projectId }: DraftEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const {
    content,
    setContent,
    setCursor,
    composeProposalFromChecklist,
    deliverables,
    addToDraft,
    toast,
    clearToast,
  } = useDraftStore();

  const [isPreview, setIsPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState('proposal-draft.md');

  const previewHtml = useMemo(() => {
    return content
      .split(/\n{2,}/)
      .map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br />')}</p>`) 
      .join('');
  }, [content]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => clearToast(), 2000);
    return () => clearTimeout(timer);
  }, [toast, clearToast]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const handleSelection = () => {
    if (!textareaRef.current) return;
    setCursor(textareaRef.current.selectionStart ?? null);
  };

  const handleSave = async () => {
    if (!fileName.trim()) {
      setError('Provide a file name before saving to the archive.');
      return;
    }
    try {
      setIsSaving(true);
      setError(null);
      await saveDraftToArchive({
        projectId,
        fileName,
        title: 'Proposal Draft',
        status: 'draft',
        body: content,
        deliverables,
      });
    } catch (err: any) {
      setError(err?.message || 'Unable to save draft');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateFromChecklist = () => {
    const generated = composeProposalFromChecklist(deliverables);
    if (!generated) {
      setError('Checklist is empty – add checklist items to generate a proposal section.');
      return;
    }
    setGeneratedPreview(generated);
    setError(null);
  };

  return (
    <div className="flex flex-col h-full relative">
      {toast && (
        <div
          role="status"
          className={`absolute top-4 right-4 z-50 rounded-md px-4 py-2 text-sm shadow ${
            toast.tone === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}
      {error && (
        <div className="mb-2 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center space-x-2">
          <Button className="bg-white" aria-label="Bold (not yet implemented)" disabled>
            <Bold className="h-4 w-4" />
          </Button>
          <Button className="bg-white" aria-label="Italic (not yet implemented)" disabled>
            <Italic className="h-4 w-4" />
          </Button>
          <Button className="bg-white" aria-label="Bullet list (not yet implemented)" disabled>
            <List className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <input
            value={fileName}
            onChange={(event) => setFileName(event.target.value)}
            className="border border-gray-200 rounded px-3 py-2 text-sm"
            placeholder="draft-file-name.md"
            aria-label="Draft file name"
          />
          <Button
            className={`border ${isPreview ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200'}`}
            onClick={() => setIsPreview((prev) => !prev)}
          >
            <Eye className="mr-2 h-4 w-4" />
            {isPreview ? 'Edit' : 'Preview'}
          </Button>
          <Button
            className="border bg-white border-gray-200"
            onClick={handleGenerateFromChecklist}
            aria-label="Generate draft content from checklist"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Draft from checklist
          </Button>
          <Button
            className="bg-blue-600 text-white"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving…' : 'Save Draft'}
          </Button>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {isPreview ? (
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: previewHtml }} />
        ) : (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onClick={handleSelection}
            onKeyUp={handleSelection}
            onSelect={handleSelection}
            className="w-full h-full min-h-[420px] p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Start writing your proposal draft…"
          />
        )}

        {generatedPreview && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-blue-900">Generated from checklist</h3>
              <Button
                className="bg-blue-600 text-white"
                onClick={() => addToDraft({
                  text: generatedPreview,
                  summary: 'Checklist-based draft suggestion',
                })}
              >
                Add to draft
              </Button>
            </div>
            <pre className="whitespace-pre-wrap text-sm text-blue-900">{generatedPreview}</pre>
          </div>
        )}
      </div>
    </div>
  );
}