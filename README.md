# Graphyn

A modern graph-based data processing and analysis system with real-time capabilities.

## Features

- Microservices architecture
- Real-time data processing
- Graph-based data modeling with Memgraph
- WebSocket support
- Secure authentication
- Rate limiting
- File processing pipeline

## Prerequisites

- Docker (for running Memgraph)
- Node.js 18+
- Yarn

## Quick Start

```bash
# Start Memgraph
docker pull memgraph/memgraph-platform
docker run -it -p 7687:7687 -p 7444:7444 -p 3000:3000 -v mg_lib:/var/lib/memgraph memgraph/memgraph-platform

# Install dependencies
yarn install

# Start development server
yarn dev

# Run tests
yarn test

# Build for production
yarn build
```

## Architecture

The system consists of multiple microservices:
- API Gateway
- Auth Service
- File Processor
- Graph Service (Memgraph)
- Vector Service
- Worker Service
- Message Queue

## Documentation

- [API Reference](docs/api-reference.md)
- [Architecture](docs/architecture.md)
- [Deployment Guide](docs/deployment-handbook.md)
- [Development Guide](docs/development-guide.md)
- [Security Specifications](docs/security-specifications.md)

## Memgraph Management

Access the Memgraph Lab interface at http://localhost:3000 for:
- Graph visualization
- Query execution
- Database management
- Performance monitoring

Default Memgraph credentials:
- Username: (empty)
- Password: (empty)

## License

MIT 