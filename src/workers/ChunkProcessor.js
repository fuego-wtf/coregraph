import Redis from 'ioredis';
import { createConnection } from 'memgraph';
import { QdrantClient } from '@qdrant/js-client';

class ChunkProcessor {
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
    });

    this.subscriber = this.redis.duplicate();

    this.memgraph = createConnection({
      host: 'localhost',
      port: 7687
    });

    this.qdrant = new QdrantClient({ 
      url: 'http://localhost:6333' 
    });
  }

  async processChunk(data) {
    const { chunk, metadata } = data;
    
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
    await this.subscriber.subscribe('data-chunks');
    
    this.subscriber.on('message', async (channel, message) => {
      if (channel === 'data-chunks') {
        const data = JSON.parse(message);
        await this.processChunk(data);
      }
    });
  }
}

export default ChunkProcessor;