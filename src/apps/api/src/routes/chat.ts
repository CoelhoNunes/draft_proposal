/**
 * @fileoverview Chat routes for AI assistance
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { ChatService, ChatConfig } from '@microtech/ai';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const chatRequestSchema = z.object({
  message: z.string().min(1).max(4000),
  context: z.object({
    workspaceId: z.string().uuid(),
    tab: z.enum(['proposals', 'recruiting']),
    anchors: z.array(z.string()).optional(),
  }).optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
});

const editRequestSchema = z.object({
  context: z.string().min(1),
  instruction: z.string().min(1).max(1000),
  workspaceId: z.string().uuid(),
});

export async function chatRoutes(fastify: FastifyInstance) {
  // Initialize chat service
  const chatConfig: ChatConfig = {
    provider: config.ai.provider as any,
    apiKey: config.ai.apiKey,
    baseUrl: config.ai.baseUrl,
    model: config.ai.model,
    temperature: config.ai.temperature,
    maxTokens: config.ai.maxTokens,
  };

  const chatService = new ChatService(chatConfig);

  // Send chat message
  fastify.post('/send', {
    schema: {
      description: 'Send a message to the AI assistant',
      tags: ['chat'],
      body: {
        type: 'object',
        required: ['message'],
        properties: {
          message: { type: 'string', minLength: 1, maxLength: 4000 },
          context: {
            type: 'object',
            properties: {
              workspaceId: { type: 'string', format: 'uuid' },
              tab: { type: 'string', enum: ['proposals', 'recruiting'] },
              anchors: { type: 'array', items: { type: 'string' } },
            },
          },
          model: { type: 'string' },
          temperature: { type: 'number', minimum: 0, maximum: 2 },
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
                id: { type: 'string' },
                role: { type: 'string' },
                content: { type: 'string' },
                timestamp: { type: 'string', format: 'date-time' },
                context: { type: 'object' },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { message, context, model, temperature } = chatRequestSchema.parse(request.body);

      logger.info({
        userId: request.user?.id,
        workspaceId: context?.workspaceId,
        tab: context?.tab,
      }, 'Chat message received');

      // Create chat message
      const chatMessage = context?.tab === 'recruiting'
        ? chatService.createRecruitingMessage(message, context.workspaceId)
        : chatService.createProposalMessage(message, context.workspaceId);

      // Send message to AI
      const response = await chatService.sendMessage([chatMessage]);

      const responseMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        context,
      };

      return {
        success: true,
        data: responseMessage,
      };
    } catch (error) {
      logger.error({ error: error.message }, 'Chat message failed');
      throw error;
    }
  });

  // Propose edit to document
  fastify.post('/edit', {
    schema: {
      description: 'Propose an edit to a document',
      tags: ['chat'],
      body: {
        type: 'object',
        required: ['context', 'instruction', 'workspaceId'],
        properties: {
          context: { type: 'string', minLength: 1 },
          instruction: { type: 'string', minLength: 1, maxLength: 1000 },
          workspaceId: { type: 'string', format: 'uuid' },
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
                summary: { type: 'string' },
                selectionAnchor: { type: 'string' },
                operations: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: { type: 'string', enum: ['insert', 'replace', 'delete'] },
                      anchor: { type: 'string' },
                      content: { type: 'string' },
                      metadata: { type: 'object' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { context, instruction, workspaceId } = editRequestSchema.parse(request.body);

      logger.info({
        userId: request.user?.id,
        workspaceId,
      }, 'Edit proposal requested');

      // Generate edit proposal
      const editProposal = await chatService.proposeEdit(context, instruction);

      return {
        success: true,
        data: editProposal,
      };
    } catch (error) {
      logger.error({ error: error.message }, 'Edit proposal failed');
      throw error;
    }
  });

  // Get chat history for a workspace
  fastify.get('/history/:workspaceId', {
    schema: {
      description: 'Get chat history for a workspace',
      tags: ['chat'],
      params: {
        type: 'object',
        required: ['workspaceId'],
        properties: {
          workspaceId: { type: 'string', format: 'uuid' },
        },
      },
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'number', minimum: 1, maximum: 100, default: 50 },
          offset: { type: 'number', minimum: 0, default: 0 },
        },
      },
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
                  id: { type: 'string' },
                  role: { type: 'string' },
                  content: { type: 'string' },
                  timestamp: { type: 'string', format: 'date-time' },
                  context: { type: 'object' },
                },
              },
            },
            pagination: {
              type: 'object',
              properties: {
                limit: { type: 'number' },
                offset: { type: 'number' },
                total: { type: 'number' },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { workspaceId } = request.params as { workspaceId: string };
      const { limit = 50, offset = 0 } = request.query as { limit?: number; offset?: number };

      logger.info({
        userId: request.user?.id,
        workspaceId,
        limit,
        offset,
      }, 'Chat history requested');

      // TODO: Implement actual chat history retrieval from database
      const mockHistory = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Help me with this proposal section',
          timestamp: new Date(Date.now() - 3600000),
          context: { workspaceId, tab: 'proposals' },
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'I can help you improve that section. What specific aspects would you like me to focus on?',
          timestamp: new Date(Date.now() - 3500000),
          context: { workspaceId, tab: 'proposals' },
        },
      ];

      return {
        success: true,
        data: mockHistory,
        pagination: {
          limit,
          offset,
          total: mockHistory.length,
        },
      };
    } catch (error) {
      logger.error({ error: error.message }, 'Chat history retrieval failed');
      throw error;
    }
  });
}
