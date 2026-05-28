/**
 * Vercel Serverless Function — /api/admin/stats
 * Self-contained: no imports outside api/ so Vercel bundles it correctly.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { neon } from '@neondatabase/serverless'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (_req.method === 'OPTIONS') return res.status(200).end()

  const DB_URL = process.env.DATABASE_URL
  if (!DB_URL) return res.status(500).json({ error: 'DATABASE_URL is not set in Vercel environment variables. Go to vercel.com → Project → Settings → Environment Variables and add it.' })
  const sql = neon(DB_URL)

  try {
    const [total, revenue, newOrders, inDelivery, recent, byStatus, dailyRevenue] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM orders WHERE created_at >= date_trunc('month', NOW())`,
      sql`SELECT COALESCE(SUM(total_bhd), 0) as total FROM orders WHERE status NOT IN ('cancelled')`,
      sql`SELECT COUNT(*) as count FROM orders WHERE status = 'new'`,
      sql`SELECT COUNT(*) as count FROM orders WHERE status = 'on_delivery'`,
      sql`SELECT id, full_name, total_bhd, status, created_at, phone FROM orders ORDER BY created_at DESC LIMIT 5`,
      sql`SELECT status, COUNT(*) as count FROM orders GROUP BY status`,
      sql`
        SELECT DATE(created_at) as day, SUM(total_bhd) as revenue, COUNT(*) as orders_count
        FROM orders
        WHERE created_at >= NOW() - INTERVAL '7 days' AND status NOT IN ('cancelled')
        GROUP BY DATE(created_at) ORDER BY day ASC
      `,
    ])
    return res.json({
      totalOrdersThisMonth: Number(total[0].count),
      totalRevenue:         Number(revenue[0].total),
      newOrders:            Number(newOrders[0].count),
      inDelivery:           Number(inDelivery[0].count),
      recentOrders:         recent,
      byStatus:             Object.fromEntries(byStatus.map(r => [r.status, Number(r.count)])),
      dailyRevenue:         dailyRevenue.map(r => ({ day: r.day, revenue: Number(r.revenue), ordersCount: Number(r.orders_count) })),
    })
  } catch (e) {
    console.error('[api/admin/stats]', e)
    return res.status(500).json({ error: String(e) })
  }
}
