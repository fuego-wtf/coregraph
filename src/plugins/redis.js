/* redis plugin */
"use strict";

const fp = require("fastify-plugin");
const fastifyRedis = require("fastify-redis");
require("dotenv").config();

class MockRedis {
  constructor() {
    this.store = new Map();
  }

  async get(key) {
    return this.store.get(key);
  }

  async set(key, value) {
    this.store.set(key, value);
    return 'OK';
  }

  async del(key) {
    this.store.delete(key);
    return 1;
  }

  async incr(key) {
    const val = (this.store.get(key) || 0) + 1;
    this.store.set(key, val);
    return val;
  }
}

async function redisPlugin(fastify, opts) {
  if (process.env.MOCK_DB === 'true') {
    fastify.decorate('redis', new MockRedis());
  } else {
    await fastify.register(fastifyRedis, {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD
    });
  }
}

module.exports = fp(redisPlugin); 