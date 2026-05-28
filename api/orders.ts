/**
 * Vercel Serverless Function — /api/orders
 * Uses raw Neon SQL (no Drizzle, no relative imports → no bundling issues).
 */
import { neon } from '@neondatabase/serverless'
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const DB_URL = process.env.DATABASE_URL
  if (!DB_URL) return res.status(500).json({ error: 'DATABASE_URL is not set in Vercel environment variables. Go to vercel.com → Project → Settings → Environment Variables and add it.' })
  const sql = neon(DB_URL)

  try {
    // ── GET ──────────────────────────────────────────────────────────────────
    if (req.method === 'GET') {
      const [ordersRows, linesRows] = await Promise.all([
        sql`SELECT * FROM orders ORDER BY created_at DESC`,
        sql`SELECT * FROM order_lines`,
      ])
      return res.json(ordersRows.map(o => ({
        id:           o.id,
        createdAt:    new Date(o.created_at as string).getTime(),
        status:       o.status,
        paid:         o.paid,
        whatsappSent: o.whatsapp_sent,
        payment: {
          method:    o.payment_method,
          codFeeBHD: Number(o.cod_fee_bhd),
          paid:      o.paid,
        },
        delivery: {
          country:     o.country,
          city:        o.city,
          addressLine: o.address_line,
          notes:       o.notes ?? undefined,
          phone:       o.phone,
          fullName:    o.full_name,
        },
        lines: linesRows
          .filter(l => l.order_id === o.id)
          .map(l => ({
            productId:    l.product_id,
            productName:  l.product_name,
            size:         Number(l.size),
            qty:          Number(l.qty),
            secondSize:   l.second_size ?? null,
            unitPriceBHD: Number(l.unit_price_bhd),
          })),
        subtotalBHD: Number(o.subtotal_bhd),
        totalBHD:    Number(o.total_bhd),
      })))
    }

    // ── POST ─────────────────────────────────────────────────────────────────
    if (req.method === 'POST') {
      const d = req.body as {
        id: string; country: string; city: string; addressLine: string
        notes?: string | null; phone: string; fullName: string
        codFeeBhd: number; subtotalBhd: number; totalBhd: number
        lines: Array<{ productId: string; productName: string; size: number; qty: number; secondSize?: number | null; unitPriceBhd: number }>
      }
      await sql`
        INSERT INTO orders
          (id, status, payment_method, cod_fee_bhd, paid,
           country, city, address_line, notes, phone, full_name,
           subtotal_bhd, total_bhd, whatsapp_sent)
        VALUES
          (${d.id}, 'new', 'cod', ${d.codFeeBhd ?? 2}, false,
           ${d.country}, ${d.city}, ${d.addressLine}, ${d.notes ?? null},
           ${d.phone}, ${d.fullName},
           ${d.subtotalBhd}, ${d.totalBhd}, false)
      `
      if (d.lines?.length > 0) {
        for (const l of d.lines) {
          await sql`
            INSERT INTO order_lines
              (order_id, product_id, product_name, size, qty, second_size, unit_price_bhd)
            VALUES
              (${d.id}, ${l.productId}, ${l.productName}, ${l.size}, ${l.qty},
               ${l.secondSize ?? null}, ${l.unitPriceBhd})
          `
        }

        // ── Decrement per-size stock ──────────────────────────────────────
        // Aggregate total qty ordered per (productId, size) — including secondSize (qty=1 each)
        const deduct = new Map<string, Map<number, number>>()
        for (const l of d.lines) {
          if (!deduct.has(l.productId)) deduct.set(l.productId, new Map())
          const m = deduct.get(l.productId)!
          m.set(l.size, (m.get(l.size) ?? 0) + l.qty)
          if (l.secondSize) m.set(l.secondSize, (m.get(l.secondSize) ?? 0) + 1)
        }
        for (const [productId, sizeMap] of deduct) {
          const rows = await sql`SELECT sizes FROM products WHERE id = ${productId}`
          if (rows.length === 0) continue
          const current = JSON.parse((rows[0].sizes as string) || '[]') as Array<{ size: number; qty: number }>
          const updated = current.map(s => ({
            size: s.size,
            qty:  Math.max(0, s.qty - (sizeMap.get(s.size) ?? 0)),
          }))
          const newStockQty = updated.reduce((sum, s) => sum + s.qty, 0)
          await sql`
            UPDATE products
            SET sizes = ${JSON.stringify(updated)}, stock_qty = ${newStockQty}, updated_at = NOW()
            WHERE id = ${productId}
          `
        }
      }
      return res.status(201).json({ ok: true, id: d.id })
    }

    // ── PUT ──────────────────────────────────────────────────────────────────
    if (req.method === 'PUT') {
      const { id, status, paid, whatsappSent } = req.body as Record<string, unknown>
      if (!id) return res.status(400).json({ error: 'id required' })
      if (status       !== undefined) await sql`UPDATE orders SET status        = ${status}       WHERE id = ${id}`
      if (paid         !== undefined) await sql`UPDATE orders SET paid          = ${paid}         WHERE id = ${id}`
      if (whatsappSent !== undefined) await sql`UPDATE orders SET whatsapp_sent = ${whatsappSent} WHERE id = ${id}`
      return res.json({ ok: true })
    }

    // ── DELETE ──────────────────────────────────────────────────────────────────
    if (req.method === 'DELETE') {
      const { id } = req.body as { id: string }
      if (!id) return res.status(400).json({ error: 'id required' })
      // Delete lines first (foreign key), then the order itself
      await sql`DELETE FROM order_lines WHERE order_id = ${id}`
      await sql`DELETE FROM orders WHERE id = ${id}`
      return res.json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    console.error('[api/orders]', e)
    return res.status(500).json({ error: String(e) })
  }
}
