import Fastify from 'fastify';
import { Kafka } from 'kafkajs';

const fastify = Fastify({ logger: true });
const kafka = new Kafka({
  clientId: 'agentic-api',
  brokers: ['localhost:9092']
});

const producer = kafka.producer();

// Handle chunk uploads
fastify.post('/api/chunks', async (request, reply) => {
  const { chunk, metadata } = request.body;

  try {
    await producer.connect();
    await producer.send({
      topic: 'data-chunks',
      messages: [{
        key: metadata.chunkId,
        value: JSON.stringify({
          chunk,
          metadata,
          timestamp: Date.now()
        })
      }]
    });

    return { status: 'success' };
  } catch (err) {
    request.log.error(err);
    throw new Error('Failed to process chunk');
  }
}); 