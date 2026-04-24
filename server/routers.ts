import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { eq, and } from "drizzle-orm";
import { Buffer } from "node:buffer";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import {
  publicProcedure,
  router,
  protectedProcedure,
  adminProcedure,
} from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { sdk } from "./_core/sdk";
import { notifyOwner } from "./_core/notification";
import { createMidtransTransaction, getTransactionStatus } from "./midtrans";
import { syncPendingOrdersWithMidtrans } from "./payment-sync";

// Helper to exclude sensitive fields from user response
function sanitizeUser(user: db.User) {
  if (!user) return null;
  return {
    id: user.id,
    openId: user.openId || null,
    email: user.email,
    name: user.name || null,
    phone: user.phone || null,
    loginMethod: user.loginMethod || null,
    role: user.role || "user",
    isBlocked: user.isBlocked || false,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastSignedIn: user.lastSignedIn,
  };
}

// Validation schemas
const productFilterSchema = z.object({
  isActive: z.boolean().optional(),
  search: z.string().optional(),
});

const cartItemSchema = z.object({
  productId: z.number(),
  quantity: z.number().min(1),
});

const addressSchema = z.object({
  label: z.string().optional(),
  fullName: z.string().min(1),
  phone: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  postalCode: z.string().optional(),
  isPrimary: z.boolean().optional(),
});

const checkoutSchema = z.object({
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  customerEmail: z.string().email().optional().or(z.literal("")),
  shippingAddress: z.string().min(1),
  shippingCity: z.string().optional().default(""),
  shippingPostalCode: z.string().optional(),
  shippingCourier: z.enum([
    "jne",
    "jnt",
    "sicepat",
    "pos",
    "tiki",
    "JNE",
    "J&T",
    "SiCepat",
  ]),
  shippingCost: z.number().min(0),
  paymentMethod: z.enum(["TRANSFER_BANK", "QRIS", "MIDTRANS"]),
  paymentBank: z.enum(["BCA", "Mandiri", "BNI"]).optional(),
  notes: z.string().optional(),
  couponCode: z.string().optional(),
  cartItems: z.array(
    z.object({
      productId: z.number(),
      quantity: z.number().min(1),
    })
  ),
});

// Analytics routes
// Remove unused analyticsSchema

import * as shippingService from "./shipping";

export const appRouter = router({
  system: systemRouter,

  shipping: router({
    getProvinces: publicProcedure.query(async () => {
      return shippingService.getProvinces();
    }),
    getCost: publicProcedure
      .input(
        z.object({
          provinceId: z.string(),
          courier: z.string(),
        })
      )
      .query(async ({ input }) => {
        return shippingService.getShippingCost(input.provinceId, input.courier);
      }),
  }),

  auth: router({
    me: publicProcedure.query(opts =>
      opts.ctx.user ? sanitizeUser(opts.ctx.user) : null
    ),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),

    login: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(1),
          isAdminLogin: z.boolean().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          const dbInstance = await db.getDb();
          if (!dbInstance) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Koneksi database gagal. Silakan hubungi administrator.",
            });
          }

          const user = await db.verifyPassword(input.email, input.password);

          if (!user) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "Email atau password salah. Silakan coba lagi.",
            });
          }

          if (user.isBlocked) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message:
                "Akun Anda telah dinonaktifkan. Silakan hubungi dukungan.",
            });
          }

          if (input.isAdminLogin && user.role !== "admin") {
            throw new TRPCError({
              code: "FORBIDDEN",
              message:
                "Akses ditolak. Anda tidak memiliki hak akses administrator.",
            });
          }

          if (!user.openId) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "User account is missing openId identifier",
            });
          }

          const sessionToken = await sdk.createSessionToken(user.openId, {
            name: user.name || "",
            expiresInMs: ONE_YEAR_MS,
          });

          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, sessionToken, {
            ...cookieOptions,
            maxAge: ONE_YEAR_MS,
          });

          return {
            success: true,
            user: sanitizeUser(user),
          };
        } catch (error) {
          if (error instanceof TRPCError) throw error;

          // Check for ECONNREFUSED or other DB errors
          const errorMsg = String(error);
          if (
            errorMsg.includes("ECONNREFUSED") ||
            errorMsg.includes("connect")
          ) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message:
                "Gagal menghubungkan ke database. Pastikan layanan MySQL Anda aktif.",
            });
          }

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Terjadi kesalahan internal saat proses login.",
          });
        }
      }),

    // Database-based register
    register: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(6),
          name: z.string().optional(),
          phone: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          // Check if user already exists
          const existing = await db.getUserByEmail(input.email);
          if (existing) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Email already registered",
            });
          }

          // Create new user
          const user = await db.createDatabaseUser({
            email: input.email,
            password: input.password,
            name: input.name,
            phone: input.phone,
            role: "user",
          });

          if (!user) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to create user",
            });
          }

          if (!user.openId) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to generate openId for new user",
            });
          }

          // Create session token
          const sessionToken = await sdk.createSessionToken(user.openId, {
            name: user.name || "",
            expiresInMs: ONE_YEAR_MS,
          });

          // Set cookie
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, sessionToken, {
            ...cookieOptions,
            maxAge: ONE_YEAR_MS,
          });

          return {
            success: true,
            user: sanitizeUser(user),
          };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Registration failed",
          });
        }
      }),

    // Change password
    changePassword: protectedProcedure
      .input(
        z.object({
          currentPassword: z.string().min(1),
          newPassword: z.string().min(6),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          const user = await db.getUserById(ctx.user!.id);
          if (!user || !user.email) {
            throw new TRPCError({ code: "UNAUTHORIZED" });
          }

          // Verify current password
          const isValid = await db.verifyPassword(
            user.email,
            input.currentPassword
          );
          if (!isValid) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "Current password is incorrect",
            });
          }

          // Update to new password
          await db.updateUserPassword(ctx.user!.id, input.newPassword);

          return { success: true };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to change password",
          });
        }
      }),
  }),

  // Product routes
  products: router({
    list: publicProcedure
      .input(productFilterSchema)
      .query(async ({ input }) => {
        return db.getProducts({
          isActive: input.isActive ?? true,
          search: input.search,
        });
      }),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const product = await db.getProductBySlug(input.slug);
        if (!product) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return product;
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const product = await db.getProductById(input.id);
        if (!product) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return product;
      }),

    create: adminProcedure
      .input(
        z.object({
          name: z.string().min(1),
          slug: z.string().min(1),
          description: z.string().optional(),
          price: z.number().min(0),
          stock: z.number().min(0),
          spiceLevel: z.number().min(1).max(5),
          imageUrl: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        // Check for duplicate slug
        const existing = await db.getProductBySlug(input.slug);
        if (existing) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Product with slug '${input.slug}' already exists`,
          });
        }

        return db.createProduct({
          name: input.name,
          slug: input.slug,
          description: input.description,
          price: input.price,
          stock: input.stock,
          spiceLevel: input.spiceLevel,
          imageUrl: input.imageUrl,
          isActive: 1,
        });
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          slug: z.string().optional(),
          description: z.string().optional(),
          price: z.number().optional(),
          stock: z.number().optional(),
          spiceLevel: z.number().optional(),
          imageUrl: z.string().optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;

        // 1. Check if product exists
        const existing = await db.getProductById(id);
        if (!existing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Product not found",
          });
        }

        // 2. If slug is changing, check for uniqueness
        if (data.slug && data.slug !== existing.slug) {
          const duplicate = await db.getProductBySlug(data.slug);
          if (duplicate) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Slug '${data.slug}' is already taken by another product`,
            });
          }
        }

        return db.updateProduct(id, {
          ...data,
          isActive: data.isActive === undefined ? undefined : (data.isActive ? 1 : 0),
        });
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const existing = await db.getProductById(input.id);
        if (!existing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Product not found",
          });
        }
        return db.deleteProduct(input.id);
      }),

    generateImage: adminProcedure
      .input(
        z.object({
          productId: z.number(),
          prompt: z
            .string()
            .min(10, "Prompt minimal 10 karakter")
            .max(500, "Prompt maksimal 500 karakter"),
          numOutputs: z.number().min(1).max(4).default(1),
          imageSize: z
            .enum(["256x256", "512x512", "768x768"])
            .default("512x512"),
        })
      )
      .mutation(async ({ input }) => {
        try {
          // Validate product exists
          const product = await db.getProductById(input.productId);
          if (!product) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Product tidak ditemukan",
            });
          }

          // Import image generation service
          const { generateProductImage, validatePrompt } = await import(
            "./_core/imageApi.js"
          );

          // Validate prompt
          if (!validatePrompt(input.prompt)) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                "Prompt tidak valid atau mengandung konten yang tidak diijinkan",
            });
          }

          // Generate image
          const generatedImages = await generateProductImage({
            prompt: input.prompt,
            numOutputs: input.numOutputs,
            imageSize: input.imageSize,
          });

          // Use first generated image
          if (generatedImages.length > 0) {
            const imageUrl = generatedImages[0].url;

            // Update product with generated image
            await db.updateProduct(input.productId, {
              imageUrl,
            });
          }

          return {
            success: true,
            imageUrl: generatedImages[0]?.url,
            generatedImages,
            message: `${generatedImages.length} gambar berhasil di-generate`,
          };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal generate gambar: " + String(error),
          });
        }
      }),
  }),

  // Cart routes
  cart: router({
    getItems: protectedProcedure.query(async ({ ctx }) => {
      return db.getCartItems(ctx.user!.id);
    }),

    addItem: protectedProcedure
      .input(cartItemSchema)
      .mutation(async ({ ctx, input }) => {
        const product = await db.getProductById(input.productId);
        if (!product) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Product not found",
          });
        }
        if (product.stock < input.quantity) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Insufficient stock",
          });
        }
        return db.addToCart(ctx.user!.id, input.productId, input.quantity);
      }),

    updateItem: protectedProcedure
      .input(z.object({ cartItemId: z.number(), quantity: z.number().min(0) }))
      .mutation(async ({ ctx, input }) => {
        const drizzle = await db.getDb();
        if (!drizzle) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Ownership check
        const item = await drizzle
          .select()
          .from(db.cartItems)
          .where(
            and(
              eq(db.cartItems.id, input.cartItemId),
              eq(db.cartItems.userId, ctx.user.id)
            )
          )
          .limit(1);

        if (item.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Cart item not found",
          });
        }

        return db.updateCartItem(input.cartItemId, input.quantity);
      }),

    removeItem: protectedProcedure
      .input(z.object({ cartItemId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const drizzle = await db.getDb();
        if (!drizzle) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Ownership check
        const item = await drizzle
          .select()
          .from(db.cartItems)
          .where(
            and(
              eq(db.cartItems.id, input.cartItemId),
              eq(db.cartItems.userId, ctx.user.id)
            )
          )
          .limit(1);

        if (item.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Cart item not found",
          });
        }

        return db.removeCartItem(input.cartItemId);
      }),

    clear: protectedProcedure.mutation(async ({ ctx }) => {
      return db.clearCart(ctx.user!.id);
    }),
  }),

  // Order routes
  orders: router({
    create: publicProcedure
      .input(checkoutSchema)
      .mutation(async ({ ctx, input }) => {
        const drizzle = await db.getDb();
        if (!drizzle)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });

        return await drizzle.transaction(async tx => {
          // 1. Calculate totals and check stock
          let subtotal = 0;
          const itemsToProcess = [];

          for (const item of input.cartItems) {
            const [product] = await tx
              .select()
              .from(db.products)
              .where(eq(db.products.id, item.productId));

            if (!product)
              throw new TRPCError({
                code: "NOT_FOUND",
                message: `Produk ${item.productId} tidak ditemukan`,
              });
            if (product.stock < item.quantity)
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: `Stok ${product.name} tidak mencukupi`,
              });

            subtotal += product.price * item.quantity;
            itemsToProcess.push({ product, quantity: item.quantity });
          }

          // 2. Handle Coupon
          let discountAmount = 0;
          let couponId = null;
          if (input.couponCode) {
            const [coupon] = await tx
              .select()
              .from(db.coupons)
              .where(
                and(
                  eq(db.coupons.code, input.couponCode),
                  eq(db.coupons.isActive, 1)
                )
              )
              .limit(1);

            if (!coupon)
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Kupon tidak valid",
              });
            if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit)
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Kuota kupon sudah habis",
              });
            if (subtotal < coupon.minOrderAmount)
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: `Minimal belanja untuk kupon ini adalah Rp${coupon.minOrderAmount.toLocaleString("id-ID")}`,
              });

            if (coupon.discountType === "FIXED") {
              discountAmount = coupon.discountValue;
            } else {
              discountAmount = Math.floor(
                (subtotal * coupon.discountValue) / 100
              );
              if (coupon.maxDiscountAmount)
                discountAmount = Math.min(
                  discountAmount,
                  coupon.maxDiscountAmount
                );
            }
            couponId = coupon.id;
          }

          const total = Math.max(
            0,
            subtotal + input.shippingCost - discountAmount
          );
          const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          // 3. Create Order
          const [orderResult] = await tx.insert(db.orders).values({
            userId: ctx.user?.id || null,
            orderNumber,
            customerName: input.customerName,
            customerPhone: input.customerPhone,
            customerEmail: input.customerEmail || null,
            shippingAddress: input.shippingAddress,
            shippingCity: input.shippingCity,
            shippingPostalCode: input.shippingPostalCode || null,
            shippingCourier: input.shippingCourier,
            shippingCost: input.shippingCost,
            paymentMethod: input.paymentMethod,
            paymentBank: input.paymentBank || null,
            couponId,
            discountAmount,
            subtotal,
            total,
            status: "PENDING_PAYMENT",
            notes: input.notes || null,
            trackingNumber: null,
          });

          const orderIdResult =
            (orderResult as unknown as { insertId: number }).insertId ||
            (orderResult as unknown as [{ insertId: number }])[0]?.insertId;
          const orderId = Number(orderIdResult);
          if (!orderId)
            throw new Error("Gagal mendapatkan ID pesanan dari database");

          // 4. Create Order Items and Update Stock
          for (const item of itemsToProcess) {
            await tx.insert(db.orderItems).values({
              orderId,
              productId: item.product.id,
              productName: item.product.name,
              quantity: item.quantity,
              unitPrice: item.product.price,
              subtotal: item.product.price * item.quantity,
            });

            // Atomic decrement within transaction
            await tx
              .update(db.products)
              .set({ stock: db.sql`${db.products.stock} - ${item.quantity}` })
              .where(eq(db.products.id, item.product.id));
          }

          // 5. Update Coupon Usage
          if (couponId) {
            await tx
              .update(db.coupons)
              .set({ usageCount: db.sql`${db.coupons.usageCount} + 1` })
              .where(db.eq(db.coupons.id, couponId));
          }

          // 6. Clear Cart
          if (ctx.user?.id) {
            await tx
              .delete(db.cartItems)
              .where(db.eq(db.cartItems.userId, ctx.user.id));
          }

          // 7. Notify Owner
          try {
            await notifyOwner({
              title: "💰 Pesanan Baru Diterima!",
              content: `Pesanan #${orderNumber} telah dibuat oleh ${input.customerName}.\nTotal: Rp${total.toLocaleString("id-ID")}\nMetode: ${input.paymentMethod}`,
            });
          } catch {
            // Silently fail notification
          }

          return { orderId, orderNumber, total };
        });
      }),

    uploadPaymentProof: publicProcedure
      .input(z.object({ orderId: z.number(), imageUrl: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const order = await db.getOrderById(input.orderId);
        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Pesanan tidak ditemukan",
          });
        }

        // Authorization: If order has userId, check it matches. If guest (userId null), allow anyone with the orderId.
        if (
          order.userId &&
          ctx.user?.id !== order.userId &&
          ctx.user?.role !== "admin"
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Bukan pemilik pesanan",
          });
        }
        if (order.status !== "PENDING_PAYMENT") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Pesanan tidak dalam status menunggu pembayaran",
          });
        }

        await db.updateOrderPaymentProof(order.id, input.imageUrl);

        try {
          await notifyOwner({
            title: "📸 Bukti Bayar Baru!",
            content: `Pelanggan ${order.customerName} telah mengunggah bukti pembayaran untuk #${order.orderNumber}.`,
          });
          } catch {
            // Silently fail notification
          }

        return { success: true };
      }),

    createPaymentToken: publicProcedure
      .input(z.object({ orderId: z.number() }))
      .mutation(async ({ input }) => {
        const order = await db.getOrderById(input.orderId);
        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Pesanan tidak ditemukan",
          });
        }

        // PREVENT DUPLICATE PAYMENT
        // If order is already paid, shipped, or completed, block new payment requests
        if (order.status !== "PENDING_PAYMENT") {
          let message = "Pesanan ini sudah dibayar atau sedang diproses.";
          if (order.status === "CANCELLED") {
            message = "Pesanan ini sudah dibatalkan dan tidak dapat dibayar.";
          }
          
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: message,
          });
        }

        try {
          const midtransResponse = await createMidtransTransaction({
            orderNumber: order.orderNumber,
            total: order.total,
            customerName: order.customerName,
            customerEmail: order.customerEmail || undefined,
            customerPhone: order.customerPhone,
          });

          return {
            snapToken: midtransResponse.token,
            redirectUrl: midtransResponse.redirect_url,
          };
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              error instanceof Error
                ? error.message
                : "Gagal mendapatkan token pembayaran",
          });
        }
      }),

    checkPaymentStatus: publicProcedure
      .input(z.object({ orderId: z.number() }))
      .mutation(async ({ input }) => {
        const order = await db.getOrderById(input.orderId);
        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Pesanan tidak ditemukan",
          });
        }

        try {
          const status = await getTransactionStatus(order.orderNumber);

          // Midtrans success statuses: 'settlement' or 'capture' (for CC)
          if (
            status.transaction_status === "settlement" ||
            status.transaction_status === "capture"
          ) {
            await db.updateOrderStatus(order.id, "PROCESSING");
            return { paid: true, status: status.transaction_status };
          }

          return { paid: false, status: status.transaction_status };
        } catch {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memverifikasi pembayaran ke Midtrans",
          });
        }
      }),

    getById: publicProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ input }) => {
        const order = await db.getOrderById(input.orderId);
        if (!order) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        const items = await db.getOrderItems(input.orderId);
        return { ...order, items };
      }),

    getUserOrders: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserOrders(ctx.user!.id);
    }),

    getAllOrders: adminProcedure
      .input(
        z.object({
          limit: z.number().optional(),
          offset: z.number().optional(),
        })
      )
      .query(async ({ input }) => {
        return db.getAllOrders(input.limit, input.offset);
      }),

    getByStatus: adminProcedure
      .input(
        z.object({
          status: z.enum([
            "PENDING_PAYMENT",
            "PROCESSING",
            "SHIPPED",
            "COMPLETED",
            "CANCELLED",
          ]),
        })
      )
      .query(async ({ input }) => {
        return db.getOrdersByStatus(input.status);
      }),

    updateStatus: adminProcedure
      .input(
        z.object({
          orderId: z.number(),
          status: z.enum([
            "PENDING_PAYMENT",
            "PROCESSING",
            "SHIPPED",
            "COMPLETED",
            "CANCELLED",
          ]),
          trackingNumber: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return db.updateOrderStatus(input.orderId, input.status, input.trackingNumber);
      }),

    orderAgain: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        try {
          const order = await db.getOrderById(input.orderId);
          if (!order || order.userId !== ctx.user!.id) {
            throw new TRPCError({ code: "FORBIDDEN" });
          }

          const orderItems = await db.getOrderItems(input.orderId);

          for (const item of orderItems) {
            const product = await db.getProductById(item.productId);
            if (!product || product.stock < item.quantity) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: `${item.productName} is out of stock`,
              });
            }
          }

          // For now, return the items so user can checkout with the same products
          return {
            items: orderItems.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            shippingCity: order.shippingCity,
            shippingCourier: order.shippingCourier,
          };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to repeat order",
          });
        }
      }),

    cancelOrder: protectedProcedure
      .input(z.object({ orderId: z.number(), reason: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const order = await db.getOrderById(input.orderId);
        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Pesanan tidak ditemukan",
          });
        }

        // Authorization: Owner or Admin
        if (order.userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Bukan pemilik pesanan",
          });
        }
        if (
          order.status !== "PENDING_PAYMENT" &&
          order.status !== "PROCESSING"
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Pesanan tidak dapat dibatalkan",
          });
        }

        await db.updateOrderStatus(order.id, "CANCELLED");
        return { success: true };
      }),

    deleteOrder: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const order = await db.getOrderById(input.orderId);
        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Pesanan tidak ditemukan",
          });
        }

        // Authorization: Only owner can delete their own history
        if (order.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Bukan pemilik pesanan",
          });
        }

        // Only cancelled orders can be deleted
        if (order.status !== "CANCELLED") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Hanya pesanan yang dibatalkan yang dapat dihapus dari riwayat",
          });
        }

        await db.deleteOrder(order.id);
        return { success: true };
      }),
    
    syncAllPayments: adminProcedure.mutation(async () => {
      await syncPendingOrdersWithMidtrans();
      return { success: true };
    }),
  }),

  // Address routes
  addresses: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserAddresses(ctx.user!.id);
    }),

    create: protectedProcedure
      .input(addressSchema)
      .mutation(async ({ ctx, input }) => {
        return db.createAddress({
          userId: ctx.user!.id,
          ...input,
          isPrimary: input.isPrimary ? 1 : 0,
        });
      }),

    update: protectedProcedure
      .input(z.object({ addressId: z.number(), ...addressSchema.shape }))
      .mutation(async ({ ctx, input }) => {
        const { addressId, ...data } = input;

        const drizzle = await db.getDb();
        if (!drizzle) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Ownership check
        const addr = await drizzle
          .select()
          .from(db.addresses)
          .where(
            and(
              eq(db.addresses.id, addressId),
              eq(db.addresses.userId, ctx.user.id)
            )
          )
          .limit(1);

        if (addr.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Address not found",
          });
        }

        return db.updateAddress(addressId, {
          ...data,
          isPrimary: data.isPrimary === undefined ? undefined : (data.isPrimary ? 1 : 0),
        });
      }),

    delete: protectedProcedure
      .input(z.object({ addressId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const drizzle = await db.getDb();
        if (!drizzle) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Ownership check
        const addr = await drizzle
          .select()
          .from(db.addresses)
          .where(
            and(
              eq(db.addresses.id, input.addressId),
              eq(db.addresses.userId, ctx.user.id)
            )
          )
          .limit(1);

        if (addr.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Address not found",
          });
        }

        return db.deleteAddress(input.addressId);
      }),
  }),

  // User routes
  users: router({
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserById(ctx.user!.id);
    }),

    updateProfile: protectedProcedure
      .input(
        z.object({ name: z.string().optional(), phone: z.string().optional() })
      )
      .mutation(async ({ ctx, input }) => {
        return db.updateUser(ctx.user!.id, input);
      }),

    getAllUsers: adminProcedure
      .input(
        z.object({
          limit: z.number().optional(),
          offset: z.number().optional(),
        })
      )
      .query(async ({ input }) => {
        return db.getAllUsers(input.limit, input.offset);
      }),

    blockUser: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Prevent blocking self
        if (input.userId === ctx.user.id) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Anda tidak dapat memblokir akun Anda sendiri",
          });
        }

        const targetUser = await db.getUserById(input.userId);
        if (!targetUser) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User tidak ditemukan",
          });
        }

        // Prevent blocking other admins
        if (targetUser.role === "admin") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Anda tidak dapat memblokir akun admin lain",
          });
        }

        return db.blockUser(input.userId);
      }),

    unblockUser: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        return db.unblockUser(input.userId);
      }),
  }),

  // Analytics routes
  analytics: router({
    getDashboardStats: adminProcedure.query(async () => {
      const [
        todayOrders,
        todayRevenue,
        monthRevenue,
        activeProducts,
        totalUsers,
        lowStockProducts,
      ] = await Promise.all([
        db.getTodayOrdersCount(),
        db.getTodayRevenue(),
        db.getMonthRevenue(),
        db.getActiveProductsCount(),
        db.getTotalUsersCount(),
        db.getLowStockProducts(10),
      ]);

      return {
        todayOrders,
        todayRevenue,
        monthRevenue,
        activeProducts,
        totalUsers,
        lowStockProducts,
      };
    }),

    getRevenueTrend: adminProcedure.query(async () => {
      return db.getRevenueTrend();
    }),

    getRecentOrders: adminProcedure
      .input(z.object({ days: z.number().optional() }))
      .query(async ({ input }) => {
        return db.getRecentOrders(input.days);
      }),
  }),

  wishlist: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getWishlistItems(ctx.user.id);
    }),
    add: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.addToWishlist(ctx.user.id, input.productId);
        return { success: true };
      }),
    remove: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.removeFromWishlist(ctx.user.id, input.productId);
        return { success: true };
      }),
  }),

  coupons: router({
    list: adminProcedure.query(async () => {
      const drizzle = await db.getDb();
      if (!drizzle) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return await drizzle
        .select()
        .from(db.coupons)
        .orderBy(db.desc(db.coupons.createdAt));
    }),

    create: adminProcedure
      .input(
        z.object({
          code: z.string().min(3),
          description: z.string().optional(),
          discountType: z.enum(["FIXED", "PERCENTAGE"]),
          discountValue: z.number().min(1),
          minOrderAmount: z.number().default(0),
          maxDiscountAmount: z.number().optional(),
          startDate: z.string().optional().nullable(),
          endDate: z.string().optional().nullable(),
          usageLimit: z.number().optional().nullable(),
          isActive: z.boolean().default(true),
        })
      )
      .mutation(async ({ input }) => {
        const drizzle = await db.getDb();
        if (!drizzle) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Uniqueness check
        const existing = await db.getCouponByCode(input.code);
        if (existing) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Coupon with code '${input.code}' already exists`,
          });
        }

        return await drizzle.insert(db.coupons).values({
          ...input,
          isActive: input.isActive ? 1 : 0,
          startDate: input.startDate ? new Date(input.startDate) : null,
          endDate: input.endDate ? new Date(input.endDate) : null,
        });
      }),

    validate: publicProcedure
      .input(z.object({ code: z.string(), subtotal: z.number() }))
      .query(async ({ input }) => {
        const coupon = await db.getCouponByCode(input.code);
        if (!coupon || !coupon.isActive)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Kupon tidak ditemukan atau sudah tidak aktif",
          });
        if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Kuota kupon sudah habis",
          });
        if (input.subtotal < coupon.minOrderAmount)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Minimal belanja untuk kupon ini adalah Rp${coupon.minOrderAmount.toLocaleString("id-ID")}`,
          });

        return coupon;
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const drizzle = await db.getDb();
        if (!drizzle) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        return await drizzle
          .delete(db.coupons)
          .where(db.eq(db.coupons.id, input.id));
      }),
  }),
  media: router({
    upload: adminProcedure
      .input(
        z.object({
          filename: z.string(),
          contentType: z.string().optional(),
          base64Data: z.string(), // Base64 encoded file data
        })
      )
      .mutation(async ({ input }) => {
        const { storagePut } = await import("./storage");

        try {
          // Remove base64 prefix if exists
          const base64Content = input.base64Data.includes(",")
            ? input.base64Data.split(",")[1]
            : input.base64Data;

          const buffer = Buffer.from(base64Content, "base64");
          const result = await storagePut(
            input.filename,
            buffer,
            input.contentType
          );

          return {
            success: true,
            url: result.url,
            key: result.key,
          };
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengunggah media: " + String(error),
          });
        }
      }),
    uploadPublic: publicProcedure
      .input(
        z.object({
          filename: z.string(),
          contentType: z.string().optional(),
          base64Data: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const { storagePut } = await import("./storage");
        try {
          const base64Content = input.base64Data.includes(",")
            ? input.base64Data.split(",")[1]
            : input.base64Data;
          const buffer = Buffer.from(base64Content, "base64");
          // Prefix filename to identify it as payment proof
          const filename = `proof_${Date.now()}_${input.filename}`;
          const result = await storagePut(filename, buffer, input.contentType);
          return { success: true, url: result.url };
        } catch {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengunggah bukti bayar",
          });
        }
      }),
  }),
  settings: router({
    get: publicProcedure
      .input(z.object({ key: z.string() }))
      .query(async ({ input }) => {
        return db.getSetting(input.key);
      }),
    update: adminProcedure
      .input(
        z.object({
          key: z.string(),
          value: z.unknown(),
        })
      )
      .mutation(async ({ input }) => {
        return db.updateSetting(input.key, input.value);
      }),
  }),
});

export type AppRouter = typeof appRouter;

