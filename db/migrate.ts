/**
 * سكريبت إنشاء جداول قاعدة البيانات مباشرةً
 * شغّله مرة واحدة: npm run db:migrate
 */
import { config } from 'dotenv'
// تحميل .env.local تلقائياً
config({ path: '.env.local' })

import { neon } from '@neondatabase/serverless'
import 'dotenv/config'

async function migrate() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')

  const sql = neon(url)

  console.log('🔧 Creating tables...')

  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id            TEXT PRIMARY KEY,
      name_en       TEXT NOT NULL,
      name_ar       TEXT,
      price_bhd     DECIMAL(10,3) NOT NULL,
      tag_en        TEXT,
      tag_ar        TEXT,
      description_en TEXT,
      description_ar TEXT,
      stock_qty     INTEGER NOT NULL DEFAULT 0,
      sizes         TEXT NOT NULL DEFAULT '[]',
      image_url     TEXT,
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id             TEXT PRIMARY KEY,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      status         TEXT NOT NULL DEFAULT 'new',
      payment_method TEXT NOT NULL DEFAULT 'cod',
      cod_fee_bhd    DECIMAL(10,3) NOT NULL DEFAULT 2.000,
      paid           BOOLEAN NOT NULL DEFAULT FALSE,
      country        TEXT NOT NULL,
      city           TEXT NOT NULL,
      address_line   TEXT NOT NULL,
      notes          TEXT,
      phone          TEXT NOT NULL,
      full_name      TEXT NOT NULL,
      subtotal_bhd   DECIMAL(10,3) NOT NULL,
      total_bhd      DECIMAL(10,3) NOT NULL,
      whatsapp_sent  BOOLEAN NOT NULL DEFAULT FALSE
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS order_lines (
      id            SERIAL PRIMARY KEY,
      order_id      TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id    TEXT NOT NULL,
      product_name  TEXT NOT NULL,
      size          INTEGER NOT NULL,
      qty           INTEGER NOT NULL,
      second_size   INTEGER,
      unit_price_bhd DECIMAL(10,3) NOT NULL
    )
  `

  // Seed initial products if empty
  const existing = await sql`SELECT COUNT(*) as count FROM products`
  const count = Number(existing[0].count)

  if (count === 0) {
    console.log('🌱 Seeding initial products...')
    await sql`
      INSERT INTO products (id, name_en, name_ar, price_bhd, tag_en, tag_ar, description_en, description_ar, stock_qty, sizes, image_url) VALUES
      ('cs-01', 'Nimbus Runner', 'نيمبوس رانر', 89.000, 'Daily runner', 'جري يومي',
        'Engineered for all-day comfort with a responsive foam midsole and breathable upper.',
        'مصمم للراحة طوال اليوم مع وسادة إسفنجية مرنة وجزء علوي قابل للتنفس.',
        12, '[39,40,41,42,43,44,45]', NULL),
      ('cs-02', 'Street Low', 'ستريت لو', 79.000, 'Minimal classic', 'كلاسيك مينيمال',
        'Clean lines meet street-ready durability. The go-to for casual everyday style.',
        'خطوط أنيقة مع متانة عالية. الاختيار الأمثل للأناقة اليومية غير الرسمية.',
        8, '[38,39,40,41,42,43,44]', NULL),
      ('cs-03', 'Cloud Knit', 'كلاود نيت', 99.000, 'Ultra comfort', 'راحة فائقة',
        'Step onto clouds. Premium knit upper adapts to your foot for a second-skin feel.',
        'احرص بخطواتك على السحاب. الجزء العلوي المحبوك يتكيف مع قدمك للشعور بثاني الجلد.',
        6, '[39,40,41,42,43,44,45]', NULL),
      ('cs-04', 'Trail Grip', 'تريل غريب', 109.000, 'Outdoor ready', 'جاهز للخارج',
        'Conquer any terrain. Aggressive lug sole with waterproof upper keeps you moving.',
        'تغلب على أي تضاريس. نعل بارز مع جزء علوي مضاد للماء لإبقائك متحركاً.',
        4, '[40,41,42,43,44,45,46]', NULL)
    `
  }

  console.log('✅ Migration complete!')
}

migrate().catch(console.error)
