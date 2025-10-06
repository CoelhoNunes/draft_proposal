#!/bin/bash

# =============================================================================
# MicroTech Platform Setup Script for WSL/Ubuntu
# =============================================================================
# This script sets up the development environment for the MicroTech Platform

set -e  # Exit on any error

echo "🚀 Setting up MicroTech Platform Development Environment"
echo "=================================================="

# =============================================================================
# Check system requirements
# =============================================================================
echo "📋 Checking system requirements..."

# Check if running on WSL
if grep -q Microsoft /proc/version; then
    echo "✅ Running on WSL"
else
    echo "⚠️  Not running on WSL - some features may not work as expected"
fi

# Check Node.js version
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -ge 18 ]; then
        echo "✅ Node.js $(node --version) is installed"
    else
        echo "❌ Node.js version 18+ required. Current: $(node --version)"
        exit 1
    fi
else
    echo "❌ Node.js not found. Please install Node.js 18+ first."
    exit 1
fi

# Check pnpm
if command -v pnpm &> /dev/null; then
    echo "✅ pnpm $(pnpm --version) is installed"
else
    echo "📦 Installing pnpm..."
    npm install -g pnpm@8
    echo "✅ pnpm installed"
fi

# =============================================================================
# Install dependencies
# =============================================================================
echo ""
echo "📦 Installing project dependencies..."
pnpm install

# =============================================================================
# Build packages
# =============================================================================
echo ""
echo "🔨 Building shared packages..."
pnpm build

# =============================================================================
# Setup environment
# =============================================================================
echo ""
echo "⚙️  Setting up environment configuration..."

if [ ! -f .env ]; then
    if [ -f env.example ]; then
        cp env.example .env
        echo "✅ Created .env file from template"
        echo "⚠️  Please edit .env file with your configuration"
    else
        echo "⚠️  No env.example found. Creating basic .env file..."
        cat > .env << EOF
# MicroTech Platform Environment Configuration
NODE_ENV=development
HOST=localhost
PORT=3000
SCHEME=http

# Database
DATABASE_URL=your-cosmos-db-connection-string

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production-minimum-32-characters
JWT_EXPIRES_IN=7d

# AI Configuration
AI_PROVIDER=openai
OPENAI_API_KEY=your-openai-api-key-here
AI_MODEL=gpt-4

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# File Upload
MAX_FILE_SIZE=52428800
MAX_FILES=10
ALLOWED_MIME_TYPES=application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain

# Logging
LOG_LEVEL=info
LOG_PRETTY=true
EOF
    fi
else
    echo "✅ .env file already exists"
fi

# =============================================================================
# Run tests
# =============================================================================
echo ""
echo "🧪 Running tests..."
pnpm test

# =============================================================================
# Setup complete
# =============================================================================
echo ""
echo "🎉 Setup complete!"
echo "=================="
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Start the development servers:"
echo "   - API:    cd apps/api && pnpm dev"
echo "   - Web:    cd apps/web && pnpm dev"
echo "3. Or start both at once: pnpm dev"
echo ""
echo "📚 Documentation:"
echo "   - README.md - Complete setup guide"
echo "   - API_DOCUMENTATION.md - API reference"
echo "   - USER_GUIDE.md - User documentation"
echo ""
echo "🔗 URLs:"
echo "   - Web App: http://localhost:5173"
echo "   - API:     http://localhost:3000"
echo "   - API Docs: http://localhost:3000/docs"
echo ""
