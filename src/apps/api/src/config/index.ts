/**
 * @fileoverview Application configuration
 */

// Load environment variables from .env automatically (project root and API dir)
try {
  const path = require('path');
  const fs = require('fs');
  const dotenv = require('dotenv');
  const candidatePaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '../../../../.env'), // project root when running from dist
    path.resolve(__dirname, '../../../.env'),    // fallback relative
    path.resolve(__dirname, '../../.env'),
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      dotenv.config({ path: p });
      break;
    }
  }
} catch {}

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
    apiKey: process.env.OPENAI_KEY,
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
};

// Validate required environment variables
if (!config.ai.apiKey && config.ai.provider !== 'custom') {
  console.warn('⚠️  AI_API_KEY not set - AI features will be disabled');
}

if (!config.azure.storageAccountName && process.env.NODE_ENV === 'production') {
  console.warn('⚠️  AZURE_STORAGE_ACCOUNT_NAME not set - file storage will use local filesystem');
}
