"use strict";

const { Webhook } = require('svix');

async function authRoutes(fastify, opts) {
  // mock login for prototype
  fastify.post("/login", async (request, reply) => {
    const { email, password } = request.body;
    
    // mock validation
    if (!email || !password) {
      return reply.code(400).send({ error: "email and password required" });
    }

    // generate mock token
    const token = await fastify.jwt.sign({
      id: '123',
      email: email,
      roles: ['user']
    });

    return { token };
  });

  // validate session
  fastify.get("/session", {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    return {
      user: request.user,
      authenticated: true
    };
  });

  // handle webhook from Clerk for user events
  fastify.post("/webhook", async (request, reply) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      fastify.log.error('webhook secret not configured');
      return reply.code(500).send({ error: 'webhook configuration error' });
    }

    // verify webhook signature
    const payload = JSON.stringify(request.body);
    const headers = {
      'svix-id': request.headers['svix-id'],
      'svix-timestamp': request.headers['svix-timestamp'],
      'svix-signature': request.headers['svix-signature']
    };

    // validate webhook
    const wh = new Webhook(webhookSecret);
    let evt;
    
    try {
      evt = wh.verify(payload, headers);
    } catch (err) {
      fastify.log.error('webhook verification failed:', err);
      return reply.code(400).send({ error: 'webhook verification failed' });
    }
    
    // handle different event types
    try {
      switch (evt.type) {
        case 'user.created':
        case 'user.updated':
          await fastify.supabase.from('users')
            .upsert({
              id: evt.data.id,
              email: evt.data.email_addresses[0]?.email_address,
              first_name: evt.data.first_name,
              last_name: evt.data.last_name,
              updated_at: new Date().toISOString()
            });
          break;
          
        case 'user.deleted':
          await fastify.supabase.from('users')
            .delete()
            .match({ id: evt.data.id });
          break;

        default:
          fastify.log.info(`unhandled webhook event type: ${evt.type}`);
      }

      return { success: true };
    } catch (err) {
      fastify.log.error('error processing webhook:', err);
      return reply.code(500).send({ error: 'webhook processing failed' });
    }
  });
}

module.exports = authRoutes; 