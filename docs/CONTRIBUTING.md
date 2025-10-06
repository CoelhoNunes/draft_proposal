# Contributing Guide

## Overview

Thank you for your interest in contributing to the MicroTech platform! This guide provides information on how to contribute effectively to the project.

## Getting Started

### 1. Prerequisites
- Node.js (v20+)
- pnpm (v8+)
- Git
- Azure CLI (for deployment)
- Basic knowledge of React, TypeScript, and Node.js

### 2. Fork and Clone
```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/your-username/microtech-platform.git
cd microtech-platform

# Add upstream remote
git remote add upstream https://github.com/microtech/microtech-platform.git
```

### 3. Install Dependencies
```bash
# Install all dependencies
pnpm install

# Build all packages
pnpm build
```

### 4. Development Setup
```bash
# Start development servers
pnpm dev

# Run tests
pnpm test

# Run linting
pnpm lint
```

## Development Workflow

### 1. Branch Strategy
- **main**: Production-ready code
- **develop**: Integration branch for features
- **feature/**: Feature branches
- **bugfix/**: Bug fix branches
- **hotfix/**: Critical bug fixes

### 2. Creating a Branch
```bash
# Create and switch to feature branch
git checkout -b feature/new-feature

# Or from develop
git checkout develop
git pull upstream develop
git checkout -b feature/new-feature
```

### 3. Making Changes
1. **Code Changes**: Make your changes following the coding standards
2. **Tests**: Add tests for new functionality
3. **Documentation**: Update documentation as needed
4. **Linting**: Ensure code passes linting checks

### 4. Testing
```bash
# Run all tests
pnpm test

# Run specific test suite
pnpm test:web
pnpm test:api

# Run tests with coverage
pnpm test:coverage

# Run e2e tests
pnpm test:e2e
```

### 5. Committing Changes
```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add new feature description"

# Push to your fork
git push origin feature/new-feature
```

### 6. Pull Request
1. **Create PR**: Create a pull request from your branch
2. **Description**: Provide a clear description of changes
3. **Tests**: Ensure all tests pass
4. **Review**: Address review feedback
5. **Merge**: Merge after approval

## Coding Standards

### 1. TypeScript
- **Strict Mode**: Use strict TypeScript configuration
- **Types**: Define explicit types for all functions and variables
- **Interfaces**: Use interfaces for object shapes
- **Enums**: Use enums for constants

```typescript
// Good
interface User {
  id: string;
  email: string;
  name: string;
}

const getUser = async (id: string): Promise<User> => {
  // Implementation
};

// Bad
const getUser = async (id) => {
  // Implementation
};
```

### 2. React Components
- **Functional Components**: Use functional components with hooks
- **Props Interface**: Define props interface
- **Default Props**: Use default parameters
- **Error Boundaries**: Use error boundaries for error handling

```typescript
interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  disabled = false,
  variant = 'primary'
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}`}
    >
      {children}
    </button>
  );
};
```

### 3. API Development
- **RESTful**: Follow RESTful API design principles
- **Validation**: Use Zod for request validation
- **Error Handling**: Consistent error handling
- **Documentation**: Document all endpoints

```typescript
// Request validation
const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['proposal', 'recruiting']),
  description: z.string().optional()
});

// Error handling
try {
  const result = await createWorkspace(data);
  return { success: true, data: result };
} catch (error) {
  logger.error('Failed to create workspace', error);
  return { success: false, error: 'Internal server error' };
}
```

### 4. Database
- **Migrations**: Use database migrations for schema changes
- **Indexes**: Add appropriate indexes for performance
- **Constraints**: Use database constraints for data integrity
- **Queries**: Optimize database queries

```sql
-- Migration example
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_workspaces_type ON workspaces(type);
CREATE INDEX idx_workspaces_created_at ON workspaces(created_at);
```

## Testing Guidelines

### 1. Unit Tests
- **Coverage**: Aim for 80%+ code coverage
- **Isolation**: Test components in isolation
- **Mocking**: Mock external dependencies
- **Assertions**: Use descriptive assertions

```typescript
describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button onClick={jest.fn()}>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### 2. Integration Tests
- **API Tests**: Test API endpoints with database
- **Component Tests**: Test component interactions
- **Workflow Tests**: Test complete user workflows

```typescript
describe('Workspace API', () => {
  it('creates a new workspace', async () => {
    const workspaceData = {
      name: 'Test Workspace',
      type: 'proposal'
    };

    const response = await request(app)
      .post('/workspaces')
      .send(workspaceData)
      .expect(201);

    expect(response.body.data.name).toBe(workspaceData.name);
  });
});
```

### 3. End-to-End Tests
- **User Journeys**: Test complete user journeys
- **Critical Paths**: Test critical business paths
- **Cross-Browser**: Test across different browsers

```typescript
test('user can create and edit a proposal', async ({ page }) => {
  await page.goto('/proposal');
  await page.click('[data-testid="create-workspace"]');
  await page.fill('[data-testid="workspace-name"]', 'Test Proposal');
  await page.click('[data-testid="save-workspace"]');
  
  await expect(page.locator('[data-testid="workspace-name"]')).toHaveValue('Test Proposal');
});
```

## Documentation

### 1. Code Documentation
- **JSDoc**: Use JSDoc for function documentation
- **Comments**: Add comments for complex logic
- **README**: Keep README files updated
- **API Docs**: Document API endpoints

```typescript
/**
 * Creates a new workspace for the user
 * @param workspaceData - The workspace data
 * @returns Promise resolving to the created workspace
 * @throws {ValidationError} When workspace data is invalid
 * @throws {DatabaseError} When database operation fails
 */
const createWorkspace = async (workspaceData: CreateWorkspaceData): Promise<Workspace> => {
  // Implementation
};
```

### 2. Pull Request Documentation
- **Description**: Clear description of changes
- **Testing**: How to test the changes
- **Screenshots**: Screenshots for UI changes
- **Breaking Changes**: Document breaking changes

### 3. User Documentation
- **User Guide**: Update user guide for new features
- **API Documentation**: Update API documentation
- **Changelog**: Update changelog for releases

## Code Review Process

### 1. Review Checklist
- [ ] Code follows coding standards
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No security vulnerabilities
- [ ] Performance considerations
- [ ] Accessibility requirements

### 2. Review Guidelines
- **Constructive**: Provide constructive feedback
- **Specific**: Be specific about issues
- **Educational**: Help improve coding skills
- **Respectful**: Maintain respectful tone

### 3. Review Process
1. **Automated Checks**: CI/CD checks must pass
2. **Code Review**: At least one approval required
3. **Testing**: All tests must pass
4. **Documentation**: Documentation must be updated
5. **Merge**: Merge after approval

## Release Process

### 1. Versioning
- **Semantic Versioning**: Use semantic versioning (MAJOR.MINOR.PATCH)
- **Changelog**: Update changelog for each release
- **Tags**: Create git tags for releases

### 2. Release Steps
1. **Feature Complete**: All features for release are complete
2. **Testing**: Comprehensive testing completed
3. **Documentation**: Documentation updated
4. **Release Notes**: Release notes prepared
5. **Deployment**: Deploy to production

### 3. Hotfix Process
1. **Critical Issue**: Identify critical production issue
2. **Hotfix Branch**: Create hotfix branch from main
3. **Fix**: Implement minimal fix
4. **Testing**: Test fix thoroughly
5. **Deploy**: Deploy fix immediately

## Community Guidelines

### 1. Code of Conduct
- **Respectful**: Treat everyone with respect
- **Inclusive**: Welcome contributions from all backgrounds
- **Professional**: Maintain professional behavior
- **Constructive**: Provide constructive feedback

### 2. Communication
- **Issues**: Use GitHub issues for bug reports and feature requests
- **Discussions**: Use GitHub discussions for general questions
- **Pull Requests**: Use pull requests for code contributions
- **Discord**: Join our Discord for real-time discussions

### 3. Getting Help
- **Documentation**: Check documentation first
- **Issues**: Search existing issues
- **Community**: Ask in community channels
- **Mentors**: Reach out to project mentors

## Recognition

### 1. Contributors
- **Contributors List**: All contributors are recognized
- **Special Recognition**: Outstanding contributions are highlighted
- **Badges**: Contributors receive special badges
- **Swag**: Contributors may receive swag

### 2. Types of Contributions
- **Code**: Code contributions
- **Documentation**: Documentation improvements
- **Testing**: Test coverage improvements
- **Bug Reports**: Bug reports and fixes
- **Feature Requests**: Feature suggestions
- **Community**: Community support and engagement

## Contact Information

- **Maintainers**: maintainers@microtech.com
- **Community**: community@microtech.com
- **Discord**: [Join our Discord](https://discord.gg/microtech)
- **GitHub**: [GitHub Repository](https://github.com/microtech/microtech-platform)

Thank you for contributing to the MicroTech platform! Your contributions help make the platform better for everyone.
