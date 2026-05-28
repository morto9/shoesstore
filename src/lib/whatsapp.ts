import type { Order } from '../store/orders'

// خريطة أسماء الدول بالعربي (uppercase codes مثل 'BH', 'SA')
const COUNTRY_NAMES_AR: Record<string, string> = {
  BH: 'البحرين',
  SA: 'المملكة العربية السعودية',
  KW: 'الكويت',
  QA: 'قطر',
  AE: 'الإمارات العربية المتحدة',
  OM: 'سلطنة عُمان',
}

const COUNTRY_NAMES_EN: Record<string, string> = {
  BH: 'Bahrain',
  SA: 'Saudi Arabia',
  KW: 'Kuwait',
  QA: 'Qatar',
  AE: 'UAE',
  OM: 'Oman',
}

const CURRENCY: Record<string, string> = {
  BH: 'BHD', SA: 'SAR', KW: 'KWD', QA: 'QAR', AE: 'AED', OM: 'OMR',
}

const EXCHANGE: Record<string, number> = {
  BH: 1, SA: 9.95, KW: 0.82, QA: 9.65, AE: 9.75, OM: 0.97,
}

function fmtPrice(bhd: number, country: string): string {
  const rate = EXCHANGE[country] ?? 1
  const cur  = CURRENCY[country] ?? 'BHD'
  const val  = (bhd * rate).toFixed(3)
  return `${val} ${cur}`
}

/**
 * بناء رسالة واتساب عربية احترافية لطلب جديد
 */
export function buildOrderMessage(order: Order, lang: 'ar' | 'en' = 'ar'): string {
  const country = order.delivery.country
  const isAr    = lang === 'ar'

  if (isAr) {
    const lines = order.lines.map(l => {
      const lineTotal = fmtPrice(l.unitPriceBHD * l.qty, country)
      const second    = l.secondSize ? ` (تجربة: ${l.secondSize})` : ''
      return `  • ${l.productName} | مقاس ${l.size}${second} × ${l.qty} = ${lineTotal}`
    }).join('\n')

    return [
      `🛍️ *طلب جديد — متجر أحذية  *`,
      ``,
      `📦 *رقم الطلب:* ${order.id}`,
      `📅 *التاريخ:* ${new Date(order.createdAt).toLocaleDateString('en-GB')}`,
      ``,
      `*المنتجات:*`,
      lines,
      ``,
      `💰 *المجموع الفرعي:* ${fmtPrice(order.subtotalBHD, country)}`,
      `🚚 *رسوم التوصيل:* ${fmtPrice(order.payment.codFeeBHD, country)}`,
      `✅ *الإجمالي:* ${fmtPrice(order.totalBHD, country)}`,
      ``,
      `👤 *العميل:* ${order.delivery.fullName}`,
      `📱 *الهاتف:* ${order.delivery.phone}`,
      `🌍 *الدولة:* ${COUNTRY_NAMES_AR[country] ?? country}`,
      `🏙️ *المدينة:* ${order.delivery.city}`,
      `📍 *العنوان:* ${order.delivery.addressLine}`,
      ...(order.delivery.notes ? [`📝 *ملاحظات:* ${order.delivery.notes}`] : []),
      ``,
      `💳 *طريقة الدفع:* الدفع عند الاستلام `,
      ``,
      `_يُرجى تأكيد استلام هذا الطلب_ 🙏`,
    ].join('\n')
  } else {
    const lines = order.lines.map(l => {
      const lineTotal = fmtPrice(l.unitPriceBHD * l.qty, country)
      const second    = l.secondSize ? ` (try: ${l.secondSize})` : ''
      return `  • ${l.productName} | Size ${l.size}${second} × ${l.qty} = ${lineTotal}`
    }).join('\n')

    return [
      `🛍️ *New Order — Shoe Store*`,
      ``,
      `📦 *Order ID:* ${order.id}`,
      `📅 *Date:* ${new Date(order.createdAt).toLocaleDateString('en-GB')}`,
      ``,
      `*Products:*`,
      lines,
      ``,
      `💰 *Subtotal:* ${fmtPrice(order.subtotalBHD, country)}`,
      `🚚 *Delivery Fee:* ${fmtPrice(order.payment.codFeeBHD, country)}`,
      `✅ *Total:* ${fmtPrice(order.totalBHD, country)}`,
      ``,
      `👤 *Customer:* ${order.delivery.fullName}`,
      `📱 *Phone:* ${order.delivery.phone}`,
      `🌍 *Country:* ${COUNTRY_NAMES_EN[country] ?? country}`,
      `🏙️ *City:* ${order.delivery.city}`,
      `📍 *Address:* ${order.delivery.addressLine}`,
      ...(order.delivery.notes ? [`📝 *Notes:* ${order.delivery.notes}`] : []),
      ``,
      `💳 *Payment:* Cash on Delivery`,
      ``,
      `_Please confirm receipt of this order_ 🙏`,
    ].join('\n')
  }
}

/**
 * فتح واتساب مع رسالة مُجهزة
 * phone: رقم الهاتف بدون + (مثل: 97337751989)
 */
export function openWhatsApp(phone: string, message: string): void {
  const encoded = encodeURIComponent(message)
  const url     = `https://wa.me/${phone}?text=${encoded}`
  window.open(url, '_blank', 'noopener,noreferrer')
}

/**
 * بناء رابط واتساب للتواصل مع عميل (من الأدمن)
 */
export function buildCustomerWhatsAppUrl(phone: string, orderIdLabel: string): string {
  const msg = `مرحباً 👋، بخصوص طلبك ${orderIdLabel} متجر أحذية …`
  return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`
}
