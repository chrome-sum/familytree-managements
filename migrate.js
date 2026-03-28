/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv/config')
const postgres = require('postgres')
const fs = require('fs')
const path = require('path')

const connectionString = process.env.POSTGRES_URL

if (!connectionString) {
  throw new Error('POSTGRES_URL belum diatur di environment')
}

const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1')

const sql = postgres(connectionString, {
  prepare: false,
  ssl: isLocal ? false : 'require',
  connect_timeout: 10,
})

async function runSetup() {
  try {
    console.log('Starting schema setup...')

    const schemaFile = path.join(process.cwd(), 'supabase/schema.sql')

    if (!fs.existsSync(schemaFile)) {
      throw new Error('File supabase/schema.sql tidak ditemukan')
    }

    console.log('Applying schema from supabase/schema.sql...')
    const schema = fs.readFileSync(schemaFile, 'utf8')
    await sql.unsafe(schema)

    console.log('Schema applied successfully.')
    console.log('No sample data was inserted.')
    console.log('Existing data was not deleted by this script.')
  } catch (err) {
    console.error('Error during schema setup:', err)
    process.exitCode = 1
  } finally {
    await sql.end({ timeout: 5 })
  }
}

runSetup()
