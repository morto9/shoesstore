import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { config as loadEnv } from 'dotenv'
import { handleProducts, handleOrders, handleStats } from './dev-api/handlers'
import type { Plugin, Connect } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'

/** Read request body as parsed JSON */
function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk: Buffer) => { data += chunk.toString() })
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}) }
      catch { resolve({}) }
    })
    req.on('error', reject)
  })
}

function devApiPlugin(): Plugin {
  return {
    name: 'dev-api',
    configureServer(server) {
      // Load .env.local so DATABASE_URL is available at middleware runtime
      loadEnv({ path: '.env.local' })

      server.middlewares.use(
        '/api',
        async (req: IncomingMessage, res: ServerResponse, _next: Connect.NextFunction) => {
          const url    = req.url ?? '/'
          const method = (req.method ?? 'GET').toUpperCase()

          try {
            let result: unknown

            // ── Products ────────────────────────────────────────────────────
            if (url.startsWith('/products')) {
              const body = await readJsonBody(req)
              result = await handleProducts(method, body)

            // ── Orders ──────────────────────────────────────────────────────
            } else if (url.startsWith('/orders')) {
              const body = await readJsonBody(req)
              result = await handleOrders(method, body)

            // ── Admin stats ─────────────────────────────────────────────────
            } else if (url.startsWith('/admin/stats')) {
              result = await handleStats()

            } else {
              res.statusCode = 404
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Not found' }))
              return
            }

            res.setHeader('Content-Type', 'application/json')
            res.statusCode = 200
            res.end(JSON.stringify(result))
          } catch (err) {
            console.error('[dev-api]', err)
            res.setHeader('Content-Type', 'application/json')
            res.statusCode = 500
            res.end(JSON.stringify({ error: String(err) }))
          }
        }
      )
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), devApiPlugin()],
})
