import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type CartItem = {
  productId: string
  size: number
  qty: number
}

type CartApi = {
  items: CartItem[]
  totalItems: number
  getQty: (productId: string, size: number) => number
  add: (item: { productId: string; size: number; qty: number }, opts?: { maxQty?: number }) => void
  setQty: (productId: string, size: number, qty: number, opts?: { maxQty?: number }) => void
  remove: (productId: string, size: number) => void
  clear: () => void
}

const STORAGE_KEY = 'catchy.cart.v1'

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return (parsed as any[])
      .map((x) => ({
        productId: String(x?.productId ?? ''),
        size: Number(x?.size ?? 0),
        qty: Number(x?.qty ?? 0),
      }))
      .filter((x) => x.productId && Number.isFinite(x.size) && Number.isFinite(x.qty) && x.qty > 0)
  } catch {
    return []
  }
}

const CartContext = createContext<CartApi | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => loadCart())

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const api = useMemo<CartApi>(() => {
    const getQty = (productId: string, size: number) =>
      items.find((i) => i.productId === productId && i.size === size)?.qty ?? 0

    const setQty = (
      productId: string,
      size: number,
      qty: number,
      opts?: { maxQty?: number },
    ) => {
      const max = typeof opts?.maxQty === 'number' ? opts.maxQty : Infinity
      const nextQty = Math.max(0, Math.min(max, Math.floor(qty)))
      setItems((cur) => {
        const idx = cur.findIndex((i) => i.productId === productId && i.size === size)
        if (idx === -1) {
          if (nextQty <= 0) return cur
          return [...cur, { productId, size, qty: nextQty }]
        }
        if (nextQty <= 0) return cur.filter((_, i) => i !== idx)
        const copy = cur.slice()
        copy[idx] = { ...copy[idx], qty: nextQty }
        return copy
      })
    }

    const add = (
      item: { productId: string; size: number; qty: number },
      opts?: { maxQty?: number },
    ) => {
      const existing = getQty(item.productId, item.size)
      setQty(item.productId, item.size, existing + item.qty, opts)
    }

    return {
      items,
      totalItems: items.reduce((sum, i) => sum + i.qty, 0),
      getQty,
      add,
      setQty,
      remove: (productId, size) => setQty(productId, size, 0),
      clear: () => setItems([]),
    }
  }, [items])

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

