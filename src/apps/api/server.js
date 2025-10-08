// Bootstrap script to load compiled TypeScript server
import { config as loadEnv } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
loadEnv({ path: resolve(__dirname, '../../../.env') });

// Import and start the compiled TypeScript server
import('./dist/index.js').catch((err) => {
  console.error('Failed to load server:', err);
  process.exit(1);
});
