# MicroTech Platform

> **Professional FedRAMP Proposal Assistance and Recruiting Platform**

A comprehensive, enterprise-grade platform built with modern React frontend, Node.js backend, and Azure cloud infrastructure. Designed to streamline proposal management and recruiting workflows with AI-powered assistance.

## 🚀 Quick Start

### Option 1: WSL/Ubuntu (Recommended)
```bash
# 1. Install prerequisites
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pnpm@8

# 2. Clone and setup
git clone <your-repo-url>
cd fedramp_rfp_assistant

# 3. Automated setup and start
chmod +x scripts/*.sh
./scripts/setup.sh
./scripts/start-dev.sh
```

### Option 2: Windows with WSL
```powershell
# Run the PowerShell helper script
.\start-wsl.ps1
# Follow the interactive prompts
```

### Option 3: Manual Setup
```bash
# Install dependencies
pnpm install

# Build packages
pnpm build

# Setup environment
cp env.example .env
# Edit .env with your configuration

# Start development servers
pnpm dev
```

### Access URLs
- **Web Application**: http://localhost:5173
- **API Server**: http://localhost:3000
- **API Documentation**: http://localhost:3000/docs

### Quick Commands
```bash
# Run all tests
./scripts/test.sh

# Run tests with coverage
./scripts/test.sh --coverage

# Run linting
pnpm lint
```

## 📁 Project Structure

```
microtech-platform/
├── apps/                          # Applications
│   ├── web/                       # React frontend application
│   │   ├── src/
│   │   │   ├── components/        # React components
│   │   │   ├── pages/            # Page components
│   │   │   ├── store/            # Zustand state management
│   │   │   ├── design/           # Design tokens and themes
│   │   │   └── test/             # Test setup and utilities
│   │   ├── package.json
│   │   ├── vite.config.ts        # Vite configuration
│   │   ├── tailwind.config.js    # TailwindCSS configuration
│   │   └── tsconfig.json         # TypeScript configuration
│   └── api/                       # Node.js backend API
│       ├── src/
│       │   ├── routes/           # API route handlers
│       │   ├── middleware/       # Express middleware
│       │   ├── config/           # Configuration files
│       │   ├── utils/            # Utility functions
│       │   └── test/             # API tests
│       ├── package.json
│       └── tsconfig.json
├── packages/                      # Shared packages
│   ├── ui/                        # Shared UI components (shadcn/ui)
│   ├── core/                      # Domain models and utilities
│   ├── ai/                        # AI service integration
│   └── pdf/                       # PDF processing utilities
├── infrastructure/                # Azure Infrastructure as Code
│   └── bicep/                     # Bicep templates
├── .github/                       # GitHub Actions CI/CD
│   └── workflows/                 # Deployment workflows
├── config/                        # Shared configuration
│   ├── eslint/                    # ESLint configuration
│   ├── prettier/                  # Prettier configuration
│   └── tsconfig/                  # TypeScript configuration
└── docs/                          # Documentation
    ├── API_DOCUMENTATION.md
    ├── DEPLOYMENT.md
    ├── SECURITY.md
    └── USER_GUIDE.md
```

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and building
- **Styling**: TailwindCSS with shadcn/ui components
- **State Management**: Zustand for lightweight state management
- **Routing**: React Router for client-side routing
- **Testing**: Vitest + React Testing Library

### Backend (Node.js + TypeScript)
- **Runtime**: Node.js with TypeScript
- **Framework**: Fastify for high-performance API server
- **Database**: Prisma ORM with Azure Cosmos DB
- **Authentication**: JWT-based authentication
- **File Storage**: Azure Blob Storage
- **Documentation**: Swagger/OpenAPI

### Infrastructure (Azure)
- **Compute**: Azure App Service for API, Static Web Apps for frontend
- **Database**: Azure Cosmos DB for document storage
- **Storage**: Azure Blob Storage for file uploads
- **Secrets**: Azure Key Vault for secure configuration
- **Monitoring**: Azure Application Insights
- **IaC**: Bicep templates for infrastructure provisioning

## 🎯 Key Features

### Proposal Management
- **3-Column Workspace**: Checklist, Draft Editor, Change Log
- **AI-Powered Chat**: Context-aware AI assistant for live editing
- **Document Processing**: Upload and analyze PDF/DOCX files
- **Interactive Checklists**: Auto-generated from document analysis
- **Real-time Collaboration**: Multi-user editing with change tracking
- **Export Capabilities**: PDF/DOCX export with professional formatting

### Recruiting Workflow
- **Candidate Analysis**: Resume vs. job description matching
- **Skills Assessment**: Automated skills gap analysis
- **Report Generation**: Comprehensive evaluation reports
- **Template Management**: Reusable email and document templates

### Platform Features
- **Professional UI**: Clean, modern design with MicroTech branding
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Optimized for large documents and concurrent users
- **Security**: Enterprise-grade security with Azure integration

## 🔧 Development Commands

```bash
# Install dependencies
pnpm install

# Development mode
pnpm dev                    # Start all apps in development mode
pnpm --filter web dev       # Start only web app
pnpm --filter api dev       # Start only API

# Building
pnpm build                  # Build all packages and apps
pnpm --filter web build     # Build only web app
pnpm --filter api build     # Build only API

# Testing
pnpm test                   # Run all tests
pnpm test:coverage          # Run tests with coverage
pnpm --filter web test      # Test only web app
pnpm --filter api test      # Test only API

# Code Quality
pnpm lint                   # Lint all code
pnpm format                 # Format all code
pnpm typecheck              # Type check all TypeScript

# Database
pnpm --filter api db:generate  # Generate Prisma client
pnpm --filter api db:migrate   # Run database migrations
pnpm --filter api db:push      # Push schema changes
```

## 🚀 Deployment

### Local Development
```bash
# Start both frontend and backend
pnpm dev
```

### Azure Deployment
```bash
# Deploy infrastructure
cd infrastructure/bicep
az group create --name rg-microtech-prod --location eastus
az deployment group create --resource-group rg-microtech-prod --template-file main.bicep

# Deploy applications via GitHub Actions
git push origin main
```

## 📚 Documentation

- [API Documentation](./API_DOCUMENTATION.md) - Complete API reference
- [Deployment Guide](./DEPLOYMENT.md) - Azure deployment instructions
- [Security Guide](./SECURITY.md) - Security measures and compliance
- [User Guide](./USER_GUIDE.md) - End-user documentation
- [Contributing Guide](./CONTRIBUTING.md) - Development guidelines

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the Apache-2.0 License - see the [LICENSE](./LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/your-org/microtech-platform/issues)
- **Documentation**: [Project Wiki](https://github.com/your-org/microtech-platform/wiki)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/microtech-platform/discussions)

---

**Built with ❤️ by the MicroTech Team**