/**
 * @fileoverview Workspace management routes
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { Workspace, CreateWorkspaceSchema, UpdateWorkspaceSchema } from '@microtech/core';
import { logger } from '../utils/logger.js';

const workspaceParamsSchema = z.object({
  id: z.string().uuid(),
});

export async function workspaceRoutes(fastify: FastifyInstance) {
  // Get all workspaces for user
  fastify.get('/', {
    schema: {
      description: 'Get all workspaces for the authenticated user',
      tags: ['workspaces'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  kind: { type: 'string', enum: ['proposal', 'recruiting'] },
                  title: { type: 'string' },
                  ownerId: { type: 'string', format: 'uuid' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user?.id;
      if (!userId) {
        return reply.status(401).send({ success: false, error: 'Unauthorized' });
      }

      logger.info({ userId }, 'Workspaces list requested');

      // TODO: Implement actual workspace retrieval from database
      const mockWorkspaces: Workspace[] = [
        {
          id: 'workspace-1',
          kind: 'proposal',
          title: 'FedRAMP Security Assessment',
          ownerId: userId,
          createdAt: new Date('2024-01-15T10:00:00Z'),
          updatedAt: new Date('2024-01-15T10:00:00Z'),
        },
        {
          id: 'workspace-2',
          kind: 'recruiting',
          title: 'Senior Developer Position',
          ownerId: userId,
          createdAt: new Date('2024-01-14T09:00:00Z'),
          updatedAt: new Date('2024-01-14T09:00:00Z'),
        },
      ];

      return {
        success: true,
        data: mockWorkspaces,
      };
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to get workspaces');
      throw error;
    }
  });

  // Create new workspace
  fastify.post('/', {
    schema: {
      description: 'Create a new workspace',
      tags: ['workspaces'],
      body: {
        type: 'object',
        required: ['kind', 'title'],
        properties: {
          kind: { type: 'string', enum: ['proposal', 'recruiting'] },
          title: { type: 'string', minLength: 1, maxLength: 255 },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                kind: { type: 'string', enum: ['proposal', 'recruiting'] },
                title: { type: 'string' },
                ownerId: { type: 'string', format: 'uuid' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user?.id;
      if (!userId) {
        return reply.status(401).send({ success: false, error: 'Unauthorized' });
      }

      const { kind, title } = CreateWorkspaceSchema.parse(request.body);

      logger.info({ userId, kind, title }, 'Creating new workspace');

      // TODO: Implement actual workspace creation in database
      const newWorkspace: Workspace = {
        id: `workspace-${Date.now()}`,
        kind,
        title,
        ownerId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return reply.status(201).send({
        success: true,
        data: newWorkspace,
      });
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to create workspace');
      throw error;
    }
  });

  // Get specific workspace
  fastify.get('/:id', {
    schema: {
      description: 'Get a specific workspace by ID',
      tags: ['workspaces'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                kind: { type: 'string', enum: ['proposal', 'recruiting'] },
                title: { type: 'string' },
                ownerId: { type: 'string', format: 'uuid' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = workspaceParamsSchema.parse(request.params);
      const userId = request.user?.id;

      if (!userId) {
        return reply.status(401).send({ success: false, error: 'Unauthorized' });
      }

      logger.info({ userId, workspaceId: id }, 'Workspace details requested');

      // TODO: Implement actual workspace retrieval from database
      const mockWorkspace: Workspace = {
        id,
        kind: 'proposal',
        title: 'FedRAMP Security Assessment',
        ownerId: userId,
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-15T10:00:00Z'),
      };

      return {
        success: true,
        data: mockWorkspace,
      };
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to get workspace');
      throw error;
    }
  });

  // Update workspace
  fastify.patch('/:id', {
    schema: {
      description: 'Update a workspace',
      tags: ['workspaces'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      body: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 255 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                kind: { type: 'string', enum: ['proposal', 'recruiting'] },
                title: { type: 'string' },
                ownerId: { type: 'string', format: 'uuid' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = workspaceParamsSchema.parse(request.params);
      const userId = request.user?.id;

      if (!userId) {
        return reply.status(401).send({ success: false, error: 'Unauthorized' });
      }

      const updateData = UpdateWorkspaceSchema.parse(request.body);

      logger.info({ userId, workspaceId: id, updateData }, 'Updating workspace');

      // TODO: Implement actual workspace update in database
      const updatedWorkspace: Workspace = {
        id,
        kind: 'proposal',
        title: updateData.title || 'FedRAMP Security Assessment',
        ownerId: userId,
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date(),
      };

      return {
        success: true,
        data: updatedWorkspace,
      };
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to update workspace');
      throw error;
    }
  });

  // Delete workspace
  fastify.delete('/:id', {
    schema: {
      description: 'Delete a workspace',
      tags: ['workspaces'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = workspaceParamsSchema.parse(request.params);
      const userId = request.user?.id;

      if (!userId) {
        return reply.status(401).send({ success: false, error: 'Unauthorized' });
      }

      logger.info({ userId, workspaceId: id }, 'Deleting workspace');

      // TODO: Implement actual workspace deletion in database

      return {
        success: true,
        message: 'Workspace deleted successfully',
      };
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to delete workspace');
      throw error;
    }
  });
}
