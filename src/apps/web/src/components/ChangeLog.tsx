import React from 'react';
import { Bot, Clock, MessageSquare } from 'lucide-react';
import type { DraftLlmChange } from '@/store/draftStore';

// Simple components
const Card = ({ children, className }: any) => <div className={`border rounded-lg bg-white p-4 ${className || ''}`}>{children}</div>;

interface ChangeLogProps {
  changes: DraftLlmChange[];
  workspaceId: string;
  compact?: boolean;
}

export function ChangeLog({ changes, workspaceId, compact = false }: ChangeLogProps) {
  const getAuthorIcon = (author: string) => {
    switch (author) {
      case 'ai':
        return <Bot className="h-4 w-4 text-blue-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-3">
      {changes.map((change) => (
        <Card
          key={change.id}
          className={`transition-shadow ${change.highlight ? 'ring-2 ring-blue-400 bg-blue-50' : 'hover:shadow-sm'}`}
        >
          <div className="flex items-start space-x-3">
            {getAuthorIcon('ai')}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className={`text-sm font-medium ${change.highlight ? 'text-blue-900' : 'text-gray-900'}`}>
                  {change.summary}
                </p>
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  <span>{formatTime(new Date(change.createdAt))}</span>
                </div>
              </div>
              <p className={`mt-2 text-xs ${change.highlight ? 'text-blue-900' : 'text-gray-600'}`}>
                {change.content}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}