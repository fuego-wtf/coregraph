"use strict";

const fp = require("fastify-plugin");
const jwt = require("@fastify/jwt");

async function authPlugin(fastify, opts) {
  // for prototype, use simple secret
  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'prototype-secret-change-in-production',
    sign: {
      expiresIn: '1h'
    }
  });

  // decorator to handle auth
  fastify.decorate("authenticate", async function(request, reply) {
    try {
      const auth = request.headers.authorization;
      if (!auth || !auth.startsWith('Bearer ')) {
        throw new Error('missing or invalid authorization header');
      }

      const token = auth.split(' ')[1];
      const decoded = await request.jwtVerify();

      // attach user info to request
      request.user = {
        id: decoded.sub || decoded.id,
        email: decoded.email,
        roles: decoded.roles || ['user']
      };
    } catch (err) {
      reply.code(401).send({ error: "unauthorized", details: err.message });
    }
  });
}

module.exports = fp(authPlugin); 