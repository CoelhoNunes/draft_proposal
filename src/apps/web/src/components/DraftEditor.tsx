import React, { useEffect, useMemo, useState } from 'react';
import { Bold, Eye, Italic, List, Save, Sparkles } from 'lucide-react';
import { useDraftStore, DraftSection } from '@/store/draftStore';
import { saveDraftToArchive } from '@/api/drafts';

interface DraftEditorProps {
  workspaceId: string;
  projectId: string;
}

const Button = ({ children, className, onClick, disabled, type = 'button', ...props }: any) => (
  <button
    type={type}
    className={`px-4 py-2 rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
      disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-50'
    } ${className || ''}`}
    onClick={onClick}
    disabled={disabled}
    {...props}
  >
    {children}
  </button>
);

const SectionCard = ({
  section,
  onHeadingChange,
  onContentChange,
  onSelection,
  highlighted,
}: {
  section: DraftSection;
  onHeadingChange: (sectionId: string, heading: string) => void;
  onContentChange: (sectionId: string, content: string) => void;
  onSelection: (sectionId: string, cursor: number | null) => void;
  highlighted: boolean;
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!highlighted || !textareaRef.current) {
      return;
    }
    const el = textareaRef.current;
    el.dataset.highlight = 'true';
    el.classList.add('ring-2', 'ring-blue-400', 'bg-blue-50');
    const clear = () => {
      if (textareaRef.current) {
        delete textareaRef.current.dataset.highlight;
        textareaRef.current.classList.remove('ring-2', 'ring-blue-400', 'bg-blue-50');
      }
    };
    const timer = setTimeout(clear, 2000);
    return () => {
      clearTimeout(timer);
      clear();
    };
  }, [highlighted]);

  return (
    <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <input
        value={section.heading}
        onChange={(event) => onHeadingChange(section.id, event.target.value)}
        className="w-full rounded border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:ring-blue-500"
        placeholder="Section heading"
        aria-label={`Heading for ${section.heading || 'section'}`}
      />
      <textarea
        ref={textareaRef}
        value={section.content}
        onChange={(event) => onContentChange(section.id, event.target.value)}
        onClick={(event) => onSelection(section.id, (event.target as HTMLTextAreaElement).selectionStart ?? null)}
        onKeyUp={(event) => onSelection(section.id, (event.target as HTMLTextAreaElement).selectionStart ?? null)}
        onSelect={(event) => onSelection(section.id, (event.target as HTMLTextAreaElement).selectionStart ?? null)}
        className="min-h-[180px] w-full resize-y rounded border border-gray-200 p-3 text-sm leading-relaxed focus:border-blue-500 focus:ring-blue-500"
        placeholder="Add draft content for this section"
      />
    </div>
  );
};

export function DraftEditor({ projectId }: DraftEditorProps) {
  const {
    sections,
    deliverables,
    addToDraft,
    composeProposalFromChecklist,
    setSections,
    updateSectionContent,
    setCursor,
    draftContent,
    toast,
    clearToast,
    llmChanges,
    run,
  } = useDraftStore();

  const [isPreview, setIsPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState('proposal-draft.md');
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);

  const previewHtml = useMemo(() => {
    return draftContent
      .split(/\n{2,}/)
      .map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br />')}</p>`)
      .join('');
  }, [draftContent]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => clearToast(), 2000);
    return () => clearTimeout(timer);
  }, [toast, clearToast]);

  useEffect(() => {
    const highlightedChange = llmChanges.find((change) => change.highlight);
    if (!highlightedChange) {
      setActiveHighlightId(null);
      return;
    }
    setActiveHighlightId(highlightedChange.id);
  }, [llmChanges]);

  const handleHeadingChange = (sectionId: string, heading: string) => {
    const nextSections = sections.map((section) =>
      section.id === sectionId ? { ...section, heading } : section,
    );
    setSections(nextSections);
  };

  const handleContentChange = (sectionId: string, content: string) => {
    updateSectionContent(sectionId, content);
  };

  const handleSelection = (sectionId: string, cursor: number | null) => {
    setCursor({ sectionId, cursor });
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
        title: run?.runName || 'Proposal Draft',
        status: 'draft',
        body: draftContent,
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

  const highlightedSectionId = useMemo(() => {
    if (!activeHighlightId) return null;
    const change = llmChanges.find((entry) => entry.id === activeHighlightId);
    return change?.sectionId ?? null;
  }, [activeHighlightId, llmChanges]);

  return (
    <div className="flex h-full flex-col">
      {toast && (
        <div
          role="status"
          className={`absolute top-4 right-4 z-20 rounded-md px-4 py-2 text-sm shadow ${
            toast.tone === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}
      {error && (
        <div className="mb-2 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between border-b bg-gray-50 p-4">
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
            className="rounded border border-gray-200 px-3 py-2 text-sm"
            placeholder="draft-file-name.md"
            aria-label="Draft file name"
          />
          <Button
            className={`border ${isPreview ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-200 bg-white'}`}
            onClick={() => setIsPreview((prev) => !prev)}
          >
            <Eye className="mr-2 h-4 w-4" />
            {isPreview ? 'Edit' : 'Preview'}
          </Button>
          <Button
            className="border border-gray-200 bg-white"
            onClick={handleGenerateFromChecklist}
            aria-label="Generate draft content from checklist"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Draft from checklist
          </Button>
          <Button className="bg-blue-600 text-white" onClick={handleSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving…' : 'Save Draft'}
          </Button>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {isPreview ? (
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: previewHtml }} />
        ) : (
          <div className="space-y-4">
            {sections.length === 0 && (
              <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                No sections yet. Import a PDF or ask the assistant to generate an outline.
              </div>
            )}
            {sections.map((section) => (
              <SectionCard
                key={section.id}
                section={section}
                onHeadingChange={handleHeadingChange}
                onContentChange={handleContentChange}
                onSelection={handleSelection}
                highlighted={highlightedSectionId === section.id}
              />
            ))}
          </div>
        )}

        {generatedPreview && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-blue-900">Generated from checklist</h3>
              <Button
                className="bg-blue-600 text-white"
                onClick={() =>
                  addToDraft({
                    sectionId: sections[0]?.id,
                    text: generatedPreview,
                    summary: 'Checklist-based draft suggestion',
                  })
                }
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
