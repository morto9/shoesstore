import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type Language = 'en' | 'ar'

type Dictionary = Record<string, string>

const DICTS: Record<Language, Dictionary> = {
  en: {
    'brand.name': 'Shoe Store',
    'brand.tag': 'Shoe Store',
    'nav.shop': 'Shop',
    'nav.about': 'About',
    'nav.lang': 'Language',
    'nav.admin': 'Admin',
    'nav.country': 'Country',
    'lang.en': 'English',
    'lang.ar': 'Arabic',

    'home.badge': 'Modern Best Quality',
    'home.title1': 'Step into comfort.',
    'home.title2': 'Stay catchy.',
    'home.body': 'Shoe Store is your modern shoe store for premium everyday sneakers, runners, and minimal classics—designed to feel great from morning to midnight.',
    'home.cta.shop': 'Shop now',
    'home.cta.why': 'Why Shoe Store',
    'home.card.ship': 'Free shipping',
    'home.card.ship2': 'Orders over 60 BHD',
    'home.card.returns': 'Easy returns',
    'home.card.returns2': '30 days',
    'home.card.secure': 'Secure checkout',
    'home.card.secure2': 'WhatsApp confirmed',
    'home.card.support': 'Support',
    'home.card.support2': 'Fast response',

    'shop.title': 'Shop',
    'shop.view': 'View details →',
    'shop.loading': 'Loading products...',
    'shop.outofstock': 'Out of stock',
    'shop.stock.low': 'Only {n} left',

    'product.title': 'Product',
    'product.body': 'Select a size and add to cart.',
    'product.back': 'Back to shop',
    'product.size': 'Size',
    'product.qty': 'Quantity',
    'product.outofstock': 'Out of stock',
    'product.stock': 'In stock',

    'about.title': 'About Shoe Store',
    'about.body': 'We focus on comfort-first materials, clean silhouettes, and colorways that work with everything.',

    'footer.line1': 'Shoe Store',
    'footer.line2': 'Modern comfort. Street-ready style.',
    'footer.contact': 'Contact us',
    'footer.whatsapp': 'WhatsApp',
    'footer.instagram': 'Instagram',

    // Admin
    'admin.title': 'Admin Dashboard',
    'admin.subtitle': 'Manage your store — products, orders & stats.',
    'admin.new': 'New product',
    'admin.reset': 'Reset sample data',
    'admin.select': 'Select a product to edit, or create a new one.',
    'admin.form.id': 'ID',
    'admin.form.name': 'Name (English)',
    'admin.form.nameAr': 'Name (Arabic)',
    'admin.form.price': 'Price (BHD)',
    'admin.form.tag': 'Tag (English)',
    'admin.form.tagAr': 'Tag (Arabic)',
    'admin.form.stock': 'Stock',
    'admin.form.sizes': 'Sizes',
    'admin.form.size': 'Size',
    'admin.form.qty': 'Qty',
    'admin.form.sizes.add': 'Add size',
    'admin.form.sizes.empty': 'No sizes added yet',
    'admin.form.stock.total': 'Total stock',
    'admin.form.image': 'Upload Image (optional)',
    'admin.form.desc': 'Description (English)',
    'admin.form.descAr': 'Description (Arabic)',
    'admin.save': 'Save',
    'admin.delete': 'Delete',
    'admin.tab.products': 'Products',
    'admin.tab.orders': 'Orders',

    // Admin Stats
    'admin.stats.total': 'Orders this month',
    'admin.stats.revenue': 'Total revenue',
    'admin.stats.new': 'New orders',
    'admin.stats.delivery': 'In delivery',

    // Admin Orders
    'admin.orders.title': 'Orders',
    'admin.orders.none': 'No orders yet.',
    'admin.orders.clear': 'Clear orders',
    'admin.orders.status': 'Status',
    'admin.orders.paid': 'Paid',
    'admin.orders.markPaid': 'Mark paid',
    'admin.orders.markUnpaid': 'Mark unpaid',
    'admin.orders.details': 'Order details',
    'admin.orders.customer': 'Customer',
    'admin.orders.delivery': 'Delivery',
    'admin.orders.items': 'Items',
    'admin.orders.total': 'Total',
    'admin.orders.whatsapp': 'Contact on WhatsApp',
    'admin.orders.search': 'Search orders...',
    'admin.orders.filter': 'Filter by status',
    'admin.orders.export': 'Export CSV',
    'admin.orders.whatsapp.badge': '✓ Sent',
    'admin.orders.whatsapp.send': '💬 Resend',

    'status.new': 'New',
    'status.approved': 'Approved',
    'status.processing': 'Processing',
    'status.processed': 'Processed',
    'status.on_delivery': 'On delivery',
    'status.delivered': 'Delivered',
    'status.paid': 'Paid',
    'status.cancelled': 'Cancelled',

    // Cart
    'cart.title': 'Cart',
    'cart.empty': 'Your cart is empty.',
    'cart.clear': 'Clear cart',
    'cart.checkout': 'Checkout',
    'cart.whatsapp': '💬 Order via WhatsApp',
    'cart.remove': 'Remove',
    'cart.size': 'Size',
    'cart.qty': 'Qty',
    'cart.add': 'Add to cart',
    'cart.added': '✓ Added!',
    'common.close': 'Close',
    'money.bhd': 'BHD',

    // Checkout
    'checkout.title': 'Checkout',
    'checkout.delivery': 'Delivery',
    'checkout.delivery.gcc': 'Delivery available in GCC countries',
    'checkout.payment': 'Payment',
    'checkout.payment.cod': 'Cash on delivery',
    'checkout.codFee': 'Delivery fee',
    'checkout.codFee.value': '2 BHD',
    'checkout.address': 'Delivery address',
    'checkout.fullName': 'Full name',
    'checkout.phone': 'Phone number',
    'checkout.country': 'Country',
    'checkout.city': 'City',
    'checkout.addressLine': 'Address',
    'checkout.notes': 'Notes (optional)',
    'checkout.tryTwo': 'Request a second size to try',
    'checkout.secondSize': 'Second size',
    'checkout.placeOrder': 'Place Order',
    'checkout.placing': 'Placing order...',
    'checkout.success': 'Order confirmed! ✅',
    'checkout.success.sub': 'Tap the button below to send your order details via WhatsApp.',
    'checkout.orderNumber': 'Order number',
    'checkout.subtotal': 'Subtotal',
    'checkout.total': 'Total',
    'checkout.whatsapp.btn': '💬 Send Order via WhatsApp',
    'checkout.whatsapp.note': 'Your order is registered. Please send it via WhatsApp to confirm with the store.',
    'checkout.continue': 'Continue Shopping',

    'country.bh': 'Bahrain',
    'country.sa': 'Saudi Arabia',
    'country.kw': 'Kuwait',
    'country.qa': 'Qatar',
    'country.ae': 'UAE',
    'country.om': 'Oman',
  },
  ar: {
    'brand.name': 'متجر أحذية ',
    'brand.tag': 'متجر أحذية',
    'nav.shop': 'تسوق',
    'nav.about': 'من نحن',
    'nav.lang': 'اللغة',
    'nav.admin': 'لوحة التحكم',
    'nav.country': 'الدولة',
    'lang.en': 'English',
    'lang.ar': 'العربية',

    'home.badge': 'إصدارات جديدة وعصرية بأفضل جودة',
    'home.title1': 'خطوة نحو الراحة.',
    'home.title2': 'متجر أحذية .',
    'home.body': '  هو متجرك العصري للأحذية الرياضية اليومية والركض والتصاميم الكلاسيكية—مصممة لتمنحك راحة طوال اليوم.',
    'home.cta.shop': 'تسوق الآن',
    'home.cta.why': 'متجر أحذية   ',
    'home.card.ship': 'شحن مجاني',
    'home.card.ship2': 'للطلبات فوق ٦٠ د.ب',
    'home.card.returns': 'إرجاع سهل',
    'home.card.returns2': '٣٠ يومًا',
    'home.card.secure': 'طلب آمن',
    'home.card.secure2': 'تأكيد عبر الواتساب',
    'home.card.support': 'الدعم',
    'home.card.support2': 'استجابة سريعة',

    'shop.title': 'تسوق',
    'shop.view': 'عرض التفاصيل ←',
    'shop.loading': 'جاري تحميل المنتجات...',
    'shop.outofstock': 'نفد المخزون',
    'shop.stock.low': 'متبقي {n} فقط',

    'product.title': 'المنتج',
    'product.body': 'اختر مقاسك وأضفه للسلة.',
    'product.back': 'العودة للتسوق',
    'product.size': 'المقاس',
    'product.qty': 'الكمية',
    'product.outofstock': 'نفد المخزون',
    'product.stock': 'متوفر',

    'about.title': 'عن  متجر أحذية ',
    'about.body': 'نركز على خامات مريحة، وتصاميم نظيفة، وألوان تناسب كل الإطلالات.',

    'footer.line1': 'متجر أحذية  ',
    'footer.line2': 'راحة عصرية.',
    'footer.contact': 'تواصل معنا',
    'footer.whatsapp': 'واتساب',
    'footer.instagram': 'إنستغرام',

    // Admin
    'admin.title': 'لوحة التحكم',
    'admin.subtitle': 'إدارة متجرك — منتجات وطلبات وإحصائيات.',
    'admin.new': 'منتج جديد',
    'admin.reset': 'إعادة بيانات المثال',
    'admin.select': 'اختر منتجًا للتعديل أو أنشئ منتجًا جديدًا.',
    'admin.form.id': 'المعرّف',
    'admin.form.name': 'الاسم (إنجليزي)',
    'admin.form.nameAr': 'الاسم (عربي)',
    'admin.form.price': 'السعر (د.ب)',
    'admin.form.tag': 'التصنيف (إنجليزي)',
    'admin.form.tagAr': 'التصنيف (عربي)',
    'admin.form.stock': 'المخزون',
    'admin.form.sizes': 'المقاسات',
    'admin.form.size': 'المقاس',
    'admin.form.qty': 'الكمية',
    'admin.form.sizes.add': 'إضافة مقاس',
    'admin.form.sizes.empty': 'لا توجد مقاسات بعد',
    'admin.form.stock.total': 'إجمالي المخزون',
    'admin.form.image': 'رفع الصورة (اختياري)',
    'admin.form.desc': 'الوصف (إنجليزي)',
    'admin.form.descAr': 'الوصف (عربي)',
    'admin.save': 'حفظ',
    'admin.delete': 'حذف',
    'admin.tab.products': 'المنتجات',
    'admin.tab.orders': 'الطلبات',

    // Admin Stats
    'admin.stats.total': 'طلبات الشهر',
    'admin.stats.revenue': 'إجمالي الإيرادات',
    'admin.stats.new': 'طلبات جديدة',
    'admin.stats.delivery': 'قيد التوصيل',

    // Admin Orders
    'admin.orders.title': 'الطلبات',
    'admin.orders.none': 'لا توجد طلبات بعد.',
    'admin.orders.clear': 'حذف الطلبات',
    'admin.orders.status': 'الحالة',
    'admin.orders.paid': 'مدفوع',
    'admin.orders.markPaid': 'تحديد كمدفوع',
    'admin.orders.markUnpaid': 'تحديد كغير مدفوع',
    'admin.orders.details': 'تفاصيل الطلب',
    'admin.orders.customer': 'العميل',
    'admin.orders.delivery': 'التوصيل',
    'admin.orders.items': 'المنتجات',
    'admin.orders.total': 'الإجمالي',
    'admin.orders.whatsapp': 'تواصل عبر الواتساب',
    'admin.orders.search': 'بحث عن طلب...',
    'admin.orders.filter': 'فلترة حسب الحالة',
    'admin.orders.export': 'تصدير CSV',
    'admin.orders.whatsapp.badge': '✓ أُرسل',
    'admin.orders.whatsapp.send': '💬 إعادة الإرسال',

    'status.new': 'جديد',
    'status.approved': 'تمت الموافقة',
    'status.processing': 'قيد المعالجة',
    'status.processed': 'تم التجهيز',
    'status.on_delivery': 'قيد التوصيل',
    'status.delivered': 'تم التوصيل',
    'status.paid': 'مدفوع',
    'status.cancelled': 'ملغي',

    // Cart
    'cart.title': 'السلة',
    'cart.empty': 'سلتك فارغة.',
    'cart.clear': 'تفريغ السلة',
    'cart.checkout': 'إتمام الطلب',
    'cart.whatsapp': '💬 اطلب عبر الواتساب',
    'cart.remove': 'حذف',
    'cart.size': 'المقاس',
    'cart.qty': 'الكمية',
    'cart.add': 'أضف إلى السلة',
    'cart.added': '✓ تمت الإضافة!',
    'common.close': 'إغلاق',
    'money.bhd': 'د.ب',

    // Checkout
    'checkout.title': 'إتمام الطلب',
    'checkout.delivery': 'التوصيل',
    'checkout.delivery.gcc': 'التوصيل متاح في دول الخليج',
    'checkout.payment': 'الدفع',
    'checkout.payment.cod': 'الدفع عند الاستلام',
    'checkout.codFee': 'رسوم التوصيل',
    'checkout.codFee.value': '٢ د.ب',
    'checkout.address': 'عنوان التوصيل',
    'checkout.fullName': 'الاسم الكامل',
    'checkout.phone': 'رقم الهاتف',
    'checkout.country': 'الدولة',
    'checkout.city': 'المدينة',
    'checkout.addressLine': 'العنوان',
    'checkout.notes': 'ملاحظات (اختياري)',
    'checkout.tryTwo': 'اطلب مقاسًا ثانيًا للتجربة',
    'checkout.secondSize': 'المقاس الثاني',
    'checkout.placeOrder': 'تأكيد الطلب',
    'checkout.placing': 'جاري تسجيل الطلب...',
    'checkout.success': 'جاري تأكيد طلبك! ✅',
    'checkout.success.sub': 'اضغط الزر أدناه لإرسال تفاصيل طلبك عبر الواتساب',
    'checkout.orderNumber': 'رقم الطلب',
    'checkout.subtotal': 'المجموع',
    'checkout.total': 'الإجمالي',
    'checkout.whatsapp.btn': '💬 أرسل الطلب عبر الواتساب',
    'checkout.whatsapp.note': 'لن يتم تأكيد طلبك الا بعد ارساله عبر  الواتساب',
    'checkout.continue': 'متابعة التسوق',

    'country.bh': 'البحرين',
    'country.sa': 'السعودية',
    'country.kw': 'الكويت',
    'country.qa': 'قطر',
    'country.ae': 'الإمارات',
    'country.om': 'عُمان',
  },
}

function detectDefaultLanguage(): Language {
  const stored = localStorage.getItem('catchy.lang')
  if (stored === 'en' || stored === 'ar') return stored
  const nav = (navigator.language || '').toLowerCase()
  return nav.startsWith('ar') ? 'ar' : 'en'
}

type I18nValue = {
  lang: Language
  setLang: (l: Language) => void
  t: (key: string, vars?: Record<string, string | number>) => string
  dir: 'ltr' | 'rtl'
}

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>(() => detectDefaultLanguage())

  const value = useMemo<I18nValue>(() => {
    const dict = DICTS[lang]
    return {
      lang,
      setLang,
      dir: lang === 'ar' ? 'rtl' : 'ltr',
      t: (key: string, vars?: Record<string, string | number>) => {
        let str = dict[key] ?? DICTS.en[key] ?? key
        if (vars) {
          Object.entries(vars).forEach(([k, v]) => {
            str = str.replace(`{${k}}`, String(v))
          })
        }
        return str
      },
    }
  }, [lang])

  useEffect(() => {
    localStorage.setItem('catchy.lang', lang)
    document.documentElement.lang = lang
    document.documentElement.dir = value.dir
  }, [lang, value.dir])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
