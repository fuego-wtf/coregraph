"use strict";

// set test environment
process.env.NODE_ENV = 'test';

// mock environment variables
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.CLERK_JWT_PUBLIC_KEY = 'test-key';
process.env.CLERK_ISSUER = 'https://test.clerk.dev';
process.env.CLERK_AUDIENCE = 'test-audience';
process.env.CLERK_WEBHOOK_SECRET = 'test-webhook-secret'; 