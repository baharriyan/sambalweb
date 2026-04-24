import { eq, and, gte, lte, desc, asc, sql, type SQL } from "drizzle-orm";
export { eq, and, gte, lte, desc, asc, sql };
import { drizzle } from "drizzle-orm/mysql2";
import bcryptjs from "bcryptjs";
import { 
  users, 
  products,
  cartItems,
  orders,
  orderItems,
  addresses,
  coupons,
  wishlists,
  siteSettings,
  type User,
  type Product,
  type CartItem,
  type Order,
  type OrderItem,
  type Address,
  type InsertUser,
  type InsertProduct,
  type InsertCoupon
} from "../drizzle/schema";

export {
  users, 
  products,
  cartItems,
  orders,
  orderItems,
  addresses,
  coupons,
  wishlists,
  siteSettings,
  type User,
  type Product,
  type CartItem,
  type Order,
  type OrderItem,
  type Address,
  type InsertUser,
  type InsertProduct,
  type InsertCoupon
};

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch {
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    return;
  }

  const values: InsertUser = {
    openId: user.openId,
  };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];

  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };

  textFields.forEach(assignNullable);

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  }

  if (!values.lastSignedIn) {
    values.lastSignedIn = new Date();
  }

  if (Object.keys(updateSet).length === 0) {
    updateSet.lastSignedIn = new Date();
  }

  await db.insert(users).values(values).onDuplicateKeyUpdate({
    set: updateSet,
  });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Database-based authentication functions
export async function getUserByEmail(email: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) {
    
    return undefined;
  }

  
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createDatabaseUser(data: {
  email: string;
  name?: string;
  password: string;
  role?: 'user' | 'admin';
  phone?: string;
}): Promise<User | null> {
  const db = await getDb();
  if (!db) {
    
    return null;
  }

  const passwordHash = await bcryptjs.hash(data.password, 10);
  await db.insert(users).values({
    email: data.email,
    name: data.name || null,
    passwordHash,
    role: data.role || "user",
    phone: data.phone || null,
    loginMethod: "database",
    openId: `db_${data.email}`, // Generate a unique openId for database users
    lastSignedIn: new Date(),
  });

  // Retrieve and return the created user
  const newUser = await getUserByEmail(data.email);
  return newUser || null;
}

export async function verifyPassword(email: string, password: string): Promise<User | null> {
  
  
  const user = await getUserByEmail(email);
  
  if (!user) {
    
    return null;
  }
  
  if (!user.passwordHash) {
    
    return null;
  }

  
  const isValid = await bcryptjs.compare(password, user.passwordHash);
  
  if (!isValid) {
    
    return null;
  }

  

  // Update last signed in time
  const db = await getDb();
  if (db) {
    await db.update(users)
      .set({ lastSignedIn: new Date() })
      .where(eq(users.id, user.id));
  }

  return user;
}

// Product queries
export async function getProducts(filters?: { isActive?: boolean; search?: string }) {
  const db = await getDb();
  if (!db) return [];

  const conditions: SQL[] = [];
  
  if (filters?.isActive !== undefined) {
    conditions.push(eq(products.isActive, filters.isActive ? 1 : 0));
  }
  
  if (filters?.search) {
    const searchTerm = `%${filters.search}%`;
    conditions.push(
      sql`${products.name} LIKE ${searchTerm} OR ${products.description} LIKE ${searchTerm}`
    );
  }
  
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const query = whereClause 
    ? db.select().from(products).where(whereClause)
    : db.select().from(products);
  
  return query.orderBy(asc(products.name));
}

export async function getProductBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createProduct(data: Omit<typeof products.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(products).values(data);
  return result;
}

export async function updateProduct(id: number, data: Partial<typeof products.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(products).set(data).where(eq(products.id, id));
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.delete(products).where(eq(products.id, id));
}

// Cart queries
export async function getCartItems(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select({
    id: cartItems.id,
    userId: cartItems.userId,
    productId: cartItems.productId,
    quantity: cartItems.quantity,
    productName: products.name,
    price: products.price,
    imageUrl: products.imageUrl,
  })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.userId, userId));
}

export async function addToCart(userId: number, productId: number, quantity: number = 1) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await db.select().from(cartItems)
    .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)))
    .limit(1);
  
  if (existing.length > 0) {
    return db.update(cartItems)
      .set({ quantity: existing[0].quantity + quantity })
      .where(eq(cartItems.id, existing[0].id));
  }
  
  return db.insert(cartItems).values({ userId, productId, quantity });
}

export async function updateCartItem(cartItemId: number, quantity: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (quantity <= 0) {
    return db.delete(cartItems).where(eq(cartItems.id, cartItemId));
  }
  
  return db.update(cartItems).set({ quantity }).where(eq(cartItems.id, cartItemId));
}

export async function removeCartItem(cartItemId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.delete(cartItems).where(eq(cartItems.id, cartItemId));
}

export async function clearCart(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.delete(cartItems).where(eq(cartItems.userId, userId));
}

// Order queries
export async function createOrder(orderData: Omit<typeof orders.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(orders).values(orderData);
  return result;
}

export async function getOrderById(orderId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserOrders(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt))
    .limit(limit);
}

export async function getAllOrders(limit: number = 100, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getOrdersByStatus(status: 'PENDING_PAYMENT' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED', limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(orders)
    .where(eq(orders.status, status))
    .orderBy(desc(orders.createdAt))
    .limit(limit);
}

export async function updateOrderStatus(orderId: number, status: 'PENDING_PAYMENT' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED', trackingNumber?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (status === "CANCELLED") {
    return await db.transaction(async (tx) => {
      // 1. Get current order status and items
      const order = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1);
      if (order.length === 0 || order[0].status === "CANCELLED") return;

      // 2. Update status
      await tx.update(orders).set({ status }).where(eq(orders.id, orderId));

      // 3. Restore stock
      const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
      for (const item of items) {
        await tx.update(products)
          .set({ stock: sql`${products.stock} + ${item.quantity}` })
          .where(eq(products.id, item.productId));
      }
    });
  }

  return db.update(orders).set({ status, trackingNumber }).where(eq(orders.id, orderId));
}

export async function updateOrderStatusByNumber(orderNumber: string, status: 'PENDING_PAYMENT' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED', trackingNumber?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (status === "CANCELLED") {
    return await db.transaction(async (tx) => {
      // 1. Get current order
      const order = await tx.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
      if (order.length === 0 || order[0].status === "CANCELLED") return;

      // 2. Update status
      await tx.update(orders).set({ status }).where(eq(orders.orderNumber, orderNumber));

      // 3. Restore stock
      const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, order[0].id));
      for (const item of items) {
        await tx.update(products)
          .set({ stock: sql`${products.stock} + ${item.quantity}` })
          .where(eq(products.id, item.productId));
      }
    });
  }

  return db.update(orders).set({ status, trackingNumber }).where(eq(orders.orderNumber, orderNumber));
}

export async function createOrderItem(itemData: Omit<typeof orderItems.$inferInsert, 'id' | 'createdAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(orderItems).values(itemData);
}

export async function updateOrderPaymentProof(orderId: number, imageUrl: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(orders)
    .set({ paymentProofUrl: imageUrl })
    .where(eq(orders.id, orderId));
}

export async function getOrderItems(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

export async function deleteOrder(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.transaction(async (tx) => {
    // 1. Delete order items first
    await tx.delete(orderItems).where(eq(orderItems.orderId, orderId));
    // 2. Delete the order
    await tx.delete(orders).where(eq(orders.id, orderId));
    return { success: true };
  });
}

// Address queries
export async function getUserAddresses(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(addresses).where(eq(addresses.userId, userId));
}

export async function createAddress(addressData: Omit<typeof addresses.$inferInsert, 'id' | 'createdAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(addresses).values(addressData);
}

export async function updateAddress(addressId: number, addressData: Partial<typeof addresses.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(addresses).set(addressData).where(eq(addresses.id, addressId));
}

export async function deleteAddress(addressId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.delete(addresses).where(eq(addresses.id, addressId));
}

// User queries
export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUser(userId: number, userData: Partial<typeof users.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(users).set(userData).where(eq(users.id, userId));
}

export async function updateUserPassword(userId: number, newPassword: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const passwordHash = await bcryptjs.hash(newPassword, 10);
  return db.update(users).set({ passwordHash }).where(eq(users.id, userId));
}

export async function blockUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(users).set({ isBlocked: 1 }).where(eq(users.id, userId));
}

export async function unblockUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(users).set({ isBlocked: 0 }).where(eq(users.id, userId));
}

export async function getAllUsers(limit: number = 100, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(users)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);
}

// Analytics queries
export async function getTodayOrdersCount() {
  const db = await getDb();
  if (!db) return 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const result = await db.select({ count: sql`COUNT(*)` }).from(orders)
    .where(and(gte(orders.createdAt, today), lte(orders.createdAt, tomorrow)));
  
  return Number(result[0]?.count) || 0;
}

export async function getTodayRevenue() {
  const db = await getDb();
  if (!db) return 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const result = await db.select({ total: sql`SUM(${orders.total})` }).from(orders)
    .where(and(gte(orders.createdAt, today), lte(orders.createdAt, tomorrow)));
  
  return Number(result[0]?.total) || 0;
}

export async function getMonthRevenue() {
  const db = await getDb();
  if (!db) return 0;
  
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  const result = await db.select({ total: sql`SUM(${orders.total})` }).from(orders)
    .where(and(gte(orders.createdAt, firstDay), lte(orders.createdAt, lastDay)));
  
  return Number(result[0]?.total) || 0;
}

export async function getActiveProductsCount() {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db.select({ count: sql`COUNT(*)` }).from(products)
    .where(eq(products.isActive, 1));
  
  return Number(result[0]?.count) || 0;
}

export async function getTotalUsersCount() {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db.select({ count: sql`COUNT(*)` }).from(users);
  return Number(result[0]?.count) || 0;
}

export async function getLowStockProducts(threshold: number = 10) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(products)
    .where(and(eq(products.isActive, 1), lte(products.stock, threshold)))
    .orderBy(asc(products.stock));
}

export async function getRecentOrders(days: number = 7) {
  const db = await getDb();
  if (!db) return [];
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return db.select().from(orders)
    .where(gte(orders.createdAt, startDate))
    .orderBy(desc(orders.createdAt));
}

export async function getRevenueTrend() {
  const db = await getDb();
  if (!db) return [];

  // Get data for the last 6 months
  const months = [];
  const now = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = d.toLocaleString('id-ID', { month: 'short' });
    const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    
    const result = await db.select({
      revenue: sql`SUM(${orders.total})`,
      orders: sql`COUNT(*)`
    }).from(orders)
      .where(and(gte(orders.createdAt, firstDay), lte(orders.createdAt, lastDay)));
      
    months.push({
      name: monthName,
      revenue: Number(result[0]?.revenue) || 0,
      orders: Number(result[0]?.orders) || 0,
    });
  }
  
  return months;
}

// Wishlist queries


export async function getWishlistItems(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select({
    id: wishlists.id,
    userId: wishlists.userId,
    productId: wishlists.productId,
    createdAt: wishlists.createdAt,
    product: {
      id: products.id,
      name: products.name,
      slug: products.slug,
      price: products.price,
      stock: products.stock,
      imageUrl: products.imageUrl,
    }
  })
    .from(wishlists)
    .innerJoin(products, eq(wishlists.productId, products.id))
    .where(eq(wishlists.userId, userId))
    .orderBy(desc(wishlists.createdAt));
}

export async function addToWishlist(userId: number, productId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await db.select().from(wishlists)
    .where(and(eq(wishlists.userId, userId), eq(wishlists.productId, productId)))
    .limit(1);
    
  if (existing.length > 0) return existing[0];
  
  return db.insert(wishlists).values({ userId, productId });
}

export async function removeFromWishlist(userId: number, productId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.delete(wishlists).where(
    and(eq(wishlists.userId, userId), eq(wishlists.productId, productId))
  );
}

// Coupon queries


export async function getCouponByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(coupons).where(eq(coupons.code, code)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateCouponUsage(couponId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(coupons)
    .set({ usageCount: sql`${coupons.usageCount} + 1` })
    .where(eq(coupons.id, couponId));
}

// Site Settings queries
export async function getSetting(key: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
  if (result.length === 0) return undefined;
  
  try {
    return JSON.parse(result[0].value);
  } catch {
    return result[0].value;
  }
}

export async function updateSetting(key: string, value: unknown) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
  
  // Check if exists
  const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
  
  if (existing.length > 0) {
    return db.update(siteSettings).set({ value: stringValue }).where(eq(siteSettings.key, key));
  } else {
    return db.insert(siteSettings).values({ key, value: stringValue });
  }
}
