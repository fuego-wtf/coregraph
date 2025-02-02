"use strict";

async function paymentRoutes(fastify, opts) {
  const paymentService = fastify.paymentService;
  
  // create stripe checkout session
  fastify.post("/create-checkout-session", async (request, reply) => {
    const { priceId, successUrl, cancelUrl } = request.body;
    if (!priceId || !successUrl || !cancelUrl) {
      reply.code(400).send({ error: "missing priceId, successUrl or cancelUrl" });
      return;
    }
    try {
      const session = await paymentService.createCheckoutSession(priceId, successUrl, cancelUrl);
      reply.send({ url: session.url });
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: err.message });
    }
  });
}

module.exports = paymentRoutes; 