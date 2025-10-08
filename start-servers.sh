#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "==> Creating required directories..."
mkdir -p src/apps/public
mkdir -p src/apps/api/public

echo "==> Starting API server (port 3000)..."
cd src/apps/api
node simple-server.js &
API_PID=$!
echo "API PID: $API_PID"
cd ../../..

echo "==> Starting Web server (port 5173)..."
cd src/apps/web
npx vite --host 0.0.0.0 --port 5173 &
WEB_PID=$!
echo "Web PID: $WEB_PID"
cd ../..

echo ""
echo "✅ Servers started!"
echo "📡 API: http://localhost:3000/api/health"
echo "🌐 Web: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait $API_PID $WEB_PID

