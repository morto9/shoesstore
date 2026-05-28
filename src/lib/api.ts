/**
 * API Client - يتحدث مع Vercel serverless functions
 * في التطوير: يستخدم localStorage كـ fallback
 * في الإنتاج: يستخدم /api/*
 */

const BASE = import.meta.env.VITE_API_BASE ?? ''

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

// ===== PRODUCTS =====
export const apiProducts = {
  getAll: () => request<ApiProduct[]>('/api/products'),
  create: (data: ApiProduct) =>
    request<{ ok: boolean }>('/api/products', { method: 'POST', body: JSON.stringify(data) }),
  update: (data: Partial<ApiProduct> & { id: string }) =>
    request<{ ok: boolean }>('/api/products', { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: string) =>
    request<{ ok: boolean }>('/api/products', { method: 'DELETE', body: JSON.stringify({ id }) }),
}

// ===== ORDERS =====
export const apiOrders = {
  getAll: () => request<ApiOrder[]>('/api/orders'),
  create: (data: CreateOrderPayload) =>
    request<{ ok: boolean; id: string }>('/api/orders', { method: 'POST', body: JSON.stringify(data) }),
  update: (data: { id: string; status?: string; paid?: boolean; whatsappSent?: boolean }) =>
    request<{ ok: boolean }>('/api/orders', { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: string) =>
    request<{ ok: boolean }>('/api/orders', { method: 'DELETE', body: JSON.stringify({ id }) }),
}

// ===== AUTH =====
export const apiAuth = {
  login: (password: string) =>
    request<{ ok: boolean; error?: string }>('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),
}

// ===== ADMIN STATS =====
export const apiAdmin = {
  stats: () => request<AdminStats>('/api/admin/stats'),
}

// ===== TYPES =====
export interface ApiProduct {
  id:            string
  nameEn:        string
  nameAr:        string
  priceBhd:      number
  tagEn:         string
  tagAr:         string
  descriptionEn: string
  descriptionAr: string
  sizes:         Array<{ size: number; qty: number }>   // per-size quantities
  imageUrl:      string | null
  updatedAt:     number
}

export interface ApiOrderLine {
  productId:    string
  productName:  string
  size:         number
  qty:          number
  secondSize:   number | null
  unitPriceBHD: number
}

export interface ApiOrder {
  id:          string
  createdAt:   number
  status:      string
  paid:        boolean
  whatsappSent: boolean
  payment: {
    method:    string
    codFeeBHD: number
    paid:      boolean
  }
  delivery: {
    country:     string
    city:        string
    addressLine: string
    notes?:      string
    phone:       string
    fullName:    string
  }
  lines:       ApiOrderLine[]
  subtotalBHD: number
  totalBHD:    number
}

export interface CreateOrderPayload {
  id:          string
  country:     string
  city:        string
  addressLine: string
  notes?:      string | null
  phone:       string
  fullName:    string
  codFeeBhd:   number
  subtotalBhd: number
  totalBhd:    number
  lines: Array<{
    productId:    string
    productName:  string
    size:         number
    qty:          number
    secondSize?:  number | null
    unitPriceBhd: number
  }>
}

export interface AdminStats {
  totalOrdersThisMonth: number
  totalRevenue:         number
  newOrders:            number
  inDelivery:           number
  recentOrders:         Array<{
    id:         string
    full_name:  string
    total_bhd:  string
    status:     string
    created_at: string
    phone:      string
  }>
  byStatus:      Record<string, number>
  dailyRevenue:  Array<{ day: string; revenue: number; ordersCount: number }>
}
