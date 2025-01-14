import { Kafka } from 'kafkajs';
import { createConnection } from 'memgraph';
import { QdrantClient } from '@qdrant/js-client';

class ChunkProcessor {
  constructor() {
    this.kafka = new Kafka({
      clientId: 'chunk-processor',
      brokers: ['localhost:9092']
    });

    this.memgraph = createConnection({
      host: 'localhost',
      port: 7687
    });

    this.qdrant = new QdrantClient({ 
      url: 'http://localhost:6333' 
    });
  }

  async processChunk(chunk, metadata) {
    // Store graph structure in Memgraph
    const cypher = `
      MERGE (c:Chunk {id: $chunkId})
      SET c.metadata = $metadata
      RETURN c
    `;

    await this.memgraph.execute(cypher, {
      chunkId: metadata.chunkId,
      metadata
    });

    // Store vectors in Qdrant if needed
    if (metadata.embeddings) {
      await this.qdrant.upsert('chunks', {
        wait: true,
        points: [{
          id: metadata.chunkId,
          vector: metadata.embeddings,
          payload: metadata
        }]
      });
    }
  }

  async start() {
    const consumer = this.kafka.consumer({ groupId: 'chunk-processors' });
    await consumer.connect();
    await consumer.subscribe({ topic: 'data-chunks' });

    await consumer.run({
      eachMessage: async ({ message }) => {
        const { chunk, metadata } = JSON.parse(message.value.toString());
        await this.processChunk(chunk, metadata);
      }
    });
  }
} 