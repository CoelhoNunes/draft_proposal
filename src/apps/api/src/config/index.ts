/**
 * @fileoverview Application configuration
 */

import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenvConfig();

const configSchema = z.object({
  // Server configuration
  server: z.object({
    host: z.string().default('localhost'),
    port: z.number().default(3001),
    scheme: z.enum(['http', 'https']).default('http'),
  }),

  // Database configuration
  database: z.object({
    url: z.string().url(),
  }),

  // Authentication
  auth: z.object({
    jwtSecret: z.string().min(32),
    jwtExpiresIn: z.string().default('7d'),
  }),

  // CORS configuration
  cors: z.object({
    origins: z.array(z.string()).default(['http://localhost:3000']),
  }),

  // File upload configuration
  upload: z.object({
    maxFileSize: z.number().default(50 * 1024 * 1024), // 50MB
    maxFiles: z.number().default(10),
    allowedMimeTypes: z.array(z.string()).default([
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ]),
  }),

  // AI/LLM configuration
  ai: z.object({
    provider: z.enum(['openai', 'azure', 'custom']).default('openai'),
    apiKey: z.string().optional(),
    baseUrl: z.string().url().optional(),
    model: z.string().default('gpt-4'),
    temperature: z.number().min(0).max(2).default(0.3),
    maxTokens: z.number().positive().default(1200),
  }),

  // Azure configuration
  azure: z.object({
    storageAccountName: z.string().optional(),
    storageAccountKey: z.string().optional(),
    storageContainerName: z.string().default('microtech-documents'),
    keyVaultUrl: z.string().url().optional(),
    cosmosDbUrl: z.string().url().optional(),
    cosmosDbKey: z.string().optional(),
  }),

  // Logging configuration
  logging: z.object({
    level: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    pretty: z.boolean().default(process.env.NODE_ENV !== 'production'),
  }),
});

const rawConfig = {
  server: {
    host: process.env.HOST || 'localhost',
    port: parseInt(process.env.PORT || '3001', 10),
    scheme: process.env.SCHEME || 'http',
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/microtech',
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  },
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800', 10), // 50MB
    maxFiles: parseInt(process.env.MAX_FILES || '10', 10),
    allowedMimeTypes: process.env.ALLOWED_MIME_TYPES?.split(',') || [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ],
  },
  ai: {
    provider: process.env.AI_PROVIDER || 'openai',
    apiKey: process.env.OPENAI_API_KEY || process.env.AI_API_KEY,
    baseUrl: process.env.AI_BASE_URL,
    model: process.env.AI_MODEL || 'gpt-4',
    temperature: parseFloat(process.env.AI_TEMPERATURE || '0.3'),
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || '1200', 10),
  },
  azure: {
    storageAccountName: process.env.AZURE_STORAGE_ACCOUNT_NAME,
    storageAccountKey: process.env.AZURE_STORAGE_ACCOUNT_KEY,
    storageContainerName: process.env.AZURE_STORAGE_CONTAINER_NAME || 'microtech-documents',
    keyVaultUrl: process.env.AZURE_KEY_VAULT_URL,
    cosmosDbUrl: process.env.AZURE_COSMOS_DB_URL,
    cosmosDbKey: process.env.AZURE_COSMOS_DB_KEY,
  },
  logging: {
    level: (process.env.LOG_LEVEL || 'info') as any,
    pretty: process.env.NODE_ENV !== 'production',
  },
};

export const config = configSchema.parse(rawConfig);

// Validate required environment variables
if (!config.ai.apiKey && config.ai.provider !== 'custom') {
  console.warn('⚠️  AI_API_KEY not set - AI features will be disabled');
}

if (!config.azure.storageAccountName && process.env.NODE_ENV === 'production') {
  console.warn('⚠️  AZURE_STORAGE_ACCOUNT_NAME not set - file storage will use local filesystem');
}
