import { config as loadEnv } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env
loadEnv({ path: resolve(__dirname, '../../../.env') });

console.log('✅ Environment loaded');
console.log('✅ OPENAI_API_KEY present:', !!process.env.OPENAI_API_KEY);

// Import and start the server
console.log('✅ Starting server...');
import('./dist/index.js')
  .then(() => {
    console.log('✅ Server module loaded successfully');
  })
  .catch((err) => {
    console.error('❌ Failed to load server:', err);
    process.exit(1);
  });

