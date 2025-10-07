# API Documentation

## Overview

This document provides comprehensive documentation for the MicroTech platform API, including endpoints, authentication, request/response formats, and examples.

## Base URL

```
Production: https://api.microtech.com
Staging: https://api-staging.microtech.com
Development: http://localhost:3000
```

## Authentication

### 1. JWT Token Authentication
All API requests require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### 2. Token Refresh
When a token expires, use the refresh token to get a new access token:

```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

### 3. Token Expiration
- **Access Token**: 15 minutes
- **Refresh Token**: 7 days
- **Auto-refresh**: Automatic token refresh when possible

## Common Response Formats

### 1. Success Response
```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "message": "Operation completed successfully",
  "timestamp": "2023-01-01T00:00:00Z"
}
```

### 2. Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "timestamp": "2023-01-01T00:00:00Z"
}
```

### 3. Pagination Response
```json
{
  "success": true,
  "data": {
    "items": [
      // Array of items
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

## Endpoints

### 1. Authentication Endpoints

#### POST /auth/login
Authenticate user and return JWT tokens.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user"
    }
  }
}
```

#### POST /auth/register
Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "company": "Example Corp"
}
```

#### POST /auth/logout
Logout user and invalidate tokens.

**Request:**
```json
{
  "refreshToken": "your-refresh-token"
}
```

### 2. User Management Endpoints

#### GET /users/profile
Get current user profile.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "John Doe",
    "company": "Example Corp",
    "role": "user",
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
}
```

#### PUT /users/profile
Update user profile.

**Request:**
```json
{
  "name": "John Smith",
  "company": "New Corp"
}
```

### 3. Workspace Endpoints

#### GET /workspaces
Get list of user workspaces.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `type`: Workspace type (proposal, recruiting)

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "workspace-123",
        "name": "Q4 Proposal",
        "type": "proposal",
        "status": "active",
        "createdAt": "2023-01-01T00:00:00Z",
        "updatedAt": "2023-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

#### POST /workspaces
Create a new workspace.

**Request:**
```json
{
  "name": "Q4 Proposal",
  "type": "proposal",
  "description": "Quarterly proposal workspace"
}
```

#### GET /workspaces/:id
Get workspace details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "workspace-123",
    "name": "Q4 Proposal",
    "type": "proposal",
    "status": "active",
    "description": "Quarterly proposal workspace",
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z",
    "documents": [
      {
        "id": "doc-123",
        "name": "Proposal Draft",
        "type": "draft",
        "status": "active"
      }
    ]
  }
}
```

### 4. Document Endpoints

#### POST /workspaces/:id/documents
Upload a document to a workspace.

**Request (multipart/form-data):**
```
file: <file>
name: "Proposal Document"
type: "proposal"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "doc-123",
    "name": "Proposal Document",
    "type": "proposal",
    "status": "processing",
    "uploadedAt": "2023-01-01T00:00:00Z"
  }
}
```

#### GET /workspaces/:id/documents
Get list of documents in a workspace.

#### GET /documents/:id
Get document details and content.

#### PUT /documents/:id
Update document metadata.

#### DELETE /documents/:id
Delete a document.

### 5. Checklist Endpoints

#### GET /workspaces/:id/checklist
Get checklist items for a workspace.

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "item-123",
        "title": "Executive Summary",
        "description": "Include executive summary",
        "status": "pending",
        "priority": "high",
        "createdAt": "2023-01-01T00:00:00Z"
      }
    ]
  }
}
```

#### POST /workspaces/:id/checklist
Add a new checklist item.

**Request:**
```json
{
  "title": "Technical Requirements",
  "description": "Include technical requirements section",
  "priority": "medium"
}
```

#### PUT /checklist/:id
Update checklist item status.

**Request:**
```json
{
  "status": "completed"
}
```

### 6. Chat Endpoints

#### POST /workspaces/:id/chat
Send a message to the AI chat.

**Request:**
```json
{
  "message": "Generate an executive summary for this proposal",
  "context": {
    "documentId": "doc-123",
    "section": "executive-summary"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "msg-123",
    "message": "Generate an executive summary for this proposal",
    "response": "Here's a generated executive summary...",
    "suggestions": [
      {
        "type": "edit",
        "content": "Generated executive summary",
        "section": "executive-summary"
      }
    ],
    "timestamp": "2023-01-01T00:00:00Z"
  }
}
```

#### GET /workspaces/:id/chat/history
Get chat history for a workspace.

### 7. Export Endpoints

#### POST /workspaces/:id/export
Export workspace content.

**Request:**
```json
{
  "format": "pdf",
  "include": ["draft", "checklist", "changes"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "export-123",
    "status": "processing",
    "format": "pdf",
    "downloadUrl": null,
    "createdAt": "2023-01-01T00:00:00Z"
  }
}
```

#### GET /exports/:id
Get export status and download URL.

### 8. Health Check Endpoint

#### GET /health
Check API health status.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2023-01-01T00:00:00Z",
    "version": "1.0.0",
    "services": {
      "database": "ok",
      "storage": "ok",
      "ai": "ok"
    }
  }
}
```

## Error Codes

### 1. Authentication Errors
- `UNAUTHORIZED`: Invalid or missing authentication token
- `TOKEN_EXPIRED`: Authentication token has expired
- `INVALID_CREDENTIALS`: Invalid email or password

### 2. Validation Errors
- `VALIDATION_ERROR`: Request validation failed
- `REQUIRED_FIELD`: Required field is missing
- `INVALID_FORMAT`: Field format is invalid

### 3. Authorization Errors
- `FORBIDDEN`: Insufficient permissions
- `ACCESS_DENIED`: Access denied to resource

### 4. Resource Errors
- `NOT_FOUND`: Resource not found
- `ALREADY_EXISTS`: Resource already exists
- `CONFLICT`: Resource conflict

### 5. Server Errors
- `INTERNAL_ERROR`: Internal server error
- `SERVICE_UNAVAILABLE`: Service temporarily unavailable
- `TIMEOUT`: Request timeout

## Rate Limiting

### 1. Rate Limits
- **Authentication**: 5 requests per minute
- **General API**: 100 requests per minute
- **File Upload**: 10 requests per minute
- **Chat**: 20 requests per minute

### 2. Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### 3. Rate Limit Exceeded
When rate limit is exceeded, the API returns a 429 status code:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again later.",
    "retryAfter": 60
  }
}
```

## Webhooks

### 1. Webhook Events
- `document.uploaded`: Document uploaded successfully
- `document.processed`: Document processing completed
- `workspace.updated`: Workspace updated
- `export.completed`: Export completed

### 2. Webhook Payload
```json
{
  "event": "document.processed",
  "data": {
    "documentId": "doc-123",
    "workspaceId": "workspace-123",
    "status": "completed"
  },
  "timestamp": "2023-01-01T00:00:00Z"
}
```

### 3. Webhook Security
Webhooks include a signature header for verification:

```
X-Webhook-Signature: sha256=<signature>
```

## SDKs and Libraries

### 1. JavaScript/TypeScript
```bash
npm install @microtech/api-client
```

```typescript
import { MicroTechClient } from '@microtech/api-client';

const client = new MicroTechClient({
  baseUrl: 'https://api.microtech.com',
  apiKey: 'your-api-key'
});

const workspaces = await client.workspaces.list();
```

### 2. Python
```bash
pip install microtech-api-client
```

```python
from microtech import MicroTechClient

client = MicroTechClient(
    base_url='https://api.microtech.com',
    api_key='your-api-key'
)

workspaces = client.workspaces.list()
```

### 3. cURL Examples
```bash
# Get workspaces
curl -H "Authorization: Bearer <token>" \
     https://api.microtech.com/workspaces

# Upload document
curl -H "Authorization: Bearer <token>" \
     -F "file=@document.pdf" \
     -F "name=Proposal Document" \
     https://api.microtech.com/workspaces/123/documents
```

## Testing

### 1. Test Environment
- **Base URL**: https://api-staging.microtech.com
- **Test Data**: Use test data for development
- **Rate Limits**: Higher rate limits for testing

### 2. Test Accounts
- **Admin**: admin@microtech.com
- **User**: user@microtech.com
- **Viewer**: viewer@microtech.com

### 3. Postman Collection
Import our Postman collection for easy API testing:
[Download Postman Collection](https://api.microtech.com/postman-collection.json)

## Support

### 1. API Support
- **Email**: api-support@microtech.com
- **Documentation**: https://docs.microtech.com
- **Status Page**: https://status.microtech.com

### 2. Developer Resources
- **GitHub**: https://github.com/microtech/api-examples
- **Community Forum**: https://community.microtech.com
- **Blog**: https://blog.microtech.com

### 3. SLA and Support
- **Response Time**: 4 hours for critical issues
- **Uptime SLA**: 99.9%
- **Support Hours**: Monday - Friday, 9 AM - 6 PM EST

### Proposal Draft & Archive Endpoints

#### POST /api/drafts
Create a new draft run. File names must be unique per project when the `FF_ARCHIVE_UNIQUE_NAMES` flag is enabled.

**Request:**
```json
{
  "projectId": "11111111-1111-1111-1111-111111111111",
  "fileName": "proposal-draft.md",
  "title": "Initial Draft",
  "status": "draft",
  "sections": [
    { "heading": "Executive Summary", "body": "Overview" }
  ],
  "deliverables": [
    { "title": "Plan of Actions" }
  ]
}
```

#### PATCH /api/drafts/:id
Update an existing draft. Changing `fileName` respects the uniqueness rules when the feature flag is active.

#### GET /api/drafts/:id
Retrieve a draft run by identifier.

#### GET /api/projects/:projectId/drafts
List drafts for a project. Supports `search`, `status`, `page`, and `limit` query parameters.

#### POST /api/archive
Persist the current draft into the archive and draft store. Returns `409` with a suggested file name when a duplicate is detected (under feature flag control).

#### GET /api/archive/:id
Retrieve an archived draft. Returns `404` if the entry is not found.
