import { Connection } from '@memgraph/client'

interface PooledConnection extends Connection {
  inUse?: boolean;
}

export const MEMGRAPH_URI = process.env.MEMGRAPH_URI || 'bolt://localhost:7687'
export const MEMGRAPH_USERNAME = process.env.MEMGRAPH_USERNAME || ''
export const MEMGRAPH_PASSWORD = process.env.MEMGRAPH_PASSWORD || ''

const config = {
  host: MEMGRAPH_URI,
  username: MEMGRAPH_USERNAME,
  password: MEMGRAPH_PASSWORD,
  encrypted: false // Set to true in production
}

const pool: PooledConnection[] = []
const MAX_POOL_SIZE = 10

export const getConnection = async (): Promise<PooledConnection> => {
  // Return existing connection if available
  const availableConnection = pool.find(conn => !conn.inUse)
  if (availableConnection) {
    availableConnection.inUse = true
    return availableConnection
  }

  // Create new connection if pool not full
  if (pool.length < MAX_POOL_SIZE) {
    const conn = new Connection(config) as PooledConnection
    conn.inUse = true
    pool.push(conn)
    return conn
  }

  // Wait for available connection
  return new Promise((resolve) => {
    const checkPool = setInterval(() => {
      const conn = pool.find(c => !c.inUse)
      if (conn) {
        clearInterval(checkPool)
        conn.inUse = true
        resolve(conn)
      }
    }, 100)
  })
}

export const releaseConnection = (connection: PooledConnection) => {
  connection.inUse = false
}

export const runQuery = async (cypher: string, params = {}) => {
  const conn = await getConnection()
  try {
    const result = await conn.Execute(cypher, params)
    return result.records
  } catch (error) {
    console.error('Query execution error:', error)
    throw error
  } finally {
    releaseConnection(conn)
  }
}

export const closePool = async () => {
  await Promise.all(pool.map(conn => conn.Execute('MATCH (n) DETACH DELETE n')))
  pool.length = 0
}

// Cleanup on app shutdown
process.on('SIGINT', async () => {
  await closePool()
  process.exit(0)
}) 