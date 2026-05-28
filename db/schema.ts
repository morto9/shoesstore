import { pgTable, text, decimal, integer, boolean, timestamp, serial } from 'drizzle-orm/pg-core'

// ===== PRODUCTS =====
export const products = pgTable('products', {
  id:            text('id').primaryKey(),
  nameEn:        text('name_en').notNull(),
  nameAr:        text('name_ar'),
  priceBhd:      decimal('price_bhd', { precision: 10, scale: 3 }).notNull(),
  tagEn:         text('tag_en'),
  tagAr:         text('tag_ar'),
  descriptionEn: text('description_en'),
  descriptionAr: text('description_ar'),
  stockQty:      integer('stock_qty').default(0).notNull(),
  sizes:         text('sizes').notNull().default('[]'), // JSON array stored as text
  imageUrl:      text('image_url'),
  updatedAt:     timestamp('updated_at').defaultNow().notNull(),
})

export type DbProduct = typeof products.$inferSelect
export type DbProductInsert = typeof products.$inferInsert

// ===== ORDERS =====
export const orders = pgTable('orders', {
  id:            text('id').primaryKey(),
  createdAt:     timestamp('created_at').defaultNow().notNull(),
  status:        text('status').notNull().default('new'),
  paymentMethod: text('payment_method').notNull().default('cod'),
  codFeeBhd:     decimal('cod_fee_bhd', { precision: 10, scale: 3 }).default('2.000').notNull(),
  paid:          boolean('paid').default(false).notNull(),
  country:       text('country').notNull(),
  city:          text('city').notNull(),
  addressLine:   text('address_line').notNull(),
  notes:         text('notes'),
  phone:         text('phone').notNull(),
  fullName:      text('full_name').notNull(),
  subtotalBhd:   decimal('subtotal_bhd', { precision: 10, scale: 3 }).notNull(),
  totalBhd:      decimal('total_bhd', { precision: 10, scale: 3 }).notNull(),
  whatsappSent:  boolean('whatsapp_sent').default(false).notNull(),
})

export type DbOrder = typeof orders.$inferSelect
export type DbOrderInsert = typeof orders.$inferInsert

// ===== ORDER LINES =====
export const orderLines = pgTable('order_lines', {
  id:          serial('id').primaryKey(),
  orderId:     text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId:   text('product_id').notNull(),
  productName: text('product_name').notNull(),
  size:        integer('size').notNull(),
  qty:         integer('qty').notNull(),
  secondSize:  integer('second_size'),
  unitPriceBhd: decimal('unit_price_bhd', { precision: 10, scale: 3 }).notNull(),
})

export type DbOrderLine = typeof orderLines.$inferSelect
export type DbOrderLineInsert = typeof orderLines.$inferInsert
