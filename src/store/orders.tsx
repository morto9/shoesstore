import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import type { GCCCountry } from './region'
import { apiOrders } from '../lib/api'

export type OrderStatus =
  | 'new'
  | 'approved'
  | 'processing'
  | 'processed'
  | 'on_delivery'
  | 'delivered'
  | 'paid'
  | 'cancelled'

export type OrderLine = {
  productId:    string
  productName:  string
  size:         number
  qty:          number
  secondSize?:  number | null
  unitPriceBHD: number
}

export type Order = {
  id:          string // e.g. CS-1042
  createdAt:   number
  status:      OrderStatus
  whatsappSent: boolean
  payment: {
    method:    'cod'
    codFeeBHD: number
    paid:      boolean
  }
  delivery: {
    country:     GCCCountry
    city:        string
    addressLine: string
    notes?:      string
    phone:       string
    fullName:    string
  }
  lines:       OrderLine[]
  subtotalBHD: number
  totalBHD:    number
}

const STORAGE_KEY = 'catchy.orders.v1'
const COUNTER_KEY = 'catchy.orders.counter.v1'

function loadOrders(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return (parsed as Order[]).map(o => ({
      ...o,
      whatsappSent: (o as Order).whatsappSent ?? false,
    }))
  } catch {
    return []
  }
}

function nextOrderId(): string {
  const current = Number(localStorage.getItem(COUNTER_KEY) ?? '1000')
  const next = Number.isFinite(current) ? current + 1 : 1001
  localStorage.setItem(COUNTER_KEY, String(next))
  return `CS-${next}`
}

type OrdersApi = {
  orders:        Order[]
  loading:       boolean
  create:        (input: Omit<Order, 'id' | 'createdAt' | 'status' | 'whatsappSent'> & { status?: OrderStatus }) => Promise<Order>
  updateStatus:  (id: string, status: OrderStatus) => Promise<void>
  setPaid:       (id: string, paid: boolean) => Promise<void>
  setWhatsappSent: (id: string, sent: boolean) => Promise<void>
  remove:        (id: string) => Promise<void>
  clearAll:      () => void
  reload:        () => Promise<void>
}

const OrdersContext = createContext<OrdersApi | null>(null)

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(() => loadOrders())
  const [loading, setLoading] = useState(false)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiOrders.getAll()
      const mapped: Order[] = data.map(o => ({
        id:           o.id,
        createdAt:    o.createdAt,
        status:       o.status as OrderStatus,
        whatsappSent: o.whatsappSent,
        payment: {
          method:    'cod' as const,
          codFeeBHD: o.payment.codFeeBHD,
          paid:      o.payment.paid,
        },
        delivery: {
          country:     o.delivery.country as GCCCountry,
          city:        o.delivery.city,
          addressLine: o.delivery.addressLine,
          notes:       o.delivery.notes,
          phone:       o.delivery.phone,
          fullName:    o.delivery.fullName,
        },
        lines:       o.lines.map(l => ({
          productId:    l.productId,
          productName:  l.productName,
          size:         l.size,
          qty:          l.qty,
          secondSize:   l.secondSize,
          unitPriceBHD: l.unitPriceBHD,
        })),
        subtotalBHD: o.subtotalBHD,
        totalBHD:    o.totalBHD,
      }))
      setOrders(mapped)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped))
    } catch {
      // fallback إلى localStorage
      setOrders(loadOrders())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { reload() }, [reload])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
  }, [orders])

  const api = useMemo<OrdersApi>(() => ({
    orders,
    loading,
    create: async (input) => {
      const order: Order = {
        ...input,
        id:           nextOrderId(),
        createdAt:    Date.now(),
        status:       input.status ?? 'new',
        whatsappSent: false,
      }
      // تحديث محلي فوري
      setOrders((cur) => [order, ...cur])
      // حفظ في Neon
      try {
        await apiOrders.create({
          id:          order.id,
          country:     order.delivery.country,
          city:        order.delivery.city,
          addressLine: order.delivery.addressLine,
          notes:       order.delivery.notes,
          phone:       order.delivery.phone,
          fullName:    order.delivery.fullName,
          codFeeBhd:   order.payment.codFeeBHD,
          subtotalBhd: order.subtotalBHD,
          totalBhd:    order.totalBHD,
          lines:       order.lines.map(l => ({
            productId:    l.productId,
            productName:  l.productName,
            size:         l.size,
            qty:          l.qty,
            secondSize:   l.secondSize,
            unitPriceBhd: l.unitPriceBHD,
          })),
        })
      } catch { /* fallback: localStorage فقط */ }
      return order
    },
    updateStatus: async (id, status) => {
      setOrders((cur) => cur.map((o) => (o.id === id ? { ...o, status } : o)))
      try { await apiOrders.update({ id, status }) } catch { /* ignore */ }
    },
    setPaid: async (id, paid) => {
      setOrders((cur) =>
        cur.map((o) =>
          o.id === id ? { ...o, payment: { ...o.payment, paid }, status: paid ? 'paid' : o.status } : o
        )
      )
      try { await apiOrders.update({ id, paid, status: paid ? 'paid' : undefined }) } catch { /* ignore */ }
    },
    setWhatsappSent: async (id, whatsappSent) => {
      setOrders((cur) => cur.map((o) => (o.id === id ? { ...o, whatsappSent } : o)))
      try { await apiOrders.update({ id, whatsappSent }) } catch { /* ignore */ }
    },
    remove: async (id) => {
      setOrders((cur) => cur.filter((o) => o.id !== id))
      try { await apiOrders.remove(id) } catch (e) { console.error('[orders] remove failed:', e) }
    },
    clearAll: () => setOrders([]),
    reload,
  }), [orders, loading, reload])

  return <OrdersContext.Provider value={api}>{children}</OrdersContext.Provider>
}

export function useOrders() {
  const ctx = useContext(OrdersContext)
  if (!ctx) throw new Error('useOrders must be used within OrdersProvider')
  return ctx
}
