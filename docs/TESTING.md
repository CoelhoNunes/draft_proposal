# Testing Guide

## Overview

This document outlines the testing strategy for the MicroTech platform, including unit tests, integration tests, and end-to-end tests.

## Test Structure

```
apps/
├── web/
│   ├── src/
│   │   ├── components/
│   │   │   └── __tests__/
│   │   ├── pages/
│   │   │   └── __tests__/
│   │   └── test/
│   │       └── setup.ts
│   └── vitest.config.ts
└── api/
    ├── src/
    │   ├── routes/
    │   │   └── __tests__/
    │   ├── services/
    │   │   └── __tests__/
    │   └── test/
    │       └── setup.ts
    └── vitest.config.ts
```

## Running Tests

### Frontend Tests
```bash
cd apps/web
pnpm test
```

### Backend Tests
```bash
cd apps/api
pnpm test
```

### All Tests
```bash
pnpm test
```

## Test Types

### 1. Unit Tests
- Test individual components and functions in isolation
- Mock external dependencies
- Focus on business logic and edge cases

### 2. Integration Tests
- Test interactions between components
- Test API endpoints with database
- Use test database for data persistence

### 3. End-to-End Tests
- Test complete user workflows
- Use Playwright for browser automation
- Test critical paths like document upload and processing

## Test Coverage

- Aim for 80%+ code coverage
- Focus on critical business logic
- Include error handling and edge cases
- Test accessibility features

## Mocking Strategy

- Mock external services (AI, storage)
- Use MSW for API mocking in frontend
- Mock database for integration tests
- Use test fixtures for consistent data

## Continuous Integration

Tests run automatically on:
- Pull requests
- Pushes to main branch
- Scheduled nightly runs

## Best Practices

1. **Test Naming**: Use descriptive test names that explain the scenario
2. **Arrange-Act-Assert**: Structure tests with clear sections
3. **Single Responsibility**: Each test should verify one behavior
4. **Independence**: Tests should not depend on each other
5. **Cleanup**: Always clean up resources after tests
