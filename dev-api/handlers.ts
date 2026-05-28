/**
 * Shared API handlers — used by both:
 * 1. Vite dev middleware (dev-api plugin in vite.config.ts)
 * 2. Vercel serverless functions (api/*.ts) — in production
 */
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { products, orders, orderLines } from '../db/schema'
import { eq, desc } from 'drizzle-orm'

function getDb() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL not set')
  return drizzle(neon(url), { schema: { products, orders, orderLines } })
}

// ─── PRODUCTS ────────────────────────────────────────────────────────────────
export async function handleProducts(method: string, body: Record<string, unknown>) {
  const db = getDb()

  if (method === 'GET') {
    const rows = await db.select().from(products)
    return rows.map(p => {
      const rawSizes = JSON.parse(p.sizes || '[]') as unknown[]
      const sizes = rawSizes.length > 0 && typeof rawSizes[0] === 'number'
        ? (rawSizes as number[]).map(s => ({ size: s, qty: 1 }))
        : rawSizes as Array<{ size: number; qty: number }>
      return {
        id: p.id, nameEn: p.nameEn, nameAr: p.nameAr ?? '',
        priceBhd: Number(p.priceBhd),
        tagEn: p.tagEn ?? '', tagAr: p.tagAr ?? '',
        descriptionEn: p.descriptionEn ?? '', descriptionAr: p.descriptionAr ?? '',
        sizes,
        imageUrl: p.imageUrl ?? null,
        updatedAt: p.updatedAt.getTime(),
      }
    })
  }

  if (method === 'POST') {
    const sizesArr = (body.sizes ?? []) as Array<{ qty: number }>
    const stockQty = sizesArr.reduce((s, x) => s + (x.qty ?? 0), 0)
    await db.insert(products).values({
      id:            String(body.id ?? ''),
      nameEn:        String(body.nameEn ?? ''),
      nameAr:        String(body.nameAr ?? ''),
      priceBhd:      String(body.priceBhd ?? 0),
      tagEn:         String(body.tagEn ?? ''),
      tagAr:         String(body.tagAr ?? ''),
      descriptionEn: String(body.descriptionEn ?? ''),
      descriptionAr: String(body.descriptionAr ?? ''),
      stockQty,
      sizes:         JSON.stringify(body.sizes ?? []),
      imageUrl:      body.imageUrl ? String(body.imageUrl) : null,
    })
    return { ok: true }
  }

  if (method === 'PUT') {
    const { id, ...rest } = body as Record<string, unknown>
    if (!id) return { error: 'id required' }
    const upd: Record<string, unknown> = {}
    if (rest.nameEn        !== undefined) upd.nameEn        = String(rest.nameEn)
    if (rest.nameAr        !== undefined) upd.nameAr        = String(rest.nameAr)
    if (rest.priceBhd      !== undefined) upd.priceBhd      = String(rest.priceBhd)
    if (rest.tagEn         !== undefined) upd.tagEn         = String(rest.tagEn)
    if (rest.tagAr         !== undefined) upd.tagAr         = String(rest.tagAr)
    if (rest.descriptionEn !== undefined) upd.descriptionEn = String(rest.descriptionEn)
    if (rest.descriptionAr !== undefined) upd.descriptionAr = String(rest.descriptionAr)
    if (rest.sizes         !== undefined) {
      upd.sizes    = JSON.stringify(rest.sizes)
      upd.stockQty = (rest.sizes as Array<{qty:number}>).reduce((s,x)=>s+(x.qty??0),0)
    }
    if (rest.imageUrl !== undefined) upd.imageUrl = rest.imageUrl ? String(rest.imageUrl) : null
    upd.updatedAt = new Date()
    await db.update(products).set(upd).where(eq(products.id, String(id)))
    return { ok: true }
  }

  if (method === 'DELETE') {
    const id = String((body as Record<string, unknown>).id ?? '')
    await db.delete(products).where(eq(products.id, id))
    return { ok: true }
  }

  return { error: 'Method not allowed' }
}

// ─── ORDERS ───────────────────────────────────────────────────────────────────
export async function handleOrders(method: string, body: Record<string, unknown>) {
  const db = getDb()

  if (method === 'GET') {
    const ordersRows = await db.select().from(orders).orderBy(desc(orders.createdAt))
    const linesRows  = await db.select().from(orderLines)
    return ordersRows.map(o => ({
      id:           o.id,
      createdAt:    o.createdAt.getTime(),
      status:       o.status,
      whatsappSent: o.whatsappSent,
      payment: { method: o.paymentMethod, codFeeBHD: Number(o.codFeeBhd), paid: o.paid },
      delivery: {
        country:     o.country,
        city:        o.city,
        addressLine: o.addressLine,
        notes:       o.notes ?? undefined,
        phone:       o.phone,
        fullName:    o.fullName,
      },
      lines: linesRows.filter(l => l.orderId === o.id).map(l => ({
        productId:    l.productId,
        productName:  l.productName,
        size:         l.size,
        qty:          l.qty,
        secondSize:   l.secondSize ?? null,
        unitPriceBHD: Number(l.unitPriceBhd),
      })),
      subtotalBHD: Number(o.subtotalBhd),
      totalBHD:    Number(o.totalBhd),
    }))
  }

  if (method === 'POST') {
    const d = body as {
      id: string; country: string; city: string; addressLine: string
      notes?: string | null; phone: string; fullName: string
      codFeeBhd: number; subtotalBhd: number; totalBhd: number
      lines: Array<{ productId: string; productName: string; size: number; qty: number; secondSize?: number | null; unitPriceBhd: number }>
    }
    await db.insert(orders).values({
      id:            d.id,
      status:        'new',
      paymentMethod: 'cod',
      codFeeBhd:     String(d.codFeeBhd ?? 2),
      paid:          false,
      country:       d.country,
      city:          d.city,
      addressLine:   d.addressLine,
      notes:         d.notes ?? null,
      phone:         d.phone,
      fullName:      d.fullName,
      subtotalBhd:   String(d.subtotalBhd),
      totalBhd:      String(d.totalBhd),
      whatsappSent:  false,
    })
    if (d.lines?.length > 0) {
      await db.insert(orderLines).values(
        d.lines.map(l => ({
          orderId:      d.id,
          productId:    l.productId,
          productName:  l.productName,
          size:         l.size,
          qty:          l.qty,
          secondSize:   l.secondSize ?? null,
          unitPriceBhd: String(l.unitPriceBhd),
        }))
      )

      // Decrement per-size stock (mirrors production api/orders.ts behaviour)
      const sql = neon(process.env.DATABASE_URL!)
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
        const updated = current.map(s => ({ size: s.size, qty: Math.max(0, s.qty - (sizeMap.get(s.size) ?? 0)) }))
        const newStockQty = updated.reduce((sum, s) => sum + s.qty, 0)
        await sql`UPDATE products SET sizes = ${JSON.stringify(updated)}, stock_qty = ${newStockQty}, updated_at = NOW() WHERE id = ${productId}`
      }
    }
    return { ok: true, id: d.id }
  }

  if (method === 'PUT') {
    const { id, status, paid, whatsappSent } = body as Record<string, unknown>
    if (!id) return { error: 'id required' }
    const upd: Record<string, unknown> = {}
    if (status !== undefined)       upd.status       = status
    if (paid !== undefined)         upd.paid         = paid
    if (whatsappSent !== undefined)  upd.whatsappSent = whatsappSent
    await db.update(orders).set(upd).where(eq(orders.id, String(id)))
    return { ok: true }
  }

  if (method === 'DELETE') {
    const { id } = body as Record<string, unknown>
    if (!id) return { error: 'id required' }
    await db.delete(orderLines).where(eq(orderLines.orderId, String(id)))
    await db.delete(orders).where(eq(orders.id, String(id)))
    return { ok: true }
  }

  return { error: 'Method not allowed' }
}

// ─── ADMIN STATS ──────────────────────────────────────────────────────────────
export async function handleStats() {
  const sql = neon(process.env.DATABASE_URL!)
  const [total, revenue, newOrders, inDelivery, recent, byStatus] = await Promise.all([
    sql`SELECT COUNT(*) as count FROM orders WHERE created_at >= date_trunc('month', NOW())`,
    sql`SELECT COALESCE(SUM(total_bhd), 0) as total FROM orders WHERE status NOT IN ('cancelled')`,
    sql`SELECT COUNT(*) as count FROM orders WHERE status = 'new'`,
    sql`SELECT COUNT(*) as count FROM orders WHERE status = 'on_delivery'`,
    sql`SELECT id, full_name, total_bhd, status, created_at, phone FROM orders ORDER BY created_at DESC LIMIT 5`,
    sql`SELECT status, COUNT(*) as count FROM orders GROUP BY status`,
  ])

  // إيرادات آخر 7 أيام للرسم البياني
  const dailyRevenue = await sql`
    SELECT
      DATE(created_at) as day,
      SUM(total_bhd) as revenue,
      COUNT(*) as orders_count
    FROM orders
    WHERE created_at >= NOW() - INTERVAL '7 days'
      AND status NOT IN ('cancelled')
    GROUP BY DATE(created_at)
    ORDER BY day ASC
  `

  return {
    totalOrdersThisMonth: Number(total[0].count),
    totalRevenue:         Number(revenue[0].total),
    newOrders:            Number(newOrders[0].count),
    inDelivery:           Number(inDelivery[0].count),
    recentOrders:         recent,
    byStatus:             Object.fromEntries(byStatus.map(r => [r.status, Number(r.count)])),
    dailyRevenue:         dailyRevenue.map(r => ({
      day:         r.day,
      revenue:     Number(r.revenue),
      ordersCount: Number(r.orders_count),
    })),
  }
}
