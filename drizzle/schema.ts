import { mysqlTable, mysqlSchema, AnyMySqlColumn, primaryKey, int, varchar, text, tinyint, timestamp, unique, mysqlEnum, datetime } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const addresses = mysqlTable("addresses", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	label: varchar({ length: 100 }),
	fullName: varchar({ length: 255 }).notNull(),
	phone: varchar({ length: 20 }).notNull(),
	address: text().notNull(),
	city: varchar({ length: 100 }).notNull(),
	postalCode: varchar({ length: 10 }),
	isPrimary: tinyint().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "addresses_id"}),
]);

export const cartItems = mysqlTable("cartItems", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	productId: int().notNull(),
	quantity: int().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "cartItems_id"}),
]);

export const coupons = mysqlTable("coupons", {
	id: int().autoincrement().notNull(),
	code: varchar({ length: 50 }).notNull(),
	description: text(),
	discountType: mysqlEnum(['FIXED','PERCENTAGE']).notNull(),
	discountValue: int().notNull(),
	minOrderAmount: int().default(0).notNull(),
	maxDiscountAmount: int(),
	startDate: datetime({ mode: 'string'}),
	endDate: datetime({ mode: 'string'}),
	usageLimit: int(),
	usageCount: int().default(0).notNull(),
	isActive: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "coupons_id"}),
	unique("coupons_code_unique").on(table.code),
]);

export const orderItems = mysqlTable("orderItems", {
	id: int().autoincrement().notNull(),
	orderId: int().notNull(),
	productId: int().notNull(),
	productName: varchar({ length: 255 }).notNull(),
	quantity: int().notNull(),
	unitPrice: int().notNull(),
	subtotal: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "orderItems_id"}),
]);

export const orders = mysqlTable("orders", {
	id: int().autoincrement().notNull(),
	userId: int(),
	orderNumber: varchar({ length: 50 }).notNull(),
	customerName: varchar({ length: 255 }).notNull(),
	customerPhone: varchar({ length: 20 }).notNull(),
	customerEmail: varchar({ length: 320 }),
	shippingAddress: text().notNull(),
	shippingCity: varchar({ length: 100 }).notNull(),
	shippingPostalCode: varchar({ length: 10 }),
	shippingCourier: varchar({ length: 50 }),
	shippingCost: int().default(0).notNull(),
	paymentMethod: varchar({ length: 50 }).notNull(),
	paymentBank: varchar({ length: 50 }),
	paymentProofUrl: text(),
	couponId: int(),
	discountAmount: int().default(0).notNull(),
	subtotal: int().notNull(),
	total: int().notNull(),
	status: mysqlEnum(['PENDING_PAYMENT','PROCESSING','SHIPPED','COMPLETED','CANCELLED']).default('PENDING_PAYMENT').notNull(),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "orders_id"}),
	unique("orders_orderNumber_unique").on(table.orderNumber),
]);

export const products = mysqlTable("products", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }).notNull(),
	description: text(),
	price: int().notNull(),
	stock: int().default(0).notNull(),
	spiceLevel: int().default(1).notNull(),
	imageUrl: text(),
	isActive: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "products_id"}),
	unique("products_slug_unique").on(table.slug),
]);

export const siteSettings = mysqlTable("siteSettings", {
	id: int().autoincrement().notNull(),
	key: varchar({ length: 255 }).notNull(),
	value: text().notNull(),
	updatedAt: timestamp({ mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "siteSettings_id"}),
	unique("siteSettings_key_unique").on(table.key),
]);

export const users = mysqlTable("users", {
	id: int().autoincrement().notNull(),
	openId: varchar({ length: 64 }),
	email: varchar({ length: 320 }),
	name: text(),
	phone: varchar({ length: 20 }),
	loginMethod: varchar({ length: 64 }),
	passwordHash: varchar({ length: 255 }),
	role: mysqlEnum(['user','admin']).default('user').notNull(),
	isBlocked: tinyint().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
	lastSignedIn: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "users_id"}),
	unique("users_openId_unique").on(table.openId),
	unique("users_email_unique").on(table.email),
]);

export const wishlists = mysqlTable("wishlists", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	productId: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "wishlists_id"}),
]);
