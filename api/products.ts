/**
 * Vercel Serverless Function — /api/products
 * Uses raw Neon SQL (no Drizzle, no relative imports → no bundling issues).
 */
import { neon } from '@neondatabase/serverless'
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const DB_URL = process.env.DATABASE_URL
  if (!DB_URL) return res.status(500).json({ error: 'DATABASE_URL is not set in Vercel environment variables. Go to vercel.com → Project → Settings → Environment Variables and add it.' })
  const sql = neon(DB_URL)

  try {
    // ── GET ──────────────────────────────────────────────────────────────────
    if (req.method === 'GET') {
      const rows = await sql`SELECT * FROM products ORDER BY updated_at DESC`
      return res.json(rows.map(p => {
        // Handle both old format ([39,40]) and new format ([{size,qty}])
        const rawSizes = JSON.parse((p.sizes as string) || '[]') as unknown[]
        const sizes = rawSizes.length > 0 && typeof rawSizes[0] === 'number'
          ? (rawSizes as number[]).map(s => ({ size: s, qty: 1 }))
          : rawSizes as Array<{ size: number; qty: number }>
        return {
          id:            p.id,
          nameEn:        p.name_en,
          nameAr:        p.name_ar  ?? '',
          priceBhd:      Number(p.price_bhd),
          tagEn:         p.tag_en   ?? '',
          tagAr:         p.tag_ar   ?? '',
          descriptionEn: p.description_en ?? '',
          descriptionAr: p.description_ar ?? '',
          sizes,
          imageUrl:      p.image_url ?? null,
          updatedAt:     new Date(p.updated_at as string).getTime(),
        }
      }))
    }

    // ── POST ─────────────────────────────────────────────────────────────────
    if (req.method === 'POST') {
      const b = req.body as Record<string, unknown>
      const sizesJson = JSON.stringify(b.sizes ?? [])
      // stock_qty = sum of all per-size quantities (kept for DB compatibility)
      const stockQty = Array.isArray(b.sizes)
        ? (b.sizes as Array<{ qty: number }>).reduce((s, x) => s + (x.qty ?? 0), 0)
        : 0
      await sql`
        INSERT INTO products
          (id, name_en, name_ar, price_bhd, tag_en, tag_ar,
           description_en, description_ar, stock_qty, sizes, image_url, updated_at)
        VALUES
          (${String(b.id ?? '')},
           ${String(b.nameEn ?? '')},
           ${String(b.nameAr ?? '')},
           ${Number(b.priceBhd ?? 0)},
           ${String(b.tagEn ?? '')},
           ${String(b.tagAr ?? '')},
           ${String(b.descriptionEn ?? '')},
           ${String(b.descriptionAr ?? '')},
           ${stockQty},
           ${sizesJson},
           ${b.imageUrl ? String(b.imageUrl) : null},
           NOW())
      `
      return res.status(201).json({ ok: true })
    }

    // ── PUT ──────────────────────────────────────────────────────────────────
    if (req.method === 'PUT') {
      const b = req.body as Record<string, unknown>
      if (!b.id) return res.status(400).json({ error: 'id required' })
      await sql`
        UPDATE products SET
          name_en        = COALESCE(${b.nameEn        !== undefined ? String(b.nameEn)        : null}, name_en),
          name_ar        = COALESCE(${b.nameAr        !== undefined ? String(b.nameAr)        : null}, name_ar),
          price_bhd      = COALESCE(${b.priceBhd      !== undefined ? Number(b.priceBhd)      : null}, price_bhd),
          tag_en         = COALESCE(${b.tagEn         !== undefined ? String(b.tagEn)         : null}, tag_en),
          tag_ar         = COALESCE(${b.tagAr         !== undefined ? String(b.tagAr)         : null}, tag_ar),
          description_en = COALESCE(${b.descriptionEn !== undefined ? String(b.descriptionEn) : null}, description_en),
          description_ar = COALESCE(${b.descriptionAr !== undefined ? String(b.descriptionAr) : null}, description_ar),
          sizes          = COALESCE(${b.sizes !== undefined ? JSON.stringify(b.sizes) : null}, sizes),
          stock_qty      = COALESCE(${b.sizes !== undefined
            ? (b.sizes as Array<{qty:number}>).reduce((s,x)=>s+(x.qty??0),0)
            : (b.stockQty !== undefined ? Number(b.stockQty) : null)}, stock_qty),
          image_url      = ${b.imageUrl !== undefined ? (b.imageUrl ? String(b.imageUrl) : null) : sql`image_url`},
          updated_at     = NOW()
        WHERE id = ${String(b.id)}
      `
      return res.json({ ok: true })
    }

    // ── DELETE ───────────────────────────────────────────────────────────────
    if (req.method === 'DELETE') {
      const { id } = req.body as { id: string }
      if (!id) return res.status(400).json({ error: 'id required' })
      await sql`DELETE FROM products WHERE id = ${id}`
      return res.json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    console.error('[api/products]', e)
    return res.status(500).json({ error: String(e) })
  }
}
