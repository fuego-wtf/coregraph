"use strict";

const fp = require("fastify-plugin");

async function rateLimitPlugin(fastify, opts) {
  const redis = fastify.redis;
  const prefix = "ratelimit:";
  
  // default config from env or fallback values
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 900; // 15 minutes
  const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100;
  const blockDuration = parseInt(process.env.RATE_LIMIT_BLOCK_DURATION, 10) || 900; // 15 minutes

  fastify.decorate("rateLimit", async function(request, reply) {
    const identifier = request.user?.id || request.ip;
    const key = `${prefix}${identifier}`;

    try {
      // get current count
      const current = await redis.get(key);
      
      if (current === null) {
        // first request, set initial count
        await redis.set(key, 1, "EX", windowMs);
        setRateLimitHeaders(reply, maxRequests, maxRequests - 1, windowMs);
        return;
      }

      const count = parseInt(current, 10);
      
      if (count >= maxRequests) {
        // rate limit exceeded
        const ttl = await redis.ttl(key);
        setRateLimitHeaders(reply, maxRequests, 0, ttl);
        reply.code(429).send({ 
          error: "too many requests",
          retryAfter: ttl
        });
        return;
      }

      // increment count
      await redis.incr(key);
      const ttl = await redis.ttl(key);
      setRateLimitHeaders(reply, maxRequests, maxRequests - count - 1, ttl);

    } catch (err) {
      fastify.log.error("rate limit error:", err);
      // fail open if redis is down
      return;
    }
  });
}

// helper to set rate limit headers
function setRateLimitHeaders(reply, limit, remaining, reset) {
  reply.header("X-RateLimit-Limit", limit);
  reply.header("X-RateLimit-Remaining", remaining);
  reply.header("X-RateLimit-Reset", reset);
}

module.exports = fp(rateLimitPlugin); 