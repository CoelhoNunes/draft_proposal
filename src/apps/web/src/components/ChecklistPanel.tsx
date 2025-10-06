import React from 'react';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';

// Simple components
const Card = ({ children, className }: any) => <div className={`border rounded-lg bg-white p-4 ${className || ''}`}>{children}</div>;
const Badge = ({ children, className, variant }: any) => <span className={`px-2 py-1 text-xs rounded ${className || ''}`}>{children}</span>;

interface ChecklistItem {
  id: string;
  label: string;
  status: 'found' | 'missing' | 'needs_revision';
  source: string;
  anchors: string[];
}

interface ChecklistPanelProps {
  items: ChecklistItem[];
  workspaceId: string;
  detailed?: boolean;
}

export function ChecklistPanel({ items, workspaceId, detailed = false }: ChecklistPanelProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'found':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'needs_revision':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'missing':
        return <Clock className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'found':
        return <Badge className="bg-green-100 text-green-800">Found</Badge>;
      case 'needs_revision':
        return <Badge className="bg-yellow-100 text-yellow-800">Needs Revision</Badge>;
      case 'missing':
        return <Badge className="bg-red-100 text-red-800">Missing</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card key={item.id} className="hover:shadow-sm transition-shadow">
          <div className="flex items-start space-x-3">
            {getStatusIcon(item.status)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {item.label}
                </p>
                {getStatusBadge(item.status)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Source: {item.source}
              </p>
              {detailed && item.anchors.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-400">
                    Anchors: {item.anchors.join(', ')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}