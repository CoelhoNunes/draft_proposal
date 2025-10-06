/**
 * @fileoverview AI Chat Service - Provider-agnostic chat interface
 */

import OpenAI from 'openai';
import { ChatMessage, AIEditProposal } from '@microtech/core';

export interface ChatProvider {
  chat(messages: ChatMessage[]): Promise<string>;
  generateEditProposal(context: string, instruction: string): Promise<AIEditProposal>;
}

export interface ChatConfig {
  provider: 'openai' | 'azure' | 'custom';
  apiKey?: string;
  baseUrl?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export class OpenAIChatProvider implements ChatProvider {
  private client: OpenAI;
  private config: ChatConfig;

  constructor(config: ChatConfig) {
    this.config = config;
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    });
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    try {
      const openaiMessages = messages.map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      }));

      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: openaiMessages,
        temperature: this.config.temperature || 0.3,
        max_tokens: this.config.maxTokens || 1200,
      });

      return response.choices[0]?.message?.content || 'No response generated';
    } catch (error) {
      console.error('OpenAI chat error:', error);
      throw new Error(`Chat failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateEditProposal(context: string, instruction: string): Promise<AIEditProposal> {
    try {
      const systemPrompt = `
You are an expert document editor. Given a document context and an instruction, 
generate a structured edit proposal with specific operations.

Return your response as JSON with this structure:
{
  "summary": "Brief description of the proposed changes",
  "selectionAnchor": "optional anchor ID if targeting specific text",
  "operations": [
    {
      "type": "insert|replace|delete",
      "anchor": "anchor ID or text position",
      "content": "new content (for insert/replace)",
      "metadata": {}
    }
  ]
}

Be precise and actionable in your proposals.
`;

      const userPrompt = `
Document Context:
${context}

Instruction:
${instruction}

Generate an edit proposal:
`;

      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1, // Low temperature for consistent structured output
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content || '{}';
      
      try {
        return JSON.parse(content) as AIEditProposal;
      } catch {
        // Fallback if JSON parsing fails
        return {
          summary: 'Edit proposal generated',
          operations: [
            {
              type: 'insert',
              anchor: 'end',
              content: content,
            },
          ],
        };
      }
    } catch (error) {
      console.error('Edit proposal generation error:', error);
      throw new Error(`Edit proposal failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export class ChatService {
  private provider: ChatProvider;

  constructor(config: ChatConfig) {
    switch (config.provider) {
      case 'openai':
      case 'azure':
      case 'custom':
        this.provider = new OpenAIChatProvider(config);
        break;
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }

  async sendMessage(messages: ChatMessage[]): Promise<string> {
    return this.provider.chat(messages);
  }

  async proposeEdit(context: string, instruction: string): Promise<AIEditProposal> {
    return this.provider.generateEditProposal(context, instruction);
  }

  /**
   * Create a context-aware chat message for proposals
   */
  createProposalMessage(content: string, workspaceId: string): ChatMessage {
    return {
      id: `msg_${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
      context: {
        workspaceId,
        tab: 'proposals',
      },
    };
  }

  /**
   * Create a context-aware chat message for recruiting
   */
  createRecruitingMessage(content: string, workspaceId: string): ChatMessage {
    return {
      id: `msg_${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
      context: {
        workspaceId,
        tab: 'recruiting',
      },
    };
  }

  /**
   * Create a system message with context
   */
  createSystemMessage(content: string): ChatMessage {
    return {
      id: `sys_${Date.now()}`,
      role: 'system',
      content,
      timestamp: new Date(),
    };
  }
}
