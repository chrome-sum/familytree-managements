import postgres from 'postgres'

const connectionString = process.env.POSTGRES_URL!

const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1')

const sql = postgres(connectionString, {
  prepare: false, // For Supabase serverless/pooling
  ssl: isLocal ? false : 'require',
  connect_timeout: 10
})

export default sql
