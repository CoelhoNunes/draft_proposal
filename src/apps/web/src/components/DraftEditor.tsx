import React, { useState } from 'react';
import { Bold, Italic, List, Save, Eye } from 'lucide-react';

// Simple components
const Button = ({ children, className, onClick, variant, size, disabled, ...props }: any) => (
  <button 
    className={`px-4 py-2 rounded ${disabled ? 'opacity-50' : ''} ${className || ''}`} 
    onClick={onClick} 
    disabled={disabled}
    {...props}
  >
    {children}
  </button>
);

interface DraftEditorProps {
  content: string;
  workspaceId: string;
}

export function DraftEditor({ content, workspaceId }: DraftEditorProps) {
  const [editorContent, setEditorContent] = useState(content);
  const [isPreview, setIsPreview] = useState(false);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditorContent(e.target.value);
  };

  const handleSave = () => {
    console.log('Saving content:', editorContent);
    // TODO: Implement save functionality
  };

  const handleExport = () => {
    console.log('Exporting to PDF');
    // TODO: Implement PDF export
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="outline">
            <Bold className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline">
            <Italic className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline">
            <List className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            size="sm" 
            variant={isPreview ? "default" : "outline"}
            onClick={() => setIsPreview(!isPreview)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {isPreview ? 'Edit' : 'Preview'}
          </Button>
          <Button size="sm" variant="outline" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button size="sm" onClick={handleExport}>
            Export PDF
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 p-4">
        {isPreview ? (
          <div className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: editorContent }} />
          </div>
        ) : (
          <textarea
            value={editorContent}
            onChange={handleContentChange}
            className="w-full h-full p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Start writing your proposal draft..."
          />
        )}
      </div>
    </div>
  );
}