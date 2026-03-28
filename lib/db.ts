import postgres from 'postgres'

const connectionString = process.env.POSTGRES_URL

const isLocal = connectionString?.includes('localhost') || connectionString?.includes('127.0.0.1')

const maxConnections = Number(process.env.POSTGRES_MAX_CONNECTIONS || '3')

const createClient = () => {
  if (!connectionString) {
    throw new Error('POSTGRES_URL belum diatur di environment')
  }

  return postgres(connectionString, {
    prepare: false, // For Supabase serverless/pooling
    ssl: isLocal ? false : 'require',
    connect_timeout: 10,
    max: Number.isFinite(maxConnections) ? Math.max(1, maxConnections) : 3,
    idle_timeout: 20,
  })
}

declare global {
  var __sql__: ReturnType<typeof postgres> | undefined
}

function getClient() {
  if (!global.__sql__) {
    global.__sql__ = createClient()
  }

  return global.__sql__
}

const sql = new Proxy((() => {}) as unknown as ReturnType<typeof postgres>, {
  apply(_target, thisArg, argArray) {
    return Reflect.apply(getClient() as unknown as (...args: unknown[]) => unknown, thisArg, argArray)
  },
  get(_target, prop, receiver) {
    const client = getClient() as unknown as Record<PropertyKey, unknown>
    const value = Reflect.get(client, prop, receiver)
    return typeof value === 'function' ? value.bind(client) : value
  },
}) as ReturnType<typeof postgres>

export default sql
