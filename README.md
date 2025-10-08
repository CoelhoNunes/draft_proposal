# FedRAMP RFP Assistant

A comprehensive platform designed to assist with FedRAMP (Federal Risk and Authorization Management Program) Request for Proposal (RFP) processes and recruiting workflows.

## Features

- **Proposal Management**: Streamlined RFP response creation and management
- **AI-Powered Assistance**: Intelligent chat support for proposal development
- **Document Processing**: Upload and analyze RFP documents
- **Checklist Management**: Track compliance requirements and deliverables
- **Draft Editor**: Rich text editing with collaboration features
- **Export Capabilities**: Generate professional proposal documents

## Architecture

This project uses a modern microservices architecture with the following components:

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Fastify + TypeScript
- **AI Integration**: OpenAI GPT integration for intelligent assistance
- **State Management**: Zustand for client-side state
- **UI Components**: Custom component library with Tailwind CSS
- **Package Manager**: pnpm with workspace support

## Project Structure

```
fedramp-rfp-assistant/
├── src/
│   ├── apps/
│   │   ├── web/          # React frontend application
│   │   └── api/          # Node.js backend API
│   └── packages/
│       ├── ui/           # Shared UI components
│       ├── core/         # Core utilities and types
│       └── ai/           # AI service integration
├── config/               # Configuration files
├── docs/                 # Documentation
└── scripts/              # Development scripts
```

## Prerequisites

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **Git** for version control

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Coelho-MT/Proposal_Project_draft.git
cd Proposal_Project_draft
```

### 2. Environment Setup

```bash
# Copy environment template
cp env.example .env

# Edit .env with your API keys
# Required: OPENAI_API_KEY
```

### 3. Install Dependencies

```bash
pnpm install --frozen-lockfile
```

### 4. Build Workspace

```bash
pnpm -w -r build
```

### 5. Start Development Servers

```bash
# Option 1: Use the development script
bash scripts/dev_run.sh

# Option 2: Manual start (two terminals)
# Terminal 1: API Server
cd src/apps/api && pnpm dev

# Terminal 2: Web Server  
cd src/apps/web && pnpm dev
```

## 🌐 Access Points

Once running, access the application at:

- **Web Application**: http://localhost:5173
- **API Server**: http://localhost:3001
- **API Documentation**: http://localhost:3001/docs

## 📋 Available Scripts

```bash
# Development
pnpm dev              # Start all development servers
pnpm build            # Build all packages
pnpm test             # Run all tests

# Individual apps
cd src/apps/api && pnpm dev     # API server only
cd src/apps/web && pnpm dev     # Web server only
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Required
OPENAI_API_KEY=your_openai_api_key_here

# Optional
NODE_ENV=development
PORT=3001
```

### API Configuration

The API server configuration can be found in `src/apps/api/src/config/index.ts`.

## API Documentation

When the API server is running, visit http://localhost:3001/docs for interactive API documentation powered by Swagger.

## Testing

```bash
# Run all tests
pnpm test

# Run tests for specific package
cd src/packages/core && pnpm test
```

## Deployment

### Production Build

```bash
# Build all packages
pnpm build

# Start production servers
cd src/apps/api && pnpm start
cd src/apps/web && pnpm preview
```

---

**Version**: 1.0.0  
**Last Updated**: January 2025  
**Maintainer**: Coelho-MT Team
