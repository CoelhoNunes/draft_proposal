/**
 * @fileoverview Shared validation utilities and schemas
 */

import { z } from '../z';
import {
  UserSchema,
  WorkspaceSchema,
  DocumentSchema,
  ChecklistItemSchema,
  ChangeSchema
} from '../types';

type SafeParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: { errors: Array<{ path: (string | number)[]; message: string }> } };

interface ValidationSchema<T> {
  parse(data: unknown): T;
  safeParse(data: unknown): SafeParseResult<T>;
}

// API validation schemas
export const CreateWorkspaceSchema = z.object({
  kind: z.enum(['proposal', 'recruiting']),
  title: z.string().min(1).max(255),
  ownerId: z.string().uuid(),
});

export const UpdateWorkspaceSchema = z.object({
  title: z.string().min(1).max(255).optional(),
});

export const CreateChecklistItemSchema = z.object({
  workspaceId: z.string().uuid(),
  label: z.string().min(1).max(1000),
  status: z.enum(['found', 'missing', 'needs_revision']).default('found'),
  source: z.string().optional(),
});

export const UpdateChecklistItemSchema = z.object({
  label: z.string().min(1).max(1000).optional(),
  status: z.enum(['found', 'missing', 'needs_revision']).optional(),
  source: z.string().optional(),
});

export const CreateChangeSchema = z.object({
  workspaceId: z.string().uuid(),
  author: z.enum(['ai', 'user']),
  summary: z.string().min(1).max(500),
  anchors: z.array(z.string()).default([]),
  diff: z.record(z.unknown()).optional(),
});

export const ChatMessageSchema = z.object({
  content: z.string().min(1).max(4000),
  context: z.object({
    workspaceId: z.string().uuid(),
    tab: z.enum(['proposals', 'recruiting']),
    anchors: z.array(z.string()).optional(),
  }).optional(),
});

export const FileUploadSchema = z.object({
  workspaceId: z.string().uuid(),
  type: z.enum(['proposal', 'resume', 'job_description']),
  fileName: z.string().min(1).max(255),
  fileSize: z.number().min(1).max(50 * 1024 * 1024), // 50MB max
  mimeType: z.enum([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ]),
});

export const ExportRequestSchema = z.object({
  workspaceId: z.string().uuid(),
  format: z.enum(['pdf', 'docx']),
  options: z
    .object({
      includeHighlights: z.boolean().default(false),
      includeComments: z.boolean().default(false),
      template: z.string().optional(),
    })
    .default({ includeHighlights: false, includeComments: false, template: undefined }),
});

// Utility validation functions
export function validateEmail(email: string): boolean {
  return z.string().email().safeParse(email).success;
}

export function validateUUID(uuid: string): boolean {
  return z.string().uuid().safeParse(uuid).success;
}

export function validateFileSize(size: number, maxMB: number = 50): boolean {
  return size > 0 && size <= maxMB * 1024 * 1024;
}

export function validateMimeType(mimeType: string): boolean {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];
  return allowedTypes.includes(mimeType);
}

// Error handling utilities
export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateAndThrow<T>(
  schema: ValidationSchema<T>,
  data: unknown,
  errorPrefix = 'Validation failed'
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const firstError = result.error.errors[0];
    throw new ValidationError(
      `${errorPrefix}: ${firstError.message}`,
      firstError.path.join('.'),
      data
    );
  }
  return result.data;
}
