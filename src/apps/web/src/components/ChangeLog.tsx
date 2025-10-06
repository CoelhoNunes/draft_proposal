import React from 'react';
import { Bot, User, Clock, MessageSquare } from 'lucide-react';

// Simple components
const Card = ({ children, className }: any) => <div className={`border rounded-lg bg-white p-4 ${className || ''}`}>{children}</div>;

interface Change {
  id: string;
  author: 'ai' | 'user';
  summary: string;
  anchors: string[];
  diff: any;
  createdAt: Date;
}

interface ChangeLogProps {
  changes: Change[];
  workspaceId: string;
  compact?: boolean;
}

export function ChangeLog({ changes, workspaceId, compact = false }: ChangeLogProps) {
  const getAuthorIcon = (author: string) => {
    switch (author) {
      case 'ai':
        return <Bot className="h-4 w-4 text-blue-500" />;
      case 'user':
        return <User className="h-4 w-4 text-green-500" />;
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
        <Card key={change.id} className="hover:shadow-sm transition-shadow cursor-pointer">
          <div className="flex items-start space-x-3">
            {getAuthorIcon(change.author)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900">
                  {change.summary}
                </p>
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  <span>{formatTime(change.createdAt)}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-gray-500 capitalize">
                  {change.author}
                </span>
                {change.anchors.length > 0 && (
                  <span className="text-xs text-blue-600">
                    • {change.anchors.length} anchor{change.anchors.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}