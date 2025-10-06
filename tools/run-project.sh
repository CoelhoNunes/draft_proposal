#!/bin/bash

echo "🚀 Starting MicroTech Platform..."

# Start API server in background
cd apps/api
npm run dev &
API_PID=$!

# Wait 2 seconds for API to start
sleep 2

# Start web app
cd ../web
npm run dev

echo "✅ Platform running at http://localhost:5173"
