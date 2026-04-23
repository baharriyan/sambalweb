import { z } from "zod";

/**
 * Validation Schemas untuk Sambal E-Commerce
 * Menggunakan Zod untuk type-safe form validation
 */

// ============ USER & AUTH SCHEMAS ============

export const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  passwordConfirm: z.string(),
}).refine((data) => data.password === data.passwordConfirm, {
  message: "Password tidak sesuai",
  path: ["passwordConfirm"],
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").optional(),
  phone: z.string().min(10, "Nomor telepon tidak valid").optional(),
  email: z.string().email("Email tidak valid").optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Masukkan password saat ini"),
  newPassword: z.string().min(8, "Password baru minimal 8 karakter"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Password tidak sesuai",
  path: ["confirmPassword"],
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// ============ ADDRESS SCHEMAS ============

export const addressSchema = z.object({
  label: z.string().optional().or(z.literal("")),
  fullName: z.string().min(2, "Nama lengkap minimal 2 karakter"),
  phone: z.string()
    .min(10, "Nomor telepon minimal 10 digit")
    .regex(/^(\+62|0)[0-9]{9,12}$/, "Format nomor telepon tidak valid"),
  address: z.string().min(10, "Alamat minimal 10 karakter"),
  city: z.string().min(2, "Kota minimal 2 karakter"),
  postalCode: z.string()
    .min(5, "Kode pos minimal 5 digit")
    .max(5, "Kode pos maksimal 5 digit")
    .regex(/^\d+$/, "Kode pos hanya boleh angka")
    .optional()
    .or(z.literal("")),
  isPrimary: z.boolean().default(false),
});

export type AddressInput = z.infer<typeof addressSchema>;

// ============ PRODUCT SCHEMAS ============

export const productSchema = z.object({
  name: z.string().min(3, "Nama produk minimal 3 karakter"),
  slug: z.string().min(3, "Slug minimal 3 karakter").regex(/^[a-z0-9-]+$/, "Slug hanya boleh huruf kecil, angka, dan dash"),
  description: z.string().optional(),
  price: z.number().int().min(1000, "Harga minimal 1000"),
  stock: z.number().int().min(0, "Stock tidak boleh negatif"),
  spiceLevel: z.number().int().min(1, "Tingkat pedas minimal 1").max(5, "Tingkat pedas maksimal 5"),
  imageUrl: z.string().url("URL gambar tidak valid").optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

export type ProductInput = z.infer<typeof productSchema>;

export const updateProductSchema = productSchema.partial();

export type UpdateProductInput = z.infer<typeof updateProductSchema>;

// ============ CART SCHEMAS ============

export const cartItemSchema = z.object({
  productId: z.number().int().min(1, "Product ID tidak valid"),
  quantity: z.number().int().min(1, "Quantity minimal 1"),
});

export type CartItemInput = z.infer<typeof cartItemSchema>;

// ============ ORDER SCHEMAS ============

export const checkoutSchema = z.object({
  customerName: z.string().min(2, "Nama pelanggan minimal 2 karakter"),
  customerPhone: z.string()
    .min(10, "Nomor telepon minimal 10 digit")
    .regex(/^(\+62|0)[0-9]{9,12}$/, "Format nomor telepon tidak valid"),
  customerEmail: z.string().email("Email tidak valid").optional().or(z.literal("")),
  shippingAddress: z.string().min(10, "Alamat pengiriman minimal 10 karakter"),
  shippingCity: z.string().min(2, "Kota minimal 2 karakter"),
  shippingPostalCode: z.string()
    .min(5, "Kode pos minimal 5 digit")
    .max(5, "Kode pos maksimal 5 digit")
    .regex(/^\d+$/, "Kode pos hanya boleh angka")
    .optional()
    .or(z.literal("")),
  shippingCourier: z.enum(["JNE", "SiCepat", "J&T"]),
  shippingCost: z.number().int().min(0, "Ongkir tidak boleh negatif"),
  paymentMethod: z.enum(["TRANSFER_BANK", "QRIS"]),
  paymentBank: z.enum(["BCA", "Mandiri", "BNI"]).optional(),
  notes: z.string().optional(),
  cartItems: z.array(cartItemSchema).min(1, "Minimal 1 item dalam cart"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const orderStatusSchema = z.enum(["PENDING_PAYMENT", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED"]);

export type OrderStatus = z.infer<typeof orderStatusSchema>;

// ============ SEARCH & FILTER SCHEMAS ============

export const productSearchSchema = z.object({
  search: z.string().optional(),
  isActive: z.boolean().optional(),
  minPrice: z.number().int().optional(),
  maxPrice: z.number().int().optional(),
  spiceLevel: z.number().int().min(1).max(5).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type ProductSearchInput = z.infer<typeof productSearchSchema>;

// ============ ADMIN SCHEMAS ============

export const adminUserFilterSchema = z.object({
  search: z.string().optional(),
  role: z.enum(["user", "admin"]).optional(),
  isBlocked: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type AdminUserFilterInput = z.infer<typeof adminUserFilterSchema>;

export const adminOrderFilterSchema = z.object({
  status: orderStatusSchema.optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type AdminOrderFilterInput = z.infer<typeof adminOrderFilterSchema>;

// ============ PAGINATION SCHEMAS ============

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

// ============ HELPER FUNCTIONS ============

/**
 * Validate form data
 * @returns { data, errors } - data jika valid, errors jika tidak
 */
export async function validateForm<T>(schema: z.ZodSchema, data: unknown): Promise<{
  data: T | null;
  errors: Record<string, string> | null;
}> {
  try {
    const result = await schema.parseAsync(data);
    return { data: result as T, errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.issues.forEach((err) => {
        const path = err.path.join(".");
        errors[path] = err.message;
      });
      return { data: null, errors };
    }
    return { data: null, errors: { _: "Validation error" } };
  }
}

/**
 * Sanitize user input
 * Menghapus XSS dan injection attempts
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, "")
    .replace(/javascript:/gi, "")
    .trim();
}

/**
 * Format Indonesian phone number
 * Convert +62 to 0 or vice versa
 */
export function formatPhoneNumber(phone: string): string {
  phone = phone.replace(/\D/g, "");

  if (phone.startsWith("62")) {
    return "0" + phone.slice(2);
  } else if (phone.startsWith("0")) {
    return phone;
  }

  return phone;
}
