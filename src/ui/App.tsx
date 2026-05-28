import React from 'react'
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { useI18n } from '../i18n/i18n'
import { type Product as StoreProduct, useProducts, totalStock, sizeStock } from '../store/products'
import { useCart } from '../store/cart'
import { type GCCCountry, useRegion } from '../store/region'
import { useOrders } from '../store/orders'
import { buildOrderMessage, openWhatsApp } from '../lib/whatsapp'
import AdminGate from './AdminGate'
import Admin from './AdminPage'

// ─── WHATSAPP CONFIG ──────────────────────────────────────────────────────────
const WA_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER ?? '97337751989'

const DIAL_CODES: Record<GCCCountry, string> = {
  BH: '+973', SA: '+966', KW: '+965', QA: '+974', AE: '+971', OM: '+968',
}

// ─── SHELL ────────────────────────────────────────────────────────────────────
function Shell({ children }: { children: React.ReactNode }) {
  const { lang, setLang, t, dir } = useI18n()
  const { totalItems } = useCart()
  const [cartOpen, setCartOpen] = React.useState(false)
  const { country, setCountry } = useRegion()
  return (
    <div className="min-h-dvh" dir={dir}>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/25 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <a href="/" className="flex items-center gap-3">
            <img
              src="\public\Logo.png"
              alt={t('brand.name')}
              className="h-9 w-9 rounded-lg bg-white/90 p-1 ring-1 ring-[var(--brand)]/35"
              loading="eager"
              decoding="async"
            />
            <span className="flex flex-col leading-tight">
              <span className="text-lg font-semibold tracking-tight">{t('brand.name')}</span>
              <span className="text-xs text-white/60">{t('brand.tag')}</span>
            </span>
          </a>
          <nav className="flex items-center gap-4 text-sm text-white/80">
            <a className="hidden hover:text-white sm:inline" href="/shop">{t('nav.shop')}</a>
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative rounded-xl border border-[var(--brand)]/25 bg-white/5 px-3 py-1.5 text-xs text-white/90 hover:bg-white/10"
              aria-label={t('cart.title')}
            >
              {t('cart.title')}
              {totalItems > 0 && (
                <span className="ms-2 inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--brand)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--ink)] animate-pulse">
                  {totalItems}
                </span>
              )}
            </button>
            <div className="hidden items-center gap-2 md:flex">
              <select
                className="rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs text-white/90 outline-none"
                value={country}
                onChange={(e) => setCountry(e.target.value as GCCCountry)}
              >
                <option value="BH">{t('country.bh')}</option>
                <option value="SA">{t('country.sa')}</option>
                <option value="KW">{t('country.kw')}</option>
                <option value="QA">{t('country.qa')}</option>
                <option value="AE">{t('country.ae')}</option>
                <option value="OM">{t('country.om')}</option>
              </select>
            </div>
            <select
              className="rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs text-white/90 outline-none"
              value={lang}
              onChange={(e) => setLang(e.target.value === 'ar' ? 'ar' : 'en')}
              aria-label={t('nav.lang')}
            >
              <option value="en">{t('lang.en')}</option>
              <option value="ar">{t('lang.ar')}</option>
            </select>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">{children}</main>

      <footer className="border-t border-white/10 py-10 text-sm text-white/60">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 md:grid-cols-2 md:items-start">
          <div className="flex flex-col gap-2">
            <div className="text-white/80">{t('footer.line1')}</div>
            <div>{t('footer.line2')}</div>
          </div>
          <div className="flex flex-col gap-2 md:items-end">
            <div className="text-white/80">{t('footer.contact')}</div>
            <div className="flex flex-wrap gap-2 md:justify-end">
              <a
                className="flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm font-medium text-green-300 hover:bg-green-500/20"
                href={`https://wa.me/${WA_NUMBER}`}
                target="_blank"
                rel="noreferrer"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                {t('footer.whatsapp')}
              </a>
              <a
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
                href="https://www.instagram.com/catchy__step/"
                target="_blank"
                rel="noreferrer"
              >
                {t('footer.instagram')}
              </a>
            </div>
          </div>
        </div>
      </footer>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  )
}

// ─── CART DRAWER ──────────────────────────────────────────────────────────────
function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, dir, lang } = useI18n()
  const { getById } = useProducts()
  const { items, setQty, remove, clear } = useCart()
  const navigate = useNavigate()
  const { formatMoney } = useRegion()
  // const { create, setWhatsappSent } = useOrders()
  // const { country: defaultCountry } = useRegion()

  const lines = items
    .map((i) => {
      const p = getById(i.productId)
      return p ? { key: `${i.productId}__${i.size}`, product: p, item: i } : null
    })
    .filter(Boolean) as Array<{ key: string; product: StoreProduct; item: { productId: string; size: number; qty: number } }>

  const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.item.qty, 0)

  // واتساب سريع من السلة (بدون بيانات توصيل كاملة)
  // async function handleQuickWhatsApp() {
  //   if (lines.length === 0) return
  //   const order = await create({
  //     payment: { method: 'cod', codFeeBHD: 2, paid: false },
  //     delivery: { country: defaultCountry, city: '—', addressLine: '—', phone: '—', fullName: 'عميل واتساب' },
  //     lines: lines.map(l => ({
  //       productId: l.item.productId,
  //       productName: lang === 'ar' ? (l.product.nameAr || l.product.name) : l.product.name,
  //       size: l.item.size,
  //       qty: l.item.qty,
  //       unitPriceBHD: l.product.price,
  //     })),
  //     subtotalBHD: subtotal,
  //     totalBHD: subtotal + 2,
  //   })
  //   const msg = buildOrderMessage(order, lang)
  //   openWhatsApp(WA_NUMBER, msg)
  //   await setWhatsappSent(order.id, true)
  //   clear()
  //   onClose()
  // }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100]">
      <button type="button" onClick={onClose} className="absolute inset-0 bg-black/60" aria-label="Close" />
      <aside
        className={[
          'absolute top-0 h-full w-full max-w-md border-white/10 bg-[#0a0b13] shadow-2xl',
          dir === 'rtl' ? 'left-0 border-r' : 'right-0 border-l',
        ].join(' ')}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
            <div className="text-base font-semibold text-white">{t('cart.title')}</div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/90 hover:bg-white/10"
            >
              {t('common.close')}
            </button>
          </div>

          <div className="flex-1 overflow-auto p-5">
            {lines.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
                <div className="text-3xl">🛒</div>
                <div className="text-white/70">{t('cart.empty')}</div>
              </div>
            ) : (
              <div className="space-y-3">
                {lines.map((l) => {
                  const maxQty = Math.max(0, sizeStock(l.product, l.item.size))
                  const displayName = lang === 'ar' ? (l.product.nameAr || l.product.name) : l.product.name
                  return (
                    <div key={l.key} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-start justify-between gap-3">
                        {l.product.imageUrl ? (
                          <img
                            src={l.product.imageUrl}
                            alt={displayName}
                            className="h-14 w-14 rounded-xl object-cover border border-white/10 flex-shrink-0"
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-14 w-14 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-xl flex-shrink-0">
                            👟
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium text-white">{displayName}</div>
                          <div className="mt-0.5 text-xs text-white/60">
                            {t('cart.size')}: {l.item.size} • {formatMoney(l.product.price)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(l.item.productId, l.item.size)}
                          className="rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-xs text-white/70 hover:bg-red-500/15 hover:text-red-300 flex-shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="inline-flex items-center overflow-hidden rounded-xl border border-white/10 bg-black/20">
                          <button type="button" onClick={() => setQty(l.item.productId, l.item.size, l.item.qty - 1, { maxQty })} className="px-3 py-1.5 text-white/80 hover:bg-white/10">−</button>
                          <div className="w-10 text-center text-sm text-white">{l.item.qty}</div>
                          <button type="button" onClick={() => setQty(l.item.productId, l.item.size, l.item.qty + 1, { maxQty })} className="px-3 py-1.5 text-white/80 hover:bg-white/10">+</button>
                        </div>
                        <div className="text-sm font-semibold text-white">{formatMoney(l.product.price * l.item.qty)}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="border-t border-white/10 p-5 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="text-white/60">{t('checkout.subtotal')}</div>
              <div className="font-semibold text-white">{formatMoney(subtotal)}</div>
            </div>
            {/* زر واتساب السريع */}
            {/* <button
              type="button"
              onClick={handleQuickWhatsApp}
              disabled={lines.length === 0}
              className="w-full rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-2.5 text-sm font-semibold text-green-300 hover:bg-green-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {t('cart.whatsapp')}
            </button> */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={clear}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
                disabled={items.length === 0}
              >
                {t('cart.clear')}
              </button>
              <button
                type="button"
                className="ms-auto rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-medium text-[var(--ink)] hover:bg-[var(--brand-2)] disabled:opacity-60"
                disabled={items.length === 0}
                onClick={() => { onClose(); navigate('/checkout') }}
              >
                {t('cart.checkout')}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}

// ─── HOME ─────────────────────────────────────────────────────────────────────
function Home() {
  const { t } = useI18n()
  return (
    <Shell>
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div className="space-y-5">
          <p className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">
            {t('home.badge')}
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
            {t('home.title1')}
            <span className="text-white/70"> {t('home.title2')}</span>
          </h1>
          <p className="max-w-prose text-white/70">{t('home.body')}</p>
          <div className="flex flex-wrap gap-3">
            <a href="/shop" className="rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-medium text-[var(--ink)] hover:bg-[var(--brand-2)]">
              {t('home.cta.shop')}
            </a>
            {/* <a href="/about" className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10">
              {t('home.cta.why')}
            </a> */}
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="mb-5 flex items-center gap-3">
            <img src="\public\Logo.png" alt={t('brand.name')} className="h-12 w-12 rounded-2xl bg-white/90 p-2" loading="lazy" decoding="async" />
            <div>
              <div className="font-medium text-white">{t('brand.name')}</div>
              <div className="text-sm text-white/60">{t('footer.line2')}</div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {([
              { k: t('home.card.ship'), v: t('home.card.ship2'), icon: '🚚' },
              { k: t('home.card.returns'), v: t('home.card.returns2'), icon: '🔄' },
              { k: t('home.card.secure'), v: t('home.card.secure2'), icon: '💬' },
              { k: t('home.card.support'), v: t('home.card.support2'), icon: '⚡' },
            ]).map((x) => (
              <div key={x.k} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-white">
                <div className="text-xl mb-1">{x.icon}</div>
                <div className="text-sm font-medium">{x.k}</div>
                <div className="text-sm text-white/60">{x.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  )
}

// ─── SHOP ─────────────────────────────────────────────────────────────────────
function Shop() {
  const { t, lang } = useI18n()
  const { products, loading } = useProducts()
  const { formatMoney } = useRegion()
  const { add } = useCart()
  const [justAdded, setJustAdded] = React.useState<string | null>(null)

  function quickAdd(p: StoreProduct, e: React.MouseEvent) {
    e.preventDefault()
    const available = p.sizes.filter(s => s.qty > 0)
    if (available.length === 0) return
    const pick = available[Math.floor(available.length / 2)]
    add({ productId: p.id, size: pick.size, qty: 1 }, { maxQty: pick.qty })
    setJustAdded(p.id)
    setTimeout(() => setJustAdded(null), 1000)
  }

  return (
    <Shell>
      <div className="mb-8 flex items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">{t('shop.title')}</h2>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-4 animate-pulse">
              <div className="aspect-[4/3] rounded-xl bg-white/10" />
              <div className="mt-4 space-y-2">
                <div className="h-4 w-3/4 rounded bg-white/10" />
                <div className="h-3 w-1/2 rounded bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => {
            const displayName = lang === 'ar' ? (p.nameAr || p.name) : p.name
            const displayTag  = lang === 'ar' ? (p.tagAr  || p.tag)  : p.tag
            const outOfStock  = totalStock(p) <= 0
            const lowStock    = !outOfStock && totalStock(p) <= 3
            return (
              <a key={p.id} href={`/product/${p.id}`} className="group relative rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition">
                <div className="aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent relative">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={displayName} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl">👟</div>
                  )}
                  {outOfStock && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs font-medium text-white/80">
                      {t('shop.outofstock')}
                    </div>
                  )}
                  {!outOfStock && (
                    <button
                      type="button"
                      onClick={(e) => quickAdd(p, e)}
                      className="absolute bottom-2 end-2 rounded-xl bg-[var(--brand)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {justAdded === p.id ? '✓' : '+'}
                    </button>
                  )}
                </div>
                <div className="mt-4 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-white">{displayName}</div>
                    <div className="text-sm font-semibold text-white/90">{formatMoney(p.price)}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-white/60">{displayTag}</div>
                    {lowStock && (
                      <div className="text-xs text-orange-400">{t('shop.stock.low', { n: totalStock(p) })}</div>
                    )}
                  </div>
                  <div className="pt-1 text-sm text-white/60 group-hover:text-white transition-colors">
                    {t('shop.view')}
                  </div>
                </div>
              </a>
            )
          })}
        </div>
      )}
    </Shell>
  )
}

// ─── PRODUCT ──────────────────────────────────────────────────────────────────
function Product() {
  const { t, lang } = useI18n()
  const { id } = useParams()
  const { getById } = useProducts()
  const { add, getQty } = useCart()
  const { formatMoney } = useRegion()
  const p = (id ? getById(id) : undefined) as StoreProduct | undefined
  const [size, setSize]         = React.useState<number | null>(null)
  const [qty, setQty]           = React.useState<number>(1)
  const [justAdded, setJustAdded] = React.useState(false)

  React.useEffect(() => {
    if (!p) return
    // Default to first size that has stock; fall back to first size
    const first = p.sizes.find(s => s.qty > 0) ?? p.sizes[0]
    setSize(first?.size ?? null)
    setQty(1)
  }, [p?.id])

  React.useEffect(() => {
    if (!justAdded) return
    const tmr = window.setTimeout(() => setJustAdded(false), 1400)
    return () => window.clearTimeout(tmr)
  }, [justAdded])

  const displayName = p ? (lang === 'ar' ? (p.nameAr || p.name) : p.name) : t('product.title')
  const displayDesc = p ? (lang === 'ar' ? (p.descriptionAr || p.description) : p.description) : t('product.body')
  const displayTag  = p ? (lang === 'ar' ? (p.tagAr  || p.tag)  : p.tag)  : ''
  const selectedSizeQty = (p && size != null) ? sizeStock(p, size) : 0
  const isOutOfStock    = p ? totalStock(p) <= 0 : false
  const isLowStock      = p && !isOutOfStock && size != null ? selectedSizeQty > 0 && selectedSizeQty <= 3 : false

  return (
    <Shell>
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="mb-6 flex items-center gap-3">
          <a href="/shop" className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10">
            ← {t('product.back')}
          </a>
        </div>
        {p ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent">
              {p.imageUrl ? (
                <img src={p.imageUrl} alt={displayName} className="h-full w-full object-cover" loading="lazy" decoding="async" />
              ) : (
                <div className="flex h-full items-center justify-center text-7xl">👟</div>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-white">{displayName}</h2>
                <div className="mt-1 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                  {displayTag}
                </div>
              </div>
              <p className="text-white/70 text-sm leading-relaxed">{displayDesc}</p>
              <div className="text-3xl font-semibold tracking-tight text-white">{formatMoney(p.price)}</div>
              {isLowStock && (
                <div className="inline-flex items-center gap-1.5 rounded-xl border border-orange-500/25 bg-orange-500/10 px-3 py-1.5 text-xs text-orange-300">
                  ⚠️ {t('shop.stock.low', { n: selectedSizeQty })}
                </div>
              )}
              {isOutOfStock && (
                <div className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-xs text-red-300">
                  ✗ {t('product.outofstock')}
                </div>
              )}

              <div className="grid gap-4 pt-2">
                <div className="grid gap-2">
                  <div className="text-xs text-white/60">{t('product.size')}</div>
                  <div className="flex flex-wrap gap-2">
                    {p.sizes.map(({ size: s, qty: q }) => {
                      const active    = s === size
                      const noStock   = q <= 0
                      const lowStock  = !noStock && q <= 3
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => { if (!noStock) { setSize(s); setQty(1) } }}
                          disabled={noStock}
                          title={noStock ? t('shop.outofstock') : lowStock ? t('shop.stock.low', { n: q }) : undefined}
                          className={['relative rounded-xl border px-3 py-2 text-sm transition',
                            noStock
                              ? 'border-white/5 bg-black/10 text-white/25 cursor-not-allowed line-through'
                              : active
                                ? 'border-white/25 bg-white/15 text-white'
                                : 'border-white/10 bg-black/20 text-white/80 hover:bg-white/10',
                          ].join(' ')}
                        >
                          {s}
                          {lowStock && !noStock && (
                            <span className="absolute -top-1.5 -end-1.5 rounded-full bg-orange-500 px-1 text-[9px] font-bold text-white leading-4">
                              {q}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="grid gap-2">
                  <div className="text-xs text-white/60">{t('product.qty')}</div>
                  <div className="inline-flex w-fit items-center overflow-hidden rounded-xl border border-white/10 bg-black/20">
                    <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2 text-white/80 hover:bg-white/10" aria-label="−">−</button>
                    <input
                      value={String(qty)}
                      onChange={(e) => {
                        const n = Number(e.target.value)
                        if (!Number.isFinite(n)) return
                        setQty(Math.min(Math.max(1, Math.floor(n)), Math.max(1, selectedSizeQty)))
                      }}
                      className="w-14 bg-transparent px-2 py-2 text-center text-sm text-white outline-none"
                      inputMode="numeric"
                    />
                    <button type="button" onClick={() => setQty((q) => Math.min(Math.max(1, selectedSizeQty), q + 1))} className="px-3 py-2 text-white/80 hover:bg-white/10" aria-label="+">+</button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!p || size == null) return
                  const existing = getQty(p.id, size)
                  add({ productId: p.id, size, qty }, { maxQty: Math.max(0, selectedSizeQty) })
                  if (existing + qty > 0) setJustAdded(true)
                }}
                disabled={!p || size == null || isOutOfStock}
                className="rounded-xl bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--brand-2)] disabled:opacity-50 transition"
              >
                {justAdded ? t('cart.added') : isOutOfStock ? t('product.outofstock') : t('cart.add')}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center text-white/60 py-10">المنتج غير موجود</div>
        )}
      </div>
    </Shell>
  )
}

// ─── CHECKOUT ─────────────────────────────────────────────────────────────────
function Checkout() {
  const { t, dir, lang } = useI18n()
  const { items, clear } = useCart()
  const { getById, reload: reloadProducts } = useProducts()
  const { country: defaultCountry, formatMoney } = useRegion()
  const { create, setWhatsappSent } = useOrders()

  const codFee = 2

  const lines = items
    .map((i) => { const p = getById(i.productId); return p ? { item: i, product: p } : null })
    .filter(Boolean) as Array<{ item: { productId: string; size: number; qty: number }; product: StoreProduct }>

  const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.item.qty, 0)
  const total = subtotal + (lines.length > 0 ? codFee : 0)

  const [fullName, setFullName]   = React.useState('')
  const [phone, setPhone]         = React.useState('')
  const [country, setCountry]     = React.useState<GCCCountry>(defaultCountry)
  const [city, setCity]           = React.useState('')
  const [addressLine, setAddrLine] = React.useState('')
  const [notes, setNotes]         = React.useState('')
  const [secondSizes, setSecondSizes] = React.useState<Record<string, number | null>>({})
  const [submitting, setSubmitting] = React.useState(false)
  const [confirmedOrder, setConfirmedOrder] = React.useState<ReturnType<typeof useOrders>['orders'][0] | null>(null)

  React.useEffect(() => {
    if (items.length === 0 && !confirmedOrder) setSecondSizes({})
  }, [items.length])

  function lineKey(productId: string, size: number) { return `${productId}__${size}` }

  const isFormValid = !!(fullName.trim() && phone.trim() && city.trim() && addressLine.trim() && lines.length > 0)

  async function placeOrder() {
    if (!isFormValid || submitting) return
    setSubmitting(true)
    try {
      const order = await create({
        payment: { method: 'cod', codFeeBHD: codFee, paid: false },
        delivery: {
          country,
          city: city.trim(),
          addressLine: addressLine.trim(),
          notes: notes.trim() || undefined,
          phone: phone.trim(),
          fullName: fullName.trim(),
        },
        lines: lines.map((l) => {
          const key = lineKey(l.item.productId, l.item.size)
          return {
            productId: l.item.productId,
            productName: lang === 'ar' ? (l.product.nameAr || l.product.name) : l.product.name,
            size: l.item.size,
            qty: l.item.qty,
            secondSize: secondSizes[key] ?? null,
            unitPriceBHD: l.product.price,
          }
        }),
        subtotalBHD: subtotal,
        totalBHD: total,
      })
      clear()
      setConfirmedOrder(order)
      // تحديث المخزون محلياً بعد الطلب
      reloadProducts().catch(() => {})
      // فتح واتساب تلقائياً على الموبايل
      setTimeout(() => {
        const msg = buildOrderMessage(order, lang)
        openWhatsApp(WA_NUMBER, msg)
        setWhatsappSent(order.id, true)
      }, 300)
    } finally {
      setSubmitting(false)
    }
  }

  // صفحة التأكيد بعد إرسال الطلب
  if (confirmedOrder) {
    const msg = buildOrderMessage(confirmedOrder, lang)
    return (
      <Shell>
        <div className="mx-auto max-w-lg space-y-6">
          <div className="rounded-3xl border border-green-500/25 bg-green-500/10 p-8 text-center space-y-4">
            <div className="text-5xl">✅</div>
            <h2 className="text-2xl font-semibold text-white">{t('checkout.success')}</h2>
            <p className="text-white/70 text-sm">{t('checkout.success.sub')}</p>
            <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-left">
              <div className="text-xs text-white/50 mb-1">{t('checkout.orderNumber')}</div>
              <div className="font-semibold text-white text-lg">#{confirmedOrder.id}</div>
            </div>
            <button
              type="button"
              onClick={() => {
                openWhatsApp(WA_NUMBER, msg)
                setWhatsappSent(confirmedOrder.id, true)
              }}
              className="w-full rounded-xl border border-green-500/30 bg-green-500/15 px-6 py-3.5 text-base font-semibold text-green-300 hover:bg-green-500/25 flex items-center justify-center gap-2"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              {t('checkout.whatsapp.btn')}
            </button>
            <p className="text-xs text-white/50">{t('checkout.whatsapp.note')}</p>
            <a href="/shop" className="inline-block rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10">
              {t('checkout.continue')}
            </a>
          </div>
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight text-white">{t('checkout.title')}</h2>
        <p className="mt-1 text-sm text-white/60">{t('checkout.delivery.gcc')}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]" dir={dir}>
        <div className="space-y-6">
          {/* بيانات التوصيل */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            {/* Section header */}
            <div className="mb-5 flex items-center gap-2 border-b border-white/8 pb-4">
              <span className="text-xl">📦</span>
              <span className="text-base font-semibold text-white">{t('checkout.address')}</span>
            </div>

            {/* Row 1 — Name + Phone */}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5">
                <span className="flex items-center gap-1.5 text-sm font-medium text-white/80">
                  👤 {t('checkout.fullName')} <span className="text-[var(--brand)]">*</span>
                </span>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                  placeholder={lang === 'ar' ? 'الاسم الكامل' : 'Your full name'}
                  className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none transition-colors focus:border-[var(--brand)]/60 focus:bg-black/40"
                />
              </label>
              <label className="grid gap-1.5">
                <span className="flex items-center gap-1.5 text-sm font-medium text-white/80">
                  📱 {t('checkout.phone')} <span className="text-[var(--brand)]">*</span>
                </span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder={`${DIAL_CODES[country]}...`}
                  className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none transition-colors focus:border-[var(--brand)]/60 focus:bg-black/40"
                />
              </label>
            </div>

            {/* Row 2 — Country + City */}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5">
                <span className="flex items-center gap-1.5 text-sm font-medium text-white/80">
                  🌍 {t('checkout.country')}
                </span>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value as GCCCountry)}
                  className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-[var(--brand)]/60 focus:bg-black/40"
                >
                  <option value="BH">{t('country.bh')}</option>
                  <option value="SA">{t('country.sa')}</option>
                  <option value="KW">{t('country.kw')}</option>
                  <option value="QA">{t('country.qa')}</option>
                  <option value="AE">{t('country.ae')}</option>
                  <option value="OM">{t('country.om')}</option>
                </select>
              </label>
              <label className="grid gap-1.5">
                <span className="flex items-center gap-1.5 text-sm font-medium text-white/80">
                  🏙️ {t('checkout.city')} <span className="text-[var(--brand)]">*</span>
                </span>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  autoComplete="address-level2"
                  placeholder={lang === 'ar' ? 'اسم المدينة' : 'City name'}
                  className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none transition-colors focus:border-[var(--brand)]/60 focus:bg-black/40"
                />
              </label>
            </div>

            {/* Row 3 — Address (full width) */}
            <div className="mt-4">
              <label className="grid gap-1.5">
                <span className="flex items-center gap-1.5 text-sm font-medium text-white/80">
                  📍 {t('checkout.addressLine')} <span className="text-[var(--brand)]">*</span>
                </span>
                <input
                  value={addressLine}
                  onChange={(e) => setAddrLine(e.target.value)}
                  autoComplete="street-address"
                  placeholder={lang === 'ar' ? 'الشارع، المنطقة، رقم المبنى...' : 'Street, area, building no…'}
                  className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none transition-colors focus:border-[var(--brand)]/60 focus:bg-black/40"
                />
              </label>
            </div>

            {/* Row 4 — Notes (full width) */}
            <div className="mt-4">
              <label className="grid gap-1.5">
                <span className="flex items-center gap-1.5 text-sm font-medium text-white/80">
                  📝 {t('checkout.notes')}
                </span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder={lang === 'ar' ? 'أي تفاصيل إضافية للتوصيل...' : 'Any extra delivery details…'}
                  className="resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none transition-colors focus:border-[var(--brand)]/60 focus:bg-black/40"
                />
              </label>
            </div>
          </div>

          {/* عناصر السلة */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 text-base font-semibold text-white">{t('cart.title')}</div>
            {lines.length === 0 ? (
              <div className="text-white/70">{t('cart.empty')}</div>
            ) : (
              <div className="space-y-4">
                {lines.map((l) => {
                  const key = lineKey(l.item.productId, l.item.size)
                  const currentSecond = secondSizes[key] ?? null
                  const availableSecond = l.product.sizes.filter((s) => s.size !== l.item.size).map((s) => s.size)
                  const displayName = lang === 'ar' ? (l.product.nameAr || l.product.name) : l.product.name
                  return (
                    <div key={key} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate font-medium text-white">{displayName}</div>
                          <div className="mt-1 text-xs text-white/60">
                            {t('cart.size')}: {l.item.size} • {t('cart.qty')}: {l.item.qty} • {formatMoney(l.product.price)}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-white">{formatMoney(l.product.price * l.item.qty)}</div>
                      </div>
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <label className="inline-flex items-center gap-2 text-sm text-white/80">
                          <input type="checkbox" checked={currentSecond != null} onChange={(e) => {
                            setSecondSizes((cur) => ({ ...cur, [key]: e.target.checked ? availableSecond[0] ?? null : null }))
                          }} />
                          {t('checkout.tryTwo')}
                        </label>
                        {currentSecond != null && availableSecond.length > 0 ? (
                          <div className="flex items-center gap-2">
                            <div className="text-xs text-white/60">{t('checkout.secondSize')}</div>
                            <select value={String(currentSecond)} onChange={(e) => setSecondSizes((cur) => ({ ...cur, [key]: Number(e.target.value) }))} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none">
                              {availableSecond.map((s) => <option key={s} value={String(s)}>{s}</option>)}
                            </select>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ملخص الدفع */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 h-fit sticky top-24">
          <div className="mb-3 text-base font-semibold text-white">{t('checkout.payment')}</div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm">
            <div className="flex items-center gap-2 font-medium text-white">
              💵 {t('checkout.payment.cod')}
            </div>
            <div className="mt-2 flex items-center justify-between text-white/70">
              <span>{t('checkout.codFee')}</span>
              <span className="font-medium text-white">{t('checkout.codFee.value')}</span>
            </div>
          </div>
          <div className="mt-5 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-white/60">{t('checkout.subtotal')}</span>
              <span className="font-semibold text-white">{formatMoney(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">{t('checkout.codFee')}</span>
              <span className="font-semibold text-white">{formatMoney(lines.length > 0 ? codFee : 0)}</span>
            </div>
            <div className="h-px bg-white/10" />
            <div className="flex items-center justify-between">
              <span className="font-medium text-white/80">{t('checkout.total')}</span>
              <span className="text-lg font-semibold text-white">{formatMoney(total)}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={placeOrder}
            disabled={!isFormValid || submitting}
            className="mt-5 w-full rounded-xl bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--brand-2)] disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {submitting ? t('checkout.placing') : t('checkout.placeOrder')}
          </button>
        </div>
      </div>
    </Shell>
  )
}

// ─── ROUTER ───────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <Routes>
      <Route path="/"          element={<Home />} />
      <Route path="/shop"      element={<Shop />} />
      {/* <Route path="/about"     element={<About />} /> */}
      <Route path="/product/:id" element={<Product />} />
      <Route path="/admin"     element={<AdminGate><Admin /></AdminGate>} />
      <Route path="/checkout"  element={<Checkout />} />
      <Route path="*"          element={<Navigate to="/" replace />} />
    </Routes>
  )
}
