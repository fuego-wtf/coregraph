"use strict";

/**
 * GraphEngine
 * Provides methods to create and query nodes and edges in Supabase.
 * Uses Redis for caching if needed.
 */
class GraphEngine {
  constructor(supabase, redis) {
    this.supabase = supabase;
    this.redis = redis; // optional usage
  }

  /**
   * Create or update a node
   * @param {string} id
   * @param {string[]} labels
   * @param {object} props
   */
  async addNode(id, labels = [], props = {}) {
    // Upsert the node in Supabase
    const { data, error } = await this.supabase
      .from("nodes")
      .upsert({ id, labels, props });
    if (error) throw new Error(error.message);
    // Optionally store in Redis for quick retrieval
    if (this.redis) {
      await this.redis.set(`node:${id}`, JSON.stringify({ labels, props }));
    }
    return data;
  }

  /**
   * Create an edge
   * @param {string} sourceId
   * @param {string} targetId
   * @param {string} label
   * @param {object} props
   */
  async addEdge(sourceId, targetId, label, props = {}) {
    const { data, error } = await this.supabase
      .from("edges")
      .insert([{ source_id: sourceId, target_id: targetId, label, props }]);
    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Query nodes by label or property
   * @param {string|null} label
   * @param {object} propFilter
   */
  async queryNodes(label = null, propFilter = {}) {
    let query = this.supabase.from("nodes").select("*");
    if (label) {
      query = query.contains("labels", [label]);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    // Filter by props if needed
    let results = data;
    if (Object.keys(propFilter).length > 0) {
      results = data.filter((node) =>
        Object.entries(propFilter).every(([k, v]) => node.props[k] === v)
      );
    }
    return results;
  }
}

module.exports = GraphEngine; 