#!/bin/bash

# =============================================================================
# MicroTech Platform Development Startup Script
# =============================================================================
# This script starts the development environment for the MicroTech Platform

set -e  # Exit on any error

echo "🚀 Starting MicroTech Platform Development Environment"
echo "====================================================="

# =============================================================================
# Check if setup has been completed
# =============================================================================
if [ ! -d "node_modules" ]; then
    echo "❌ Dependencies not installed. Running setup first..."
    ./scripts/setup.sh
fi

# Check if packages are built
if [ ! -d "packages/ui/dist" ] || [ ! -d "packages/core/dist" ]; then
    echo "🔨 Building shared packages..."
    pnpm build
fi

if [ ! -f ".env" ]; then
    echo "❌ Environment file not found. Please run setup first:"
    echo "   ./scripts/setup.sh"
    exit 1
fi

# =============================================================================
# Start development servers
# =============================================================================
echo ""
echo "🔧 Starting development servers..."

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down development servers..."
    jobs -p | xargs -r kill
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start API server in background
echo "📡 Starting API server (http://localhost:3000)..."
cd apps/api
pnpm dev &
API_PID=$!
cd ../..

# Start Web server in background
echo "🌐 Starting Web server (http://localhost:5173)..."
cd apps/web
pnpm dev &
WEB_PID=$!
cd ../..

# Wait a moment for servers to start
sleep 3

# =============================================================================
# Display status and URLs
# =============================================================================
echo ""
echo "✅ Development servers started!"
echo "==============================="
echo ""
echo "🔗 Available URLs:"
echo "   📱 Web Application: http://localhost:5173"
echo "   📡 API Server:      http://localhost:3000"
echo "   📚 API Documentation: http://localhost:3000/docs"
echo ""
echo "📋 Server Status:"
echo "   API Server PID: $API_PID"
echo "   Web Server PID: $WEB_PID"
echo ""
echo "💡 Tips:"
echo "   - Press Ctrl+C to stop all servers"
echo "   - Check logs above for any errors"
echo "   - Edit .env file to configure environment"
echo "   - Run 'pnpm test' in another terminal to run tests"
echo ""
echo "🔄 Servers are running... Press Ctrl+C to stop"

# Wait for background processes
wait
