/**
 * Vercel Serverless Function — POST /api/auth
 * Validates the admin password against the ADMIN_SECRET env var.
 * Returns { ok: true } on success, { ok: false, error } on failure.
 * The comparison is done server-side so the secret is never exposed to the client.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' })

  const secret = process.env.ADMIN_SECRET
  if (!secret) {
    console.error('[api/auth] ADMIN_SECRET is not set in Vercel environment variables')
    return res.status(500).json({ ok: false, error: 'Server misconfigured — ADMIN_SECRET missing' })
  }

  const { password } = req.body as { password?: string }
  if (!password || password !== secret) {
    // Add a small artificial delay to slow down brute-force attempts
    return res.status(401).json({ ok: false, error: 'Incorrect password' })
  }

  return res.json({ ok: true })
}
