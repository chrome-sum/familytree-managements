import postgres from 'postgres'

const connectionString = process.env.POSTGRES_URL!

const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1')

const maxConnections = Number(process.env.POSTGRES_MAX_CONNECTIONS || '3')

const createClient = () =>
  postgres(connectionString, {
    prepare: false, // For Supabase serverless/pooling
    ssl: isLocal ? false : 'require',
    connect_timeout: 10,
    max: Number.isFinite(maxConnections) ? Math.max(1, maxConnections) : 3,
    idle_timeout: 20,
  })

declare global {
  var __sql__: ReturnType<typeof postgres> | undefined
}

const sql = global.__sql__ ?? createClient()

if (process.env.NODE_ENV !== 'production') {
  global.__sql__ = sql
}

export default sql
