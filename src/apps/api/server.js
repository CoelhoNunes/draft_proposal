const fastify = require('fastify')({ logger: true });

fastify.register(require('@fastify/cors'), {
  origin: true
});

fastify.get('/api/health', async (request, reply) => {
  return { 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'MicroTech Platform API is running!'
  };
});

fastify.get('/api/workspaces', async (request, reply) => {
  return { 
    workspaces: [
      { id: '1', name: 'Sample Proposal', type: 'proposal' },
      { id: '2', name: 'Sample Recruiting', type: 'recruiting' }
    ]
  };
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
