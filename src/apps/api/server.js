import Fastify from 'fastify';
import OpenAI from 'openai';
import cors from '@fastify/cors';
import { config as loadEnv } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

loadEnv({ path: resolve(__dirname, '../../../.env') });

const fastify = Fastify({ logger: true });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

fastify.register(cors, {
  origin: true
});

fastify.get('/api/health', async () => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'MicroTech Platform API is running!'
  };
});

fastify.get('/api/workspaces', async () => {
  return {
    workspaces: [
      { id: '1', name: 'Sample Proposal', type: 'proposal' },
      { id: '2', name: 'Sample Recruiting', type: 'recruiting' }
    ]
  };
});

fastify.post('/api/chat/send', async (request, reply) => {
  try {
    const { message } = request.body || {};

    if (!message) {
      return reply.status(400).send({ success: false, error: 'No message provided' });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert FedRAMP proposal assistant. Help users with security controls, compliance documentation, and proposal writing. Be concise and professional.'
        },
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const response = completion.choices[0].message.content;

    let suggestions = [];
    if (message.toLowerCase().includes('add') || message.toLowerCase().includes('draft')) {
      suggestions = [
        {
          id: Date.now(),
          type: 'draft_addition',
          title: 'Add to Draft',
          content: response,
          position: -1
        }
      ];
    }

    return reply.send({
      success: true,
      data: {
        content: response,
        suggestions
      }
    });
  } catch (error) {
    console.error('Chat error:', error);
    return reply.status(500).send({ success: false, error: 'Chat failed: ' + error.message });
  }
});

fastify.post('/api/upload/pdf', async (request, reply) => {
  try {
    const body = request.body || {};
    const fileName = body.fileName || 'document.pdf';

    const analysisPrompt = `Analyze this RFP document: "${fileName}".

Generate a comprehensive proposal response with these sections:

1. PURPOSE: One detailed paragraph explaining the proposal approach and value proposition.

2. CHECKLIST: Provide 8-12 concrete action items (NOT the standard 10). Each item should be:
- Specific to this RFP
- Actionable and measurable
- Relevant to the requirements

3. DELIVERABLES: List specific artifacts and documents to produce.

Format your response EXACTLY as:
PURPOSE:
[paragraph]

CHECKLIST:
- [item 1]
- [item 2]
...

DELIVERABLES:
- [deliverable 1]
- [deliverable 2]
...`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a FedRAMP proposal expert. Generate detailed, specific responses for RFP analysis.'
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
      temperature: 0.8,
      max_tokens: 2000
    });

    const aiResponse = completion.choices[0].message.content;

    const purposeMatch = aiResponse.match(/PURPOSE:\s*\n(.+?)(?=\n\nCHECKLIST:|$)/s);
    const checklistMatch = aiResponse.match(/CHECKLIST:\s*\n((?:- .+\n?)+)/s);

    const purposeText = purposeMatch ? purposeMatch[1].trim() : aiResponse;
    const checklistText = checklistMatch ? checklistMatch[1] : '';

    const checklistLines = checklistText.split('\n').filter((line) => line.trim().startsWith('-'));
    const checklistItems = checklistLines.map((line, index) => {
      const text = line.replace(/^-\s*/, '').trim();
      const titleMatch = text.match(/^(.+?)[:.-]\s*(.+)$/);

      return {
        id: index + 1,
        title: titleMatch ? titleMatch[1].trim() : text.substring(0, 50),
        summary: titleMatch ? titleMatch[2].trim() : text,
        status: 'pending'
      };
    });

    return reply.send({
      success: true,
      data: {
        content: purposeText,
        fileName,
        checklistItems:
          checklistItems.length > 0
            ? checklistItems
            : [
                {
                  id: 1,
                  title: 'Review Requirements',
                  summary: 'Analyze and document all RFP requirements',
                  status: 'pending'
                }
              ]
      }
    });
  } catch (error) {
    console.error('PDF upload error:', error);
    return reply.status(500).send({ success: false, error: 'PDF processing failed: ' + error.message });
  }
});

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('🚀 MicroTech API Server running at http://localhost:3000');
    console.log('📚 Health check: http://localhost:3000/api/health');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
