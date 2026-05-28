/**
 * Admin section — completely separate from customer routes.
 * Wrapped by AdminGate (password protection) in App.tsx.
 */
import React from 'react'
import { useI18n } from '../i18n/i18n'
import { type Product as StoreProduct, useProducts, totalStock } from '../store/products'
import { useRegion } from '../store/region'
import { type OrderStatus, useOrders } from '../store/orders'
import { buildCustomerWhatsAppUrl } from '../lib/whatsapp'
import { ADMIN_SESSION_KEY } from './AdminGate'

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/** Compress an image client-side to ≤700px JPEG before storing as base64 */
function compressImage(file: File, maxPx = 700, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objUrl = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height, 1))
      const w = Math.round(img.width  * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(objUrl)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => { URL.revokeObjectURL(objUrl); reject(new Error('Image load failed')) }
    img.src = objUrl
  })
}

function statusColor(s: OrderStatus) {
  const map: Record<string, string> = {
    new:         'bg-blue-500/15 text-blue-300 border-blue-500/25',
    approved:    'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
    processing:  'bg-yellow-500/15 text-yellow-300 border-yellow-500/25',
    processed:   'bg-orange-500/15 text-orange-300 border-orange-500/25',
    on_delivery: 'bg-purple-500/15 text-purple-300 border-purple-500/25',
    delivered:   'bg-teal-500/15 text-teal-300 border-teal-500/25',
    paid:        'bg-green-500/15 text-green-300 border-green-500/25',
    cancelled:   'bg-red-500/15 text-red-300 border-red-500/25',
  }
  return map[s] ?? 'bg-white/5 text-white/60 border-white/10'
}

function exportOrdersCSV(orders: ReturnType<typeof useOrders>['orders']) {
  const header = ['ID', 'Date', 'Status', 'Name', 'Phone', 'Country', 'City', 'Address', 'Total BHD', 'Paid', 'WhatsApp Sent']
  const rows = orders.map((o) => [
    o.id,
    new Date(o.createdAt).toLocaleDateString('en-GB'),
    o.status,
    o.delivery.fullName,
    o.delivery.phone,
    o.delivery.country,
    o.delivery.city,
    `"${o.delivery.addressLine}"`,
    o.totalBHD.toFixed(3),
    o.payment.paid ? 'Yes' : 'No',
    o.whatsappSent ? 'Yes' : 'No',
  ])
  const csv = [header, ...rows].map((r) => r.join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const a = Object.assign(document.createElement('a'), {
    href: url,
    download: `catchy-orders-${new Date().toISOString().slice(0, 10)}.csv`,
  })
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─── ADMIN SHELL ─────────────────────────────────────────────────────────────
/** Minimal header for admin — no cart, no customer nav. */
function AdminShell({ children }: { children: React.ReactNode }) {
  const { lang, setLang, dir } = useI18n()

  function logout() {
    sessionStorage.removeItem(ADMIN_SESSION_KEY)
    window.location.reload()
  }

  return (
    <div className="min-h-dvh" dir={dir}>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/30 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          {/* Brand + badge */}
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
              <img
                src="Logo.png"
                alt="Shoe Store"
                className="h-8 w-8 rounded-lg bg-white/90 p-1 ring-1 ring-[var(--brand)]/35"
                loading="eager"
              />
              <span className="text-sm font-semibold tracking-tight">Shoe Store</span>
            </a>
            <span className="rounded-full border border-[var(--brand)]/40 bg-[var(--brand)]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--brand)]">
              Admin
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Language toggle */}
            <select
              className="rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs text-white/90 outline-none"
              value={lang}
              onChange={(e) => setLang(e.target.value === 'ar' ? 'ar' : 'en')}
              aria-label="Language"
            >
              <option value="en">EN</option>
              <option value="ar">AR</option>
            </select>
            {/* View store */}
            <a
              href="/shop"
              className="hidden rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10 hover:text-white transition-colors sm:inline-block"
            >
              ← Store
            </a>
            {/* Logout */}
            <button
              type="button"
              onClick={logout}
              className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/20 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  )
}

// ─── ADMIN ORDERS ─────────────────────────────────────────────────────────────
function AdminOrders() {
  const { t, lang } = useI18n()
  const { formatMoney } = useRegion()
  const { orders, updateStatus, setPaid, setWhatsappSent } = useOrders()
  const [selected,      setSelected]      = React.useState<string | null>(orders[0]?.id ?? null)
  const [searchQuery,   setSearchQuery]   = React.useState('')
  const [filterStatus,  setFilterStatus]  = React.useState<string>('all')

  React.useEffect(() => {
    if (!selected && orders[0]?.id) setSelected(orders[0].id)
    if (selected && !orders.some((o) => o.id === selected)) setSelected(orders[0]?.id ?? null)
  }, [orders, selected])

  const filteredOrders = React.useMemo(() => {
    return orders.filter(o => {
      const matchSearch = !searchQuery || [
        o.id, o.delivery.fullName, o.delivery.phone, o.delivery.city,
      ].some(v => v.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchStatus = filterStatus === 'all' || o.status === filterStatus
      return matchSearch && matchStatus
    })
  }, [orders, searchQuery, filterStatus])

  const current = orders.find((o) => o.id === selected) ?? null

  const ORDER_STATUSES: OrderStatus[] = ['new', 'approved', 'processing', 'processed', 'on_delivery', 'delivered', 'paid', 'cancelled']

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      {/* القائمة الجانبية للطلبات */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-4 space-y-3">
        {/* Search & Filter */}
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('admin.orders.search')}
          className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-[var(--brand)]/40"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none focus:border-[var(--brand)]/40"
        >
          <option value="all">{t('admin.orders.filter')} — الكل</option>
          {ORDER_STATUSES.map(s => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
        </select>

        <div className="text-xs text-white/50">{filteredOrders.length} / {orders.length}</div>

        {orders.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-center">
            <div className="text-3xl mb-2">📭</div>
            <div className="text-white/70 text-sm">{t('admin.orders.none')}</div>
          </div>
        ) : (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {filteredOrders.map((o) => (
              <button key={o.id} type="button" onClick={() => setSelected(o.id)}
                className={['w-full rounded-2xl border px-3 py-3 text-start transition',
                  o.id === selected ? 'border-white/20 bg-white/10' : 'border-white/10 bg-black/20 hover:bg-white/10'].join(' ')}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="font-medium text-white text-sm">#{o.id}</div>
                  <div className="text-xs text-white/70">{formatMoney(o.totalBHD)}</div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs text-white/50 truncate">{o.delivery.fullName}</div>
                  <span className={`text-[10px] rounded-full border px-2 py-0.5 ${statusColor(o.status)}`}>
                    {t(`status.${o.status}`)}
                  </span>
                </div>
                {o.whatsappSent && <div className="mt-1 text-[10px] text-green-400">{t('admin.orders.whatsapp.badge')}</div>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* تفاصيل الطلب */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        {!current ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="text-4xl">📋</div>
            <div className="text-white/70">{t('admin.orders.none')}</div>
          </div>
        ) : (
          <div className="grid gap-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs text-white/60">{t('admin.orders.details')}</div>
                <div className="text-xl font-semibold text-white">#{current.id}</div>
                <div className="text-xs text-white/50">{new Date(current.createdAt).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-GB')}</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={current.status}
                  onChange={(e) => updateStatus(current.id, e.target.value as OrderStatus)}
                  className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none"
                >
                  {ORDER_STATUSES.map((s) => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
                </select>
                <button type="button" onClick={() => setPaid(current.id, !current.payment.paid)}
                  className={['rounded-xl border px-3 py-2 text-xs font-medium transition',
                    current.payment.paid
                      ? 'border-green-500/30 bg-green-500/10 text-green-300 hover:bg-green-500/20'
                      : 'border-white/15 bg-white/5 text-white hover:bg-white/10'].join(' ')}>
                  {current.payment.paid ? t('admin.orders.markUnpaid') : t('admin.orders.markPaid')}
                </button>
              </div>
            </div>

            {/* العميل + التوصيل */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs text-white/50 mb-2">{t('admin.orders.customer')}</div>
                <div className="font-semibold text-white">{current.delivery.fullName}</div>
                <div className="text-sm text-white/70 mt-1">{current.delivery.phone}</div>
                <a
                  href={buildCustomerWhatsAppUrl(current.delivery.phone, `#${current.id}`)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setWhatsappSent(current.id, true)}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-green-500/25 bg-green-500/10 px-3 py-1.5 text-xs text-green-300 hover:bg-green-500/20"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  {t('admin.orders.whatsapp')}
                </a>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs text-white/50 mb-2">{t('admin.orders.delivery')}</div>
                <div className="text-sm font-medium text-white">{t(`country.${current.delivery.country.toLowerCase()}` as `country.${string}`)} • {current.delivery.city}</div>
                <div className="text-sm text-white/70 mt-1">{current.delivery.addressLine}</div>
                {current.delivery.notes && <div className="mt-2 text-xs text-white/50 italic">{current.delivery.notes}</div>}
              </div>
            </div>

            {/* عناصر الطلب */}
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="mb-3 text-xs text-white/50">{t('admin.orders.items')}</div>
              <div className="space-y-2">
                {current.lines.map((l, idx) => (
                  <div key={`${l.productId}-${idx}`} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-white text-sm">{l.productName}</div>
                      <div className="text-xs text-white/50">
                        {t('cart.size')}: {l.size}
                        {l.secondSize != null ? ` + تجربة: ${l.secondSize}` : ''} • ×{l.qty}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-white">{formatMoney(l.unitPriceBHD * l.qty)}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 h-px bg-white/10" />
              <div className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between text-white/60">
                  <span>{t('checkout.subtotal')}</span>
                  <span>{formatMoney(current.subtotalBHD)}</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>{t('checkout.codFee')}</span>
                  <span>{formatMoney(current.payment.codFeeBHD)}</span>
                </div>
                <div className="flex justify-between font-semibold text-white border-t border-white/10 pt-2 mt-2">
                  <span>{t('admin.orders.total')}</span>
                  <span>{formatMoney(current.totalBHD)}</span>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3 text-xs">
                <span className={current.payment.paid ? 'text-green-400' : 'text-white/50'}>
                  {current.payment.paid ? '✓ مدفوع' : '○ غير مدفوع'}
                </span>
                <span className={current.whatsappSent ? 'text-green-400' : 'text-white/50'}>
                  {current.whatsappSent ? '✓ واتساب أُرسل' : '○ لم يُرسل عبر واتساب'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── ADMIN (products dashboard) ───────────────────────────────────────────────
export default function Admin() {
  const { t } = useI18n()
  const { products, upsert, remove, reset, suggestId } = useProducts()
  const { formatMoney } = useRegion()
  const { orders, clearAll } = useOrders()
  const [tab, setTab] = React.useState<'products' | 'orders'>('products')
  const [selectedId, setSelectedId] = React.useState<string | null>(products[0]?.id ?? null)
  const selected = React.useMemo(() => products.find((p) => p.id === selectedId) ?? null, [products, selectedId])
  const [draft, setDraft] = React.useState<StoreProduct | null>(selected)
  const [imgUploading, setImgUploading] = React.useState(false)

  React.useEffect(() => { setDraft(selected) }, [selectedId, selected])

  function set<K extends keyof StoreProduct>(key: K, value: StoreProduct[K]) {
    setDraft((d) => (d ? { ...d, [key]: value } : d))
  }

  function startNew() {
    const id = suggestId('new-product')
    const p: StoreProduct = {
      id, name: 'New Product', nameAr: '', price: 79, tag: 'New', tagAr: '',
      description: '', descriptionAr: '',
      sizes: [40, 41, 42, 43].map(s => ({ size: s, qty: 5 })),
      updatedAt: Date.now(),
    }
    setSelectedId(id); setDraft(p)
  }

  async function onSave() {
    if (!draft) return
    const clean: StoreProduct = {
      ...draft,
      id:            draft.id.trim(),
      name:          draft.name.trim(),
      nameAr:        (draft.nameAr || '').trim(),
      tag:           draft.tag.trim(),
      tagAr:         (draft.tagAr || '').trim(),
      description:   draft.description.trim(),
      descriptionAr: (draft.descriptionAr || '').trim(),
      imageUrl:      draft.imageUrl?.trim() || undefined,
      price:         Number.isFinite(draft.price) ? Number(draft.price) : 0,
      sizes: Array.isArray(draft.sizes)
        ? draft.sizes
            .filter((s) => Number.isFinite(s.size) && Number.isFinite(s.qty))
            .map((s) => ({ size: Math.floor(s.size), qty: Math.max(0, Math.floor(s.qty)) }))
            .sort((a, b) => a.size - b.size)
        : [],
      updatedAt: Date.now(),
    }
    await upsert(clean)
    setSelectedId(clean.id)
  }

  async function onDelete() {
    if (!draft) return
    await remove(draft.id)
    setSelectedId((prev) => { const rest = products.filter((p) => p.id !== prev); return rest[0]?.id ?? null })
  }

  const statsData = React.useMemo(() => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
    const monthOrders = orders.filter(o => o.createdAt >= startOfMonth)
    return {
      total:    monthOrders.length,
      revenue:  orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.totalBHD, 0),
      newCount: orders.filter(o => o.status === 'new').length,
      delivery: orders.filter(o => o.status === 'on_delivery').length,
    }
  }, [orders])

  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">{t('admin.title')}</h2>
          <p className="text-sm text-white/60">{t('admin.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex overflow-hidden rounded-xl border border-white/10 bg-black/20">
            {(['products', 'orders'] as const).map(tabKey => (
              <button key={tabKey} type="button" onClick={() => setTab(tabKey)}
                className={['px-4 py-2 text-sm font-medium', tab === tabKey ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/10'].join(' ')}>
                {t(`admin.tab.${tabKey}`)}
                {tabKey === 'orders' && orders.length > 0 && (
                  <span className="ms-2 rounded-full bg-[var(--brand)] px-1.5 py-0.5 text-xs font-semibold text-[var(--ink)]">{orders.length}</span>
                )}
              </button>
            ))}
          </div>
          {tab === 'products' ? (
            <>
              <button onClick={startNew} className="rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-medium text-[var(--ink)] hover:bg-[var(--brand-2)]" type="button">
                {t('admin.new')}
              </button>
              <button onClick={() => { reset(); setSelectedId('cs-01') }} className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10" type="button">
                {t('admin.reset')}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => exportOrdersCSV(orders)} className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10" type="button" disabled={!orders.length}>
                {t('admin.orders.export')}
              </button>
              <button onClick={clearAll} className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 hover:bg-red-500/15" type="button" disabled={!orders.length}>
                {t('admin.orders.clear')}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: t('admin.stats.total'),    value: statsData.total,            icon: '📦', color: 'border-blue-500/20 bg-blue-500/10' },
          { label: t('admin.stats.revenue'),  value: formatMoney(statsData.revenue), icon: '💰', color: 'border-green-500/20 bg-green-500/10' },
          { label: t('admin.stats.new'),      value: statsData.newCount,         icon: '🆕', color: 'border-orange-500/20 bg-orange-500/10' },
          { label: t('admin.stats.delivery'), value: statsData.delivery,         icon: '🚚', color: 'border-purple-500/20 bg-purple-500/10' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border ${s.color} p-4`}>
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-white/60 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {tab === 'products' ? (
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* قائمة المنتجات */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="mb-3 text-xs text-white/60">{products.length} {t('admin.tab.products')}</div>
            <div className="space-y-2">
              {products.map((p) => (
                <button key={p.id} type="button" onClick={() => setSelectedId(p.id)}
                  className={['w-full rounded-2xl border px-3 py-3 text-start transition',
                    p.id === selectedId ? 'border-white/20 bg-white/10' : 'border-white/10 bg-black/20 hover:bg-white/10'].join(' ')}>
                  <div className="flex items-center gap-2">
                    {p.imageUrl ? <img src={p.imageUrl} alt="" className="h-8 w-8 rounded-lg object-cover border border-white/10 flex-shrink-0" /> : <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center text-sm flex-shrink-0">👟</div>}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <div className="font-medium text-white truncate">{p.name}</div>
                        <div className="text-xs text-white/60 flex-shrink-0">{formatMoney(p.price)}</div>
                      </div>
                      <div className="text-xs text-white/40">{p.id} • {totalStock(p)} pcs</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* فورم التعديل */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            {!draft ? (
              <div className="text-white/70">{t('admin.select')}</div>
            ) : (
              <div className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-1">
                    <span className="text-xs text-white/60">{t('admin.form.id')}</span>
                    <input value={draft.id} onChange={(e) => set('id', e.target.value)} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-white outline-none focus:border-[var(--brand)]/50" />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs text-white/60">{t('admin.form.price')}</span>
                    <input inputMode="decimal" value={String(draft.price)} onChange={(e) => set('price', Number(e.target.value))} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-white outline-none focus:border-[var(--brand)]/50" />
                  </label>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-1">
                    <span className="text-xs text-white/60">{t('admin.form.name')}</span>
                    <input value={draft.name} onChange={(e) => set('name', e.target.value)} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-white outline-none focus:border-[var(--brand)]/50" />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs text-white/60">{t('admin.form.nameAr')}</span>
                    <input value={draft.nameAr || ''} onChange={(e) => set('nameAr', e.target.value)} dir="rtl" className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-white outline-none focus:border-[var(--brand)]/50" placeholder="مثل: نيمبوس رانر" />
                  </label>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-1">
                    <span className="text-xs text-white/60">{t('admin.form.tag')}</span>
                    <input value={draft.tag} onChange={(e) => set('tag', e.target.value)} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-white outline-none focus:border-[var(--brand)]/50" />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs text-white/60">{t('admin.form.tagAr')}</span>
                    <input value={draft.tagAr || ''} onChange={(e) => set('tagAr', e.target.value)} dir="rtl" className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-white outline-none focus:border-[var(--brand)]/50" />
                  </label>
                </div>
                {/* ─── Sizes & Quantities ──────────────────────────────── */}
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/60">{t('admin.form.sizes')} &amp; {t('admin.form.stock')}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const maxSize = draft.sizes.length > 0 ? Math.max(...draft.sizes.map(s => s.size)) : 39
                        set('sizes', [...draft.sizes, { size: maxSize + 1, qty: 5 }])
                      }}
                      className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70 hover:bg-white/10"
                    >
                      + {t('admin.form.sizes.add')}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {draft.sizes.map((s, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <div className="grid gap-0.5">
                            <span className="text-[10px] text-white/40">{t('admin.form.size')}</span>
                            <input
                              inputMode="numeric"
                              value={String(s.size)}
                              onChange={(e) => {
                                const v = Number(e.target.value)
                                const next = draft.sizes.map((x, i) => i === idx ? { ...x, size: Number.isFinite(v) ? v : x.size } : x)
                                set('sizes', next)
                              }}
                              className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-white outline-none focus:border-[var(--brand)]/50"
                            />
                          </div>
                          <div className="grid gap-0.5">
                            <span className="text-[10px] text-white/40">{t('admin.form.qty')}</span>
                            <input
                              inputMode="numeric"
                              value={String(s.qty)}
                              onChange={(e) => {
                                const v = Number(e.target.value)
                                const next = draft.sizes.map((x, i) => i === idx ? { ...x, qty: Number.isFinite(v) ? Math.max(0, Math.floor(v)) : x.qty } : x)
                                set('sizes', next)
                              }}
                              className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-white outline-none focus:border-[var(--brand)]/50"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => set('sizes', draft.sizes.filter((_, i) => i !== idx))}
                          className="mt-4 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-red-400 hover:bg-red-500/10"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {draft.sizes.length === 0 && (
                      <div className="text-xs text-white/40 py-2">{t('admin.form.sizes.empty')}</div>
                    )}
                  </div>
                  <div className="text-xs text-white/40">{t('admin.form.stock.total')}: {totalStock(draft)}</div>
                </div>
                <label className="grid gap-1">
                  <span className="text-xs text-white/60">{t('admin.form.image')}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={imgUploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setImgUploading(true)
                      try {
                        const compressed = await compressImage(file)
                        set('imageUrl', compressed)
                      } catch {
                        alert('Could not process image. Try a different file.')
                      } finally {
                        setImgUploading(false)
                      }
                    }}
                    className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-white outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-2 file:py-1 file:text-xs file:text-white disabled:opacity-50"
                  />
                  {imgUploading && (
                    <p className="mt-1 text-xs text-white/50 animate-pulse">⏳ Processing image…</p>
                  )}
                  {draft.imageUrl && !imgUploading && (
                    <img src={draft.imageUrl} alt="Preview" className="mt-2 h-20 w-20 rounded-xl object-cover border border-white/10" />
                  )}
                </label>
                <label className="grid gap-1">
                  <span className="text-xs text-white/60">{t('admin.form.desc')}</span>
                  <textarea value={draft.description} onChange={(e) => set('description', e.target.value)} className="min-h-24 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-white outline-none focus:border-[var(--brand)]/50" />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs text-white/60">{t('admin.form.descAr')}</span>
                  <textarea value={draft.descriptionAr || ''} onChange={(e) => set('descriptionAr', e.target.value)} dir="rtl" className="min-h-24 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-white outline-none focus:border-[var(--brand)]/50" placeholder="وصف المنتج بالعربي..." />
                </label>
                <div className="flex flex-wrap gap-2">
                  <button onClick={onSave} className="rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-medium text-[var(--ink)] hover:bg-[var(--brand-2)]" type="button">
                    {t('admin.save')}
                  </button>
                  <button onClick={onDelete} className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-100 hover:bg-red-500/15" type="button">
                    {t('admin.delete')}
                  </button>
                  <a className="ms-auto inline-flex items-center rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10" href={`/product/${draft.id}`}>
                    Preview →
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <AdminOrders />
      )}
    </AdminShell>
  )
}
