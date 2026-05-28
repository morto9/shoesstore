/**
 * Vercel Serverless Function — POST /api/upload
 * Receives a raw image file in the request body and stores it in Vercel Blob.
 * Returns { url: string } — a public CDN URL to store in Neon.
 *
 * Requires BLOB_READ_WRITE_TOKEN env var (set in Vercel dashboard → Storage → Blob).
 */
import { put } from '@vercel/blob'
import type { VercelRequest, VercelResponse } from '@vercel/node'

// Disable Vercel's default JSON body parser — we need the raw binary stream
export const config = { api: { bodyParser: false } }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const rawName = (req.query.filename as string) || `product-${Date.now()}.jpg`
    // Prefix with products/ folder + timestamp to avoid collisions
    const pathname = `products/${Date.now()}-${rawName.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const blob = await put(pathname, req, { access: 'public' })
    return res.json({ url: blob.url })
  } catch (e) {
    console.error('[api/upload]', e)
    return res.status(500).json({ error: String(e) })
  }
}
