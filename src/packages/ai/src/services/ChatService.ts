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
  provider: 'openai' | 'azure' | 'custom' | 'mock';
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

class LocalMockChatProvider implements ChatProvider {
  constructor(private readonly config: ChatConfig) {}

  async chat(messages: ChatMessage[]): Promise<string> {
    const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user');

    if (!lastUserMessage) {
      return "Hello! I'm your FedRAMP assistant. I can help you write your proposal, suggest content, and analyze your requirements. What would you like help with?";
    }

    const userMessage = lastUserMessage.content.toLowerCase();
    
    // Handle specific user requests
    if (userMessage.includes('add something about bird')) {
      return `Here's content about BIRD (Biometric Identity Recognition and Detection) systems that I can add to your draft:

BIRD System Implementation

Our proposal includes the implementation of advanced Biometric Identity Recognition and Detection (BIRD) systems to enhance security controls and meet FedRAMP requirements. This technology provides:

• **Multi-modal biometric authentication** - Combining fingerprint, facial recognition, and voice patterns for robust identity verification
• **Continuous authentication** - Real-time monitoring of user behavior patterns to detect anomalies
• **Anti-spoofing measures** - Advanced liveness detection to prevent biometric spoofing attacks
• **Privacy protection** - Biometric data encryption and secure storage in compliance with federal privacy requirements
• **Integration capabilities** - Seamless integration with existing NASA authentication infrastructure

The BIRD system will be deployed across all access points and integrated with our existing multi-factor authentication framework to provide enhanced security for NASA's sensitive cloud environments.

Would you like me to add this content to your draft?`;
    }
    
    if (userMessage.includes('add') || userMessage.includes('include') || userMessage.includes('write about')) {
      // Generate relevant content based on the request
      const topic = userMessage.replace(/\b(add|include|write about|something about)\b/gi, '').trim();
      
      return `I can help you add content about "${topic}" to your proposal. Here's what I suggest adding:

**${topic.charAt(0).toUpperCase() + topic.slice(1)} Implementation**

Our approach to ${topic} includes:

• **Comprehensive planning** - Detailed analysis and implementation strategy
• **Risk mitigation** - Identification and mitigation of potential risks
• **Compliance alignment** - Ensuring adherence to FedRAMP requirements
• **Monitoring and validation** - Continuous oversight and performance measurement
• **Documentation and reporting** - Complete documentation for audit purposes

This section will be integrated into our overall security framework and will support NASA's mission requirements while maintaining full compliance with federal security standards.

Would you like me to add this content to your draft?`;
    }

    // General FedRAMP assistance
    if (userMessage.includes('help') || userMessage.includes('assist')) {
      return `I'm here to help with your FedRAMP proposal! I can assist you with:

• **Security Controls** - Implementation strategies for all 18 FedRAMP control families
• **Documentation** - Drafting compliant responses and technical documentation
• **Risk Management** - Identifying and mitigating security risks
• **Compliance** - Ensuring adherence to federal requirements
• **Content Enhancement** - Improving existing sections or adding new content

What specific area would you like to work on?`;
    }

    // Default helpful response
    return `I understand you're asking about "${lastUserMessage.content}". 

For your FedRAMP proposal, I can help you:

• Develop comprehensive responses to specific requirements
• Add technical details and implementation strategies
• Ensure compliance with federal security standards
• Enhance existing content with more detailed explanations

Could you be more specific about what you'd like me to help you with? For example, you could ask me to "add content about network security" or "help with the incident response section."`;
  }

  async generateEditProposal(context: string, instruction: string): Promise<AIEditProposal> {
    return {
      summary: `Mock edit for instruction: ${instruction}`,
      operations: [
        {
          type: 'insert',
          anchor: 'end',
          content: `Applied instruction "${instruction}" to context snippet: ${context.slice(0, 200)}`,
          metadata: {
            provider: 'mock',
            model: this.config.model,
          },
        },
      ],
    };
  }
}

export class ChatService {
  private provider: ChatProvider;

  constructor(config: ChatConfig) {
    if ((config.provider === 'openai' || config.provider === 'azure' || config.provider === 'custom') && !config.apiKey) {
      this.provider = new LocalMockChatProvider({ ...config, provider: 'mock' });
      return;
    }

    switch (config.provider) {
      case 'openai':
      case 'azure':
      case 'custom':
        this.provider = new OpenAIChatProvider(config);
        break;
      case 'mock':
        this.provider = new LocalMockChatProvider(config);
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
