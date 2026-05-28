import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

// DATABASE_URL يجب أن يكون محدداً في .env.local
function getDb() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not set. Please add it to .env.local')
  }
  const sql = neon(url)
  return drizzle(sql, { schema })
}

export const db = getDb()
export * from './schema'
