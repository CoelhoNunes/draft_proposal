# 🚀 MicroTech Platform - WSL Startup Guide

This guide will help you get the MicroTech Platform running in WSL (Windows Subsystem for Linux) for development and testing.

## 📋 Prerequisites

### 1. WSL Setup
```bash
# Install WSL 2 (if not already installed)
wsl --install

# Or install specific distribution
wsl --install -d Ubuntu-22.04
```

### 2. Node.js and pnpm Installation
```bash
# Update package list
sudo apt update

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should be 18.x.x or higher
npm --version

# Install pnpm globally
npm install -g pnpm@8

# Verify pnpm installation
pnpm --version  # Should be 8.x.x
```

### 3. Git Setup (if needed)
```bash
# Install git
sudo apt install git

# Configure git
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## 🚀 Quick Start (Automated Setup)

### Option 1: Use Setup Script
```bash
# Navigate to project directory
cd /mnt/c/Users/Coelh/OneDrive/Desktop/fedramp_rfp_assistant

# Make scripts executable
chmod +x scripts/*.sh

# Run automated setup
./scripts/setup.sh

# Start development servers
./scripts/start-dev.sh
```

### Option 2: Manual Setup
```bash
# 1. Navigate to project directory
cd /mnt/c/Users/Coelh/OneDrive/Desktop/fedramp_rfp_assistant

# 2. Install dependencies
pnpm install

# 3. Build shared packages
pnpm build

# 4. Setup environment
cp env.example .env
# Edit .env with your configuration
nano .env

# 5. Start development servers
pnpm dev
```

## ⚙️ Environment Configuration

### 1. Create Environment File
```bash
# Copy the example environment file
cp env.example .env

# Edit the environment file
nano .env
```

### 2. Essential Environment Variables
```bash
# Server Configuration
NODE_ENV=development
HOST=localhost
PORT=3000

# Authentication (generate a strong secret)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

# AI Configuration (optional for basic testing)
AI_PROVIDER=openai
OPENAI_API_KEY=your-openai-api-key-here
AI_MODEL=gpt-4

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# File Upload Limits
MAX_FILE_SIZE=52428800  # 50MB
MAX_FILES=10
```

## 🎯 Development Commands

### Start Development Servers
```bash
# Start both API and Web servers
pnpm dev

# Or start individually:
# API server only
cd apps/api && pnpm dev

# Web server only  
cd apps/web && pnpm dev
```

### Testing Commands
```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run specific app tests
pnpm --filter web test
pnpm --filter api test

# Run tests in watch mode
pnpm test --watch
```

### Code Quality Commands
```bash
# Lint all code
pnpm lint

# Format code
pnpm format

# Type check
pnpm typecheck

# Build all packages
pnpm build
```

## 🌐 Accessing the Application

Once the servers are running, you can access:

- **Web Application**: http://localhost:5173
- **API Server**: http://localhost:3000
- **API Documentation**: http://localhost:3000/docs

## 🔧 Troubleshooting

### Common Issues

#### 1. Permission Denied Errors
```bash
# Fix script permissions
chmod +x scripts/*.sh

# Fix file permissions
chmod -R 755 .
```

#### 2. Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Find process using port 5173
lsof -i :5173

# Kill process (replace PID with actual process ID)
kill -9 PID
```

#### 3. Node.js Version Issues
```bash
# Check Node.js version
node --version

# If version is too old, reinstall:
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### 4. pnpm Not Found
```bash
# Reinstall pnpm
npm install -g pnpm@8

# Or use npx
npx pnpm install
```

#### 5. Build Failures
```bash
# Clean and rebuild
pnpm clean
pnpm install
pnpm build
```

### Performance Issues

#### 1. Slow File System Access
```bash
# Move project to WSL file system for better performance
cp -r /mnt/c/Users/Coelh/OneDrive/Desktop/fedramp_rfp_assistant ~/microtech-platform
cd ~/microtech-platform
```

#### 2. Memory Issues
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Or add to .env file
echo "NODE_OPTIONS=--max-old-space-size=4096" >> .env
```

## 📁 Project Structure Overview

```
microtech-platform/
├── apps/                    # Applications
│   ├── web/                # React frontend
│   └── api/                # Node.js backend
├── packages/               # Shared packages
│   ├── ui/                 # UI components
│   ├── core/               # Core utilities
│   ├── ai/                 # AI services
│   └── pdf/                # PDF processing
├── scripts/                # Setup and utility scripts
├── docs/                   # Documentation
├── infrastructure/         # Azure deployment
└── .github/               # CI/CD workflows
```

## 🧪 Testing the Application

### 1. Basic Functionality Test
```bash
# Start servers
pnpm dev

# In another terminal, test API
curl http://localhost:3000/api/health

# Expected response:
# {"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}
```

### 2. Frontend Test
```bash
# Open browser to http://localhost:5173
# You should see the MicroTech Platform home page
```

### 3. Run Full Test Suite
```bash
# Run all tests
./scripts/test.sh

# Run with coverage
./scripts/test.sh --coverage

# Run in watch mode
./scripts/test.sh --watch
```

## 🚀 Production Deployment

### Local Production Build
```bash
# Build for production
pnpm build

# Start production servers
cd apps/api && pnpm start
cd apps/web && pnpm preview
```

### Azure Deployment
```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login to Azure
az login

# Deploy infrastructure
cd infrastructure/bicep
az group create --name rg-microtech-prod --location eastus
az deployment group create --resource-group rg-microtech-prod --template-file main.bicep

# Deploy via GitHub Actions
git push origin main
```

## 📚 Additional Resources

- **README.md** - Complete project documentation
- **docs/API_DOCUMENTATION.md** - API reference
- **docs/USER_GUIDE.md** - User documentation
- **docs/DEPLOYMENT.md** - Deployment guide
- **docs/SECURITY.md** - Security documentation

## 🆘 Getting Help

1. **Check the logs** - Look at terminal output for error messages
2. **Review documentation** - Check the docs/ folder
3. **Run tests** - Use `./scripts/test.sh` to verify setup
4. **Check issues** - Look for similar issues in the repository

## 🎉 Success!

If everything is working correctly, you should see:

```
🚀 Server running at http://localhost:3000
📚 API documentation available at http://localhost:3000/docs
```

And the web application should be accessible at http://localhost:5173

Happy coding! 🎊
