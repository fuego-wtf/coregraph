"use strict";

const { test } = require('tap');
const buildApp = require('../../src/app');

test('auth routes', async (t) => {
  const app = await buildApp();

  t.test('GET /api/auth/session - unauthorized', async (t) => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/auth/session'
    });

    t.equal(response.statusCode, 401);
    t.match(response.json(), {
      error: {
        code: 'AUTH_ERROR'
      }
    });
  });

  t.test('GET /api/auth/session - with valid token', async (t) => {
    const token = await app.jwt.sign({ sub: 'test-user', email: 'test@example.com' });
    
    const response = await app.inject({
      method: 'GET',
      url: '/api/auth/session',
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    t.equal(response.statusCode, 200);
    t.match(response.json(), {
      user: {
        id: 'test-user',
        email: 'test@example.com'
      },
      authenticated: true
    });
  });
}); 