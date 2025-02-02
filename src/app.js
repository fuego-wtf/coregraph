"use strict";

const fastify = require("fastify");
const supabasePlugin = require("./plugins/supabase");
const redisPlugin = require("./plugins/redis");
const authPlugin = require("./plugins/auth");
const rateLimitPlugin = require("./plugins/rateLimit");
const errorHandler = require("./plugins/errorHandler");
const GraphEngine = require("./services/graphEngine");
const PaymentService = require("./services/paymentService");

const graphRoutes = require("./routes/graphRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const authRoutes = require("./routes/authRoutes");

async function buildApp(opts = {}) {
  const app = fastify({
    logger: opts.logger || {
      level: process.env.LOG_LEVEL || "silent",
      enabled: process.env.NODE_ENV !== "test"
    }
  });

  // register plugins
  await app.register(errorHandler);
  await app.register(supabasePlugin);
  await app.register(redisPlugin);
  await app.register(authPlugin);
  await app.register(rateLimitPlugin);

  // instantiate services
  const graphEngine = new GraphEngine(app.supabase, app.redis);
  const paymentService = new PaymentService();

  // decorate fastify
  app.decorate("graphEngine", graphEngine);
  app.decorate("paymentService", paymentService);

  // add global rate limit preHandler
  app.addHook("preHandler", app.rateLimit);

  // register routes
  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(graphRoutes, { prefix: "/api" });
  await app.register(paymentRoutes, { prefix: "/api/payment" });

  return app;
}

module.exports = buildApp; 