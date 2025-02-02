"use strict";

async function graphRoutes(fastify, opts) {
  const graphEngine = fastify.graphEngine;

  // create/update node
  fastify.post("/nodes", async (request, reply) => {
    const { id, labels, props } = request.body;
    if (!id) {
      reply.code(400).send({ error: "node id is required" });
      return;
    }
    try {
      const data = await graphEngine.addNode(id, labels || [], props || {});
      reply.send({ success: true, data });
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: err.message });
    }
  });

  // create edge
  fastify.post("/edges", async (request, reply) => {
    const { sourceId, targetId, label, props } = request.body;
    if (!sourceId || !targetId || !label) {
      reply.code(400).send({ error: "sourceId, targetId and label are required" });
      return;
    }
    try {
      const data = await graphEngine.addEdge(sourceId, targetId, label, props || {});
      reply.send({ success: true, data });
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: err.message });
    }
  });

  // query nodes
  fastify.get("/nodes", async (request, reply) => {
    const { label, propFilter } = request.query;
    let parsedFilter = {};
    if (propFilter) {
      try {
        parsedFilter = JSON.parse(propFilter);
      } catch (err) {
        reply.code(400).send({ error: "invalid json in propFilter" });
        return;
      }
    }
    try {
      const data = await graphEngine.queryNodes(label || null, parsedFilter);
      reply.send({ success: true, data });
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: err.message });
    }
  });
}

module.exports = graphRoutes; 