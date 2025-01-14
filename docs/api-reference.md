# API Reference Documentation

## Overview

This document provides comprehensive documentation for the API endpoints and flows across all microservices.

## System Architecture

```mermaid
graph TB
Client[Client Application]
Gateway[API Gateway]
Auth[Auth Service] 
Files[File Processor]
Graph[Graph Service]
Vector[Vector Service]
Queue[Message Queue]
Worker[Worker Service]

Client --> Gateway
Gateway --> Auth
Gateway --> Files
Gateway --> Graph
Gateway --> Vector
Files --> Queue
Queue --> Worker
Worker --> Graph
Worker --> Vector
```

## Authentication Flow

```mermaid
sequenceDiagram
participant C as Client
participant G as API Gateway
participant A as Auth Service
participant D as Database

C->>G: POST /auth/login
G->>A: Forward credentials
A->>D: Validate credentials
D-->>A: User data
A->>A: Generate JWT
A-->>G: Return JWT token
G-->>C: Auth response
```

## File Upload Flow

```mermaid
sequenceDiagram
participant C as Client
participant F as File Service
participant Q as Queue
participant W as Worker
participant G as Graph Service

C->>F: Upload file chunk
F->>F: Validate chunk
F->>Q: Enqueue chunk
F-->>C: Chunk accepted
Q->>W: Process chunk
W->>G: Update graph
W-->>Q: Processing complete
```

## API Endpoints

### Authentication API

#### POST /auth/login
Authenticates a user and returns a JWT token.

**Request:**
```json
{
"email": "string",
"password": "string"
}
```

**Response:**
```json
{
"token": "string",
"refreshToken": "string",
"expiresIn": "number"
}
```

### File Processing API 

#### POST /files/upload
Initiates a new file upload session.

**Request:**
```json
{
"filename": "string",
"size": "number",
"type": "string"
}
```

**Response:**
```json
{
"uploadId": "string",
"chunkSize": "number",
"presignedUrls": ["string"]
}
```

### Graph API

#### GET /graph/nodes/{id}
Retrieves a graph node and its relationships.

**Response:**
```json
{
"id": "string",
"type": "string", 
"properties": {},
"relationships": []
}
```

## Error Handling

```mermaid
flowchart TD
A[API Request] --> B{Validate Request}
B -->|Invalid| C[Return 400]
B -->|Valid| D{Process Request}
D -->|Error| E[Return 500] 
D -->|Success| F[Return 200]

C --> G[Error Response]
E --> G
F --> H[Success Response]
```

All API errors follow a standard format:

```json
{
"error": {
    "code": "string",
    "message": "string",
    "details": {}
}
}
```

## Rate Limiting

API requests are rate limited based on:
- 1000 requests per hour per IP address
- 10000 requests per hour per authenticated user

Rate limit headers included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1618884730
```

## Versioning

The API uses path versioning:
- Current version: v1
- Example: `/api/v1/users`

Version changelog:
- v1: Initial release
- v1.1: Added pagination support
- v1.2: Enhanced error responses

## Pagination

All list endpoints support pagination using:
- `page`: Page number (default: 1)
- `per_page`: Items per page (default: 20, max: 100)

Response includes pagination metadata:
```json
{
"data": [],
"pagination": {
    "total": "number",
    "pages": "number",
    "current": "number",
    "per_page": "number"
}
}
```

## WebSocket APIs

Real-time updates use WebSocket connections:

```mermaid
sequenceDiagram
participant C as Client
participant WS as WebSocket Server
participant PS as Pub/Sub

C->>WS: Connect
WS->>WS: Authenticate
WS->>PS: Subscribe to channels
PS-->>WS: Event
WS-->>C: Update
```

WebSocket endpoints:
- `ws://api.example.com/v1/ws`

Event types:
- `graph.updated`
- `file.processed`
- `vector.indexed`

## API Security

Security measures implemented:

```mermaid
flowchart TD
A[Request] --> B{Auth}
B -->|Valid| C{Rate Limit}
C -->|OK| D{Permission}
D -->|Allowed| E[Process]

B -->|Invalid| X[401]
C -->|Exceeded| Y[429]
D -->|Denied| Z[403]
```

Security features:
- JWT authentication
- Request signing
- TLS 1.3
- CORS policy
- XSS protection
- CSRF tokens

