import React from 'react';
import { Bot, Clock, Highlighter } from 'lucide-react';
import type { DraftLlmChange } from '@/store/draftStore';

const Card = ({ children, className }: any) => (
  <div className={`border rounded-lg bg-white p-4 ${className || ''}`}>{children}</div>
);

interface ChangeLogProps {
  changes: DraftLlmChange[];
  compact?: boolean;
  onHighlight?: (change: DraftLlmChange) => void;
}

export function ChangeLog({ changes, compact = false, onHighlight }: ChangeLogProps) {
  const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (!changes.length) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
        No approved LLM changes yet.
      </div>
    );
  }

  return (
    <div className="space-y-3" role="list">
      {changes.map((change) => (
        <Card
          role="listitem"
          key={change.id}
          className={`transition-shadow focus-within:ring-2 focus-within:ring-blue-500 ${
            change.highlight ? 'ring-2 ring-blue-400 bg-blue-50' : 'hover:shadow-sm'
          }`}
        >
          <div className="flex items-start space-x-3">
            <Bot className="h-4 w-4 flex-shrink-0 text-blue-500" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className={`text-sm font-medium ${change.highlight ? 'text-blue-900' : 'text-gray-900'}`}>
                  {change.summary}
                </p>
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  <span>{formatTime(new Date(change.createdAt))}</span>
                </div>
              </div>
              <p className={`mt-2 text-xs leading-relaxed ${change.highlight ? 'text-blue-900' : 'text-gray-600'}`}>
                {change.insertedText}
              </p>
              {onHighlight && (
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onHighlight(change)}
                    className="inline-flex items-center gap-1 rounded border border-blue-200 px-3 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                  >
                    <Highlighter className="h-3 w-3" /> Highlight in Draft
                  </button>
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
