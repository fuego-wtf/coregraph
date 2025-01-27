const Fastify = require('fastify');
const Redis = require('ioredis');
const crypto = require('crypto');

// Initialize Redis client
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});

const pubClient = redis.duplicate();
const subClient = redis.duplicate();

// In-memory stores
const agents = new Map();
const nodes = new Map(); // Map<agentId, Map<nodeId, node>>

async function build() {
  const fastify = Fastify({ logger: true });

  // Agent CRUD endpoints
  fastify.get('/agents', async (request, reply) => {
    return Array.from(agents.values());
  });

  fastify.post('/agents', async (request, reply) => {
    const agent = {
      id: crypto.randomUUID(),
      ...request.body,
      createdAt: new Date().toISOString()
    };
    agents.set(agent.id, agent);
    nodes.set(agent.id, new Map()); // Initialize nodes map for this agent
    return agent;
  });

  fastify.get('/agents/:agentId', async (request, reply) => {
    const agent = agents.get(request.params.agentId);
    if (!agent) {
      reply.code(404).send({ error: 'Agent not found' });
      return;
    }
    return agent;
  });

  fastify.delete('/agents/:agentId', async (request, reply) => {
    const exists = agents.delete(request.params.agentId);
    if (!exists) {
      reply.code(404).send({ error: 'Agent not found' });
      return;
    }
    nodes.delete(request.params.agentId); // Clean up associated nodes
    reply.code(204).send();
  });

  // Node management endpoints
  fastify.get('/agents/:agentId/nodes', async (request, reply) => {
    const { agentId } = request.params;
    if (!agents.has(agentId)) {
      reply.code(404).send({ error: 'Agent not found' });
      return;
    }
    const agentNodes = nodes.get(agentId) || new Map();
    return Array.from(agentNodes.values());
  });

  fastify.post('/agents/:agentId/nodes', async (request, reply) => {
    const { agentId } = request.params;
    if (!agents.has(agentId)) {
      reply.code(404).send({ error: 'Agent not found' });
      return;
    }

    const node = {
      id: crypto.randomUUID(),
      agentId,
      ...request.body,
      createdAt: new Date().toISOString()
    };

    const agentNodes = nodes.get(agentId) || new Map();
    agentNodes.set(node.id, node);
    nodes.set(agentId, agentNodes);

    return node;
  });

  fastify.get('/agents/:agentId/nodes/:nodeId', async (request, reply) => {
    const { agentId, nodeId } = request.params;
    if (!agents.has(agentId)) {
      reply.code(404).send({ error: 'Agent not found' });
      return;
    }

    const agentNodes = nodes.get(agentId);
    const node = agentNodes?.get(nodeId);
    if (!node) {
      reply.code(404).send({ error: 'Node not found' });
      return;
    }

    return node;
  });

  fastify.delete('/agents/:agentId/nodes/:nodeId', async (request, reply) => {
    const { agentId, nodeId } = request.params;
    if (!agents.has(agentId)) {
      reply.code(404).send({ error: 'Agent not found' });
      return;
    }

    const agentNodes = nodes.get(agentId);
    const exists = agentNodes?.delete(nodeId);
    if (!exists) {
      reply.code(404).send({ error: 'Node not found' });
      return;
    }

    reply.code(204).send();
  });

  // Handle chunk uploads
  fastify.post('/api/chunks', async (request, reply) => {
    const { chunk, metadata } = request.body;

    try {
      const message = JSON.stringify({
        chunk,
        metadata,
        timestamp: Date.now()
      });

      await pubClient.publish('data-chunks', message);
      return { status: 'success' };
    } catch (err) {
      request.log.error(err);
      throw new Error('Failed to process chunk');
    }
  });


  return fastify;
}

// Start server if this file is run directly
if (require.main === module) {
  const start = async () => {
    const server = await build();
    try {
      await server.listen({ port: 3000 });
    } catch (err) {
      server.log.error(err);
      process.exit(1);
    }
  };

  start();
}

module.exports = { build };