/**
 * @fileoverview Core domain types and interfaces for the MicroTech platform
 */

import { z } from '../z';

type InferSchema<T extends { parse: (value: unknown) => unknown }> = T extends {
  parse: (value: unknown) => infer U;
}
  ? U
  : never;

// Base entity schemas
export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const WorkspaceSchema = z.object({
  id: z.string().uuid(),
  kind: z.enum(['proposal', 'recruiting']),
  title: z.string().min(1),
  ownerId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const DocumentSchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  type: z.enum(['upload', 'draft', 'export']),
  blobUrl: z.string().url(),
  meta: z.record(z.unknown()).optional(),
});

export const ChecklistItemSchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  label: z.string().min(1),
  status: z.enum(['found', 'missing', 'needs_revision']),
  source: z.string().optional(),
  anchors: z.array(z.string()).default([]),
});

export const ChangeSchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  author: z.enum(['ai', 'user']),
  summary: z.string().min(1),
  anchors: z.array(z.string()).default([]),
  diff: z.record(z.unknown()).optional(),
  createdAt: z.date(),
});

// Type exports
export type User = InferSchema<typeof UserSchema>;
export type Workspace = InferSchema<typeof WorkspaceSchema>;
export type Document = InferSchema<typeof DocumentSchema>;
export type ChecklistItem = InferSchema<typeof ChecklistItemSchema>;
export type Change = InferSchema<typeof ChangeSchema>;

// Workspace-specific types
export interface ProposalWorkspace extends Workspace {
  kind: 'proposal';
  requirements: ChecklistItem[];
  draft: Document | null;
  exports: Document[];
}

export interface RecruitingWorkspace extends Workspace {
  kind: 'recruiting';
  jobDescription: string | null;
  candidateProfile: string | null;
  analysis: RecruitingAnalysis | null;
}

export interface RecruitingAnalysis {
  matchScore: number;
  seniority: string;
  skillsOverlap: string[];
  skillsGaps: string[];
  recommendations: string[];
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// File upload types
export interface FileUpload {
  file: File;
  workspaceId: string;
  type: 'proposal' | 'resume' | 'job_description';
}

export interface UploadProgress {
  fileId: string;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

// Chat and AI types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  context?: {
    workspaceId: string;
    tab: 'proposals' | 'recruiting';
    anchors?: string[];
  };
}

export interface AIEditProposal {
  summary: string;
  selectionAnchor?: string;
  operations: EditOperation[];
}

export interface EditOperation {
  type: 'insert' | 'replace' | 'delete';
  anchor: string;
  content?: string;
  metadata?: Record<string, unknown>;
}


// Export and download types
export interface ExportRequest {
  workspaceId: string;
  format: 'pdf' | 'docx';
  options: {
    includeHighlights?: boolean;
    includeComments?: boolean;
    template?: string;
  };
}

export interface ExportResult {
  id: string;
  workspaceId: string;
  format: string;
  downloadUrl: string;
  createdAt: Date;
  expiresAt: Date;
}
