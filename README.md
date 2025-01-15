# Graphyn

A modern AI agent system with real-time event processing and context-aware prompting capabilities.

## Features

- Event-driven microservices architecture
- Real-time event streaming with Redis
- Vector similarity search and relationship storage with Qdrant
- High-performance REST API with Fastify
- WebSocket support for real-time updates
- Secure authentication and rate limiting
- Context-aware AI prompting system
- Near real-time updates (<5s latency)

## Prerequisites

- Docker (for running services)
- Node.js 18+
- Yarn
- Redis (for event streaming)
- Qdrant (for vector search and relationship storage)
- OpenAI API key

## Quick Start

```bash
# Start Redis
docker run -d -p 6379:6379 --name redis redis:latest

# Start Qdrant
docker run -d -p 6333:6333 -v $(pwd)/qdrant_storage:/qdrant/storage qdrant/qdrant

# Install dependencies
yarn install

# Configure environment
cp .env.example .env
# Edit .env with your OpenAI API key and other settings

# Start development server
yarn dev

# Run tests
yarn test

# Build for production
yarn build
```

## Architecture

The system consists of multiple microservices:

### Core Services
- **API Gateway (Fastify)**: Main entry point for client requests
- **Event Stream (Redis)**: Handles real-time event processing and caching
- **Vector/Relationship Service (Qdrant)**: 
  - Manages vector embeddings for similarity search
  - Stores relationships in payload data
  - Provides quick context retrieval for AI prompts
- **Auth Service**: Handles authentication and authorization
- **Worker Service**: Processes background tasks

### Event Flow
1. Client sends events to Redis stream
2. Events are processed and stored in Qdrant with:
   - Vector embeddings for similarity search
   - Relationship data in the payload
3. Context is retrieved from Qdrant for AI prompts
4. Enriched prompts are sent to OpenAI
5. Results are returned to client

## API Endpoints

- `POST /events`: Submit new events
- `POST /prompt`: Get AI response with context
- `GET /search`: Search similar contexts
- `POST /vectors/search`: Search vector embeddings

## Service Management

### Redis
- Port: 6379
- Used for: Event streaming, caching
- Monitor: `redis-cli monitor`

### Qdrant
- REST API: http://localhost:6333
- Used for: 
  - Vector similarity search
  - Relationship storage in payloads
  - Context retrieval
- Metrics: http://localhost:6333/metrics

## Documentation

- [API Reference](docs/api-reference.md)
- [Architecture](docs/architecture.md)
- [Deployment Guide](docs/deployment-handbook.md)
- [Development Guide](docs/development-guide.md)
- [Security Specifications](docs/security-specifications.md)

## License

MIT 