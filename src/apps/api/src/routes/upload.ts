/**
 * @fileoverview File upload routes
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../utils/logger.js';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { ChatService } from '@microtech/ai';
import { config } from '../config/index.js';

export async function uploadRoutes(fastify: FastifyInstance) {
  // Analyze a PDF using the LLM (simple text passthrough for now)
  fastify.post('/pdf', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Read the first uploaded file (if any)
      let uploadedFileName = 'document.pdf';
      const file = await (request as any).file?.();
      if (file && file.filename) {
        uploadedFileName = file.filename;
        // We don't need to buffer; just drain the stream
        await file.toBuffer();
      }

      const chatConfig = {
        provider: config.ai.provider as any,
        apiKey: config.ai.apiKey,
        baseUrl: config.ai.baseUrl,
        model: config.ai.model,
        temperature: config.ai.temperature,
        maxTokens: config.ai.maxTokens,
      };
      if (!chatConfig.apiKey) {
        reply.status(503);
        return { success: false, error: 'AI chat service is not configured' };
      }
      const chatService = new ChatService(chatConfig);

      const prompt = `You are a FedRAMP proposal assistant. The user uploaded a proposal PDF named "${uploadedFileName}".
Provide:
Purpose: one concise paragraph explaining what the proposal is for and why.
Checklist: a numbered list of concrete requirements (one per line, no extra text).
Deliverables: a numbered list of artifacts to produce (one per line).
Output only plain text. Do not use Markdown. Do not include asterisks or symbols. Use the exact section headers 'Purpose:', 'Checklist:', and 'Deliverables:' each on their own line.`;

      const response = await chatService.sendMessage([
        { id: `msg_${Date.now()}`, role: 'user', content: prompt, timestamp: new Date() }
      ]);

      return reply.send({ success: true, data: { content: response, fileName: uploadedFileName } });
    } catch (error: any) {
      logger.error({ error: error?.message }, 'PDF analysis failed');
      return reply.status(500).send({ success: false, error: 'PDF analysis failed' });
    }
  });
}
