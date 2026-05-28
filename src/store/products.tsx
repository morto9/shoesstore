import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { apiProducts, type ApiProduct } from '../lib/api'

// Each size has its own stock quantity
export type SizeStock = { size: number; qty: number }

export type Product = {
  id:            string
  name:          string
  nameAr:        string
  price:         number
  tag:           string
  tagAr:         string
  description:   string
  descriptionAr: string
  sizes:         SizeStock[]   // per-size quantities (replaces flat sizes + stockQty)
  imageUrl?:     string
  updatedAt:     number
}

/** Total stock across all sizes */
export function totalStock(p: Product): number {
  return p.sizes.reduce((sum, s) => sum + s.qty, 0)
}

/** Stock for a specific size (0 if not found) */
export function sizeStock(p: Product, size: number): number {
  return p.sizes.find(s => s.size === size)?.qty ?? 0
}

/** Parse sizes JSON — handles both old format ([39,40]) and new ({size,qty}[]) */
function parseSizes(raw: unknown): SizeStock[] {
  try {
    const arr = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!Array.isArray(arr) || arr.length === 0) return []
    // Old format: plain numbers [39, 40, 41]
    if (typeof arr[0] === 'number') return arr.map((s: number) => ({ size: s, qty: 1 }))
    // New format: [{size, qty}]
    return arr as SizeStock[]
  } catch {
    return []
  }
}

const SEED: Product[] = [
  {
    id: 'cs-01', name: 'Nimbus Runner', nameAr: 'نيمبوس رانر',
    price: 89, tag: 'Daily runner', tagAr: 'جري يومي',
    description: 'Lightweight cushioning with a clean silhouette for everyday miles.',
    descriptionAr: 'تبطين خفيف الوزن بمظهر أنيق لمسافات يومية مريحة.',
    sizes: [39,40,41,42,43,44].map(s => ({ size: s, qty: 4 })), updatedAt: Date.now(),
  },
  {
    id: 'cs-02', name: 'Street Low', nameAr: 'ستريت لو',
    price: 79, tag: 'Minimal classic', tagAr: 'كلاسيك مينيمال',
    description: 'A low profile sneaker that goes with everything—simple, sharp, timeless.',
    descriptionAr: 'حذاء منخفض يناسب كل الأزياء — بسيط، حاد، خالد.',
    sizes: [38,39,40,41,42,43].map(s => ({ size: s, qty: 3 })), updatedAt: Date.now(),
  },
  {
    id: 'cs-03', name: 'Cloud Knit', nameAr: 'كلاود نيت',
    price: 99, tag: 'Ultra comfort', tagAr: 'راحة فائقة',
    description: 'Breathable knit upper with a plush ride. Built for long days.',
    descriptionAr: 'جزء علوي مُحبوك وقابل للتنفس مع ركوب مريح للأيام الطويلة.',
    sizes: [40,41,42,43,44,45].map(s => ({ size: s, qty: 2 })), updatedAt: Date.now(),
  },
  {
    id: 'cs-04', name: 'Trail Grip', nameAr: 'تريل غريب',
    price: 109, tag: 'Outdoor ready', tagAr: 'جاهز للخارج',
    description: 'Durable traction and a stable platform for city-to-trail adventures.',
    descriptionAr: 'جريب متين ومنصة ثابتة لمغامرات من المدينة إلى الطرق الوعرة.',
    sizes: [40,41,42,43,44].map(s => ({ size: s, qty: 2 })), updatedAt: Date.now(),
  },
]

const STORAGE_KEY = 'catchy.products.v2'  // bump version to clear old cache

function apiToProduct(p: ApiProduct): Product {
  return {
    id:            p.id,
    name:          p.nameEn,
    nameAr:        p.nameAr  || p.nameEn,
    price:         p.priceBhd,
    tag:           p.tagEn   || '',
    tagAr:         p.tagAr   || '',
    description:   p.descriptionEn || '',
    descriptionAr: p.descriptionAr || '',
    sizes:         parseSizes(p.sizes),
    imageUrl:      p.imageUrl ?? undefined,
    updatedAt:     p.updatedAt,
  }
}

function productToApi(p: Omit<Product, 'updatedAt'> & Partial<Pick<Product, 'updatedAt'>>): ApiProduct {
  return {
    id:            p.id,
    nameEn:        p.name,
    nameAr:        p.nameAr  || '',
    priceBhd:      p.price,
    tagEn:         p.tag     || '',
    tagAr:         p.tagAr   || '',
    descriptionEn: p.description || '',
    descriptionAr: p.descriptionAr || '',
    sizes:         p.sizes,           // stored as SizeStock[] JSON
    imageUrl:      p.imageUrl ?? null,
    updatedAt:     p.updatedAt ?? Date.now(),
  }
}

function loadLocal(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return SEED
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return SEED
    // Migrate any old-format products in cache
    return (parsed as Product[]).map(p => ({
      ...p,
      sizes: parseSizes(p.sizes),
    }))
  } catch {
    return SEED
  }
}

function slugId(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

type ProductsApi = {
  products:     Product[]
  loading:      boolean
  getById:      (id: string) => Product | undefined
  getLocalName: (p: Product, lang: 'en' | 'ar') => string
  upsert:       (p: Omit<Product, 'updatedAt'> & Partial<Pick<Product, 'updatedAt'>>) => Promise<void>
  remove:       (id: string) => Promise<void>
  reset:        () => void
  suggestId:    (name: string) => string
  reload:       () => Promise<void>
}

const ProductsContext = createContext<ProductsApi | null>(null)

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(() => loadLocal())
  const [loading,  setLoading]  = useState(false)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiProducts.getAll()
      const mapped = data.map(apiToProduct)
      setProducts(mapped)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped))
    } catch {
      const local = loadLocal()
      setProducts(local)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { reload() }, [reload])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
  }, [products])

  const api = useMemo<ProductsApi>(() => ({
    products,
    loading,
    getById:      (id) => products.find((p) => p.id === id),
    getLocalName: (p, lang) => lang === 'ar' ? (p.nameAr || p.name) : p.name,
    upsert: async (p) => {
      const next: Product = { ...p, updatedAt: p.updatedAt ?? Date.now() }
      // Optimistic update — immediately visible in UI
      setProducts((cur) => {
        const idx = cur.findIndex((x) => x.id === next.id)
        if (idx === -1) return [next, ...cur]
        const copy = cur.slice(); copy[idx] = next; return copy
      })
      try {
        const isNew = !products.some((x) => x.id === next.id)
        if (isNew) await apiProducts.create(productToApi(next))
        else       await apiProducts.update({ ...productToApi(next), id: next.id })
        // Reload from DB so updatedAt, stock_qty, etc. reflect the real saved state
        await reload()
      } catch (e) { console.error('[products] upsert failed:', e) }
    },
    remove: async (id) => {
      // Optimistic remove — instantly gone from UI
      setProducts((cur) => cur.filter((p) => p.id !== id))
      try {
        await apiProducts.remove(id)
        await reload() // confirm deletion is reflected from DB
      } catch (e) { console.error('[products] remove failed:', e) }
    },
    reset:     () => setProducts(SEED),
    suggestId: (name) => {
      const base = slugId(name || 'product')
      const candidate = base ? `cs-${base}` : 'cs-product'
      if (!products.some((p) => p.id === candidate)) return candidate
      let i = 2
      while (products.some((p) => p.id === `${candidate}-${i}`)) i++
      return `${candidate}-${i}`
    },
    reload,
  }), [products, loading, reload])

  return <ProductsContext.Provider value={api}>{children}</ProductsContext.Provider>
}

export function useProducts() {
  const ctx = useContext(ProductsContext)
  if (!ctx) throw new Error('useProducts must be used within ProductsProvider')
  return ctx
}
