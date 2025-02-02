/* supabase plugin */
"use strict";

const fp = require("fastify-plugin");

// mock implementation for prototype
class MockDB {
  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
    this.users = new Map();
  }

  from(table) {
    return {
      upsert: async (data) => {
        const store = this[table];
        store.set(data.id, data);
        return { data };
      },
      insert: async (data) => {
        const store = this[table];
        const id = Date.now().toString();
        store.set(id, { id, ...data });
        return { data: { id, ...data } };
      },
      select: async () => {
        const store = this[table];
        return { data: Array.from(store.values()) };
      },
      delete: async () => ({ data: null }),
      match: async () => ({ data: null })
    };
  }
}

async function supabasePlugin(fastify, opts) {
  // use mock DB for prototype
  if (process.env.MOCK_DB === 'true') {
    fastify.decorate('supabase', new MockDB());
    return;
  }

  // real Supabase client would go here
  throw new Error('real Supabase connection not implemented yet');
}

module.exports = fp(supabasePlugin); 