import { defineConfig } from 'drizzle-kit'
import { config } from 'dotenv'

export default defineConfig({
  schema:    './db/schema.ts',
  out:       './db/migrations',
  dialect:   'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict:  true,
})
