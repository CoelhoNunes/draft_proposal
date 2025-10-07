/**
 * @fileoverview Application configuration
 */

import fs from 'fs';
import path from 'path';

function loadEnvFile(filePath: string): boolean {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith('#')) {
      continue;
    }
    const index = line.indexOf('=');
    if (index === -1) {
      continue;
    }
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }

  return true;
}

// Load environment variables from .env automatically (project root and API dir)
const candidatePaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../../../../.env'), // project root when running from dist
  path.resolve(__dirname, '../../../.env'), // fallback relative
  path.resolve(__dirname, '../../.env'),
];

for (const candidate of candidatePaths) {
  if (loadEnvFile(candidate)) {
    break;
  }
}

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
    origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
  },
  upload: {
    maxFileSize: (() => {
      if (process.env.MAX_UPLOAD_MB) {
        const megabytes = parseInt(process.env.MAX_UPLOAD_MB, 10);
        if (!Number.isNaN(megabytes)) {
          return megabytes * 1024 * 1024;
        }
      }
      return parseInt(process.env.MAX_FILE_SIZE || '52428800', 10);
    })(), // defaults to 50MB
    maxFiles: parseInt(process.env.MAX_FILES || '10', 10),
    allowedMimeTypes: process.env.ALLOWED_MIME_TYPES?.split(',') || [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ],
  },
  ai: {
    provider: process.env.AI_PROVIDER || 'openai',
    apiKey: process.env.OPENAI_KEY || process.env.OPENAI_API_KEY,
    baseUrl: process.env.AI_BASE_URL,
    model: process.env.AI_MODEL || process.env.LLM_MODEL || 'gpt-4',
    temperature: parseFloat(process.env.AI_TEMPERATURE || process.env.LLM_TEMP || '0.3'),
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || process.env.LLM_MAX_TOKENS || '1200', 10),
    topP: parseFloat(process.env.AI_TOP_P || process.env.LLM_TOP_P || '0.9'),
  },
  rag: {
    enabled: (process.env.FEATURE_FF_STRONG_RAG || '').toLowerCase() === 'true',
    embeddingModel: process.env.RAG_EMBED_MODEL || 'text-embedding-3-large',
    chunkSize: parseInt(process.env.RAG_CHUNK_SIZE || '1000', 10),
    chunkOverlap: parseInt(process.env.RAG_CHUNK_OVERLAP || '100', 10),
    hybridTopK: parseInt(process.env.RAG_TOP_K || '24', 10),
    rerankTopK: parseInt(process.env.RAG_RERANK_TOP_K || '8', 10),
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

// Minimal runtime validation without zod
export const config = {
  server: rawConfig.server,
  database: rawConfig.database,
  auth: rawConfig.auth,
  cors: rawConfig.cors,
  upload: rawConfig.upload,
  ai: rawConfig.ai,
  azure: rawConfig.azure,
  logging: rawConfig.logging,
  rag: rawConfig.rag,
  features: {
    strongRag: rawConfig.rag.enabled,
    archiveV2: (process.env.FEATURE_FF_ARCHIVE_V2 || '').toLowerCase() === 'true',
    chatGptStyle: (process.env.FEATURE_FF_CHATGPT_STYLE || '').toLowerCase() === 'true',
  },
};

// Validate required environment variables
if (!config.ai.apiKey && config.ai.provider !== 'custom') {
  console.warn('⚠️  AI_API_KEY not set - AI features will be disabled');
}

if (!config.azure.storageAccountName && process.env.NODE_ENV === 'production') {
  console.warn('⚠️  AZURE_STORAGE_ACCOUNT_NAME not set - file storage will use local filesystem');
}
