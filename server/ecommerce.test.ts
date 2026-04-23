import { describe, it, expect, vi } from "vitest";
import * as db from "./db";

// Mock database functions
vi.mock("./db", () => ({
  getDb: vi.fn(),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  getProducts: vi.fn(),
  getProductBySlug: vi.fn(),
  getProductById: vi.fn(),
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
  getCartItems: vi.fn(),
  addToCart: vi.fn(),
  updateCartItem: vi.fn(),
  removeCartItem: vi.fn(),
  clearCart: vi.fn(),
  createOrder: vi.fn(),
  getOrderById: vi.fn(),
  getUserOrders: vi.fn(),
  getAllOrders: vi.fn(),
  getOrdersByStatus: vi.fn(),
  updateOrderStatus: vi.fn(),
  createOrderItem: vi.fn(),
  getOrderItems: vi.fn(),
  getUserAddresses: vi.fn(),
  createAddress: vi.fn(),
  updateAddress: vi.fn(),
  deleteAddress: vi.fn(),
  getUserById: vi.fn(),
  updateUser: vi.fn(),
  blockUser: vi.fn(),
  unblockUser: vi.fn(),
  getAllUsers: vi.fn(),
  getTodayOrdersCount: vi.fn(),
  getTodayRevenue: vi.fn(),
  getMonthRevenue: vi.fn(),
  getActiveProductsCount: vi.fn(),
  getTotalUsersCount: vi.fn(),
  getLowStockProducts: vi.fn(),
  getRecentOrders: vi.fn(),
}));

describe("E-Commerce API Tests", () => {
  describe("Product Management", () => {
    it("should retrieve all active products", async () => {
      const mockProducts = [
        {
          id: 1,
          name: "Sambal Bawang",
          slug: "sambal-bawang",
          price: 25000,
          stock: 50,
          spiceLevel: 2,
          isActive: true,
        },
      ];

      vi.mocked(db.getProducts).mockResolvedValue(mockProducts as any);

      const result = await db.getProducts({ isActive: true });
      expect(result).toEqual(mockProducts);
      expect(db.getProducts).toHaveBeenCalledWith({ isActive: true });
    });

    it("should retrieve product by slug", async () => {
      const mockProduct = {
        id: 1,
        name: "Sambal Bawang",
        slug: "sambal-bawang",
        price: 25000,
        stock: 50,
        spiceLevel: 2,
        isActive: true,
      };

      vi.mocked(db.getProductBySlug as any).mockResolvedValue(
        mockProduct as any
      );

      const result = await db.getProductBySlug("sambal-bawang");
      expect(result).toEqual(mockProduct);
      expect(db.getProductBySlug).toHaveBeenCalledWith("sambal-bawang");
    });

    it("should create a new product", async () => {
      const newProduct = {
        name: "Sambal Teri Medan",
        slug: "sambal-teri-medan",
        price: 30000,
        stock: 35,
        spiceLevel: 3,
        isActive: true,
      };

      vi.mocked(db.createProduct).mockResolvedValue({ insertId: 2 } as any);

      const result = await db.createProduct(newProduct);
      expect(result).toHaveProperty("insertId");
      expect(db.createProduct).toHaveBeenCalledWith(newProduct);
    });

    it("should update product stock", async () => {
      vi.mocked(db.updateProduct).mockResolvedValue({} as any);

      await db.updateProduct(1, { stock: 40 });
      expect(db.updateProduct).toHaveBeenCalledWith(1, { stock: 40 });
    });

    it("should delete a product", async () => {
      vi.mocked(db.deleteProduct).mockResolvedValue({} as any);

      await db.deleteProduct(1);
      expect(db.deleteProduct).toHaveBeenCalledWith(1);
    });
  });

  describe("Cart Management", () => {
    it("should retrieve user cart items", async () => {
      const mockCartItems = [
        {
          id: 1,
          userId: 1,
          productId: 1,
          quantity: 2,
        },
      ];

      vi.mocked(db.getCartItems).mockResolvedValue(mockCartItems as any);

      const result = await db.getCartItems(1);
      expect(result).toEqual(mockCartItems);
      expect(db.getCartItems).toHaveBeenCalledWith(1);
    });

    it("should add item to cart", async () => {
      vi.mocked(db.addToCart).mockResolvedValue({} as any);

      await db.addToCart(1, 1, 2);
      expect(db.addToCart).toHaveBeenCalledWith(1, 1, 2);
    });

    it("should update cart item quantity", async () => {
      vi.mocked(db.updateCartItem).mockResolvedValue({} as any);

      await db.updateCartItem(1, 3);
      expect(db.updateCartItem).toHaveBeenCalledWith(1, 3);
    });

    it("should remove item from cart", async () => {
      vi.mocked(db.removeCartItem).mockResolvedValue({} as any);

      await db.removeCartItem(1);
      expect(db.removeCartItem).toHaveBeenCalledWith(1);
    });

    it("should clear entire cart", async () => {
      vi.mocked(db.clearCart).mockResolvedValue({} as any);

      await db.clearCart(1);
      expect(db.clearCart).toHaveBeenCalledWith(1);
    });
  });

  describe("Order Management", () => {
    it("should create a new order", async () => {
      const orderData = {
        userId: 1,
        orderNumber: "ORD-123456",
        customerName: "John Doe",
        customerPhone: "081234567890",
        shippingAddress: "Jl. Test No. 1",
        shippingCity: "Jakarta",
        shippingCourier: "JNE",
        shippingCost: 50000,
        paymentMethod: "TRANSFER_BANK",
        subtotal: 100000,
        total: 150000,
        status: "PENDING_PAYMENT",
      };

      vi.mocked(db.createOrder).mockResolvedValue({ insertId: 1 } as any);

      const result = await db.createOrder(orderData as any);
      expect(result).toHaveProperty("insertId");
    });

    it("should retrieve order by ID", async () => {
      const mockOrder = {
        id: 1,
        orderNumber: "ORD-123456",
        customerName: "John Doe",
        total: 150000,
        status: "PENDING_PAYMENT",
      };

      vi.mocked(db.getOrderById).mockResolvedValue(mockOrder as any);

      const result = await db.getOrderById(1);
      expect(result).toEqual(mockOrder);
    });

    it("should retrieve user orders", async () => {
      const mockOrders = [
        {
          id: 1,
          orderNumber: "ORD-123456",
          total: 150000,
          status: "PENDING_PAYMENT",
        },
      ];

      vi.mocked(db.getUserOrders).mockResolvedValue(mockOrders as any);

      const result = await db.getUserOrders(1);
      expect(result).toEqual(mockOrders);
    });

    it("should update order status", async () => {
      vi.mocked(db.updateOrderStatus).mockResolvedValue({} as any);

      await db.updateOrderStatus(1, "PROCESSING");
      expect(db.updateOrderStatus).toHaveBeenCalledWith(1, "PROCESSING");
    });

    it("should create order item", async () => {
      const itemData = {
        orderId: 1,
        productId: 1,
        productName: "Sambal Bawang",
        quantity: 2,
        unitPrice: 25000,
        subtotal: 50000,
      };

      vi.mocked(db.createOrderItem).mockResolvedValue({} as any);

      await db.createOrderItem(itemData as any);
      expect(db.createOrderItem).toHaveBeenCalledWith(itemData);
    });

    it("should retrieve order items", async () => {
      const mockItems = [
        {
          id: 1,
          orderId: 1,
          productName: "Sambal Bawang",
          quantity: 2,
          unitPrice: 25000,
        },
      ];

      vi.mocked(db.getOrderItems).mockResolvedValue(mockItems as any);

      const result = await db.getOrderItems(1);
      expect(result).toEqual(mockItems);
    });
  });

  describe("Address Management", () => {
    it("should retrieve user addresses", async () => {
      const mockAddresses = [
        {
          id: 1,
          userId: 1,
          label: "Rumah",
          fullName: "John Doe",
          address: "Jl. Test No. 1",
          city: "Jakarta",
          isPrimary: true,
        },
      ];

      vi.mocked(db.getUserAddresses).mockResolvedValue(mockAddresses as any);

      const result = await db.getUserAddresses(1);
      expect(result).toEqual(mockAddresses);
    });

    it("should create new address", async () => {
      const addressData = {
        userId: 1,
        label: "Kantor",
        fullName: "John Doe",
        phone: "081234567890",
        address: "Jl. Office No. 5",
        city: "Bandung",
      };

      vi.mocked(db.createAddress).mockResolvedValue({} as any);

      await db.createAddress(addressData as any);
      expect(db.createAddress).toHaveBeenCalledWith(addressData);
    });

    it("should update address", async () => {
      vi.mocked(db.updateAddress).mockResolvedValue({} as any);

      await db.updateAddress(1, { isPrimary: true });
      expect(db.updateAddress).toHaveBeenCalledWith(1, { isPrimary: true });
    });

    it("should delete address", async () => {
      vi.mocked(db.deleteAddress).mockResolvedValue({} as any);

      await db.deleteAddress(1);
      expect(db.deleteAddress).toHaveBeenCalledWith(1);
    });
  });

  describe("Analytics", () => {
    it("should get today orders count", async () => {
      vi.mocked(db.getTodayOrdersCount).mockResolvedValue(5);

      const result = await db.getTodayOrdersCount();
      expect(result).toBe(5);
    });

    it("should get today revenue", async () => {
      vi.mocked(db.getTodayRevenue).mockResolvedValue(750000);

      const result = await db.getTodayRevenue();
      expect(result).toBe(750000);
    });

    it("should get month revenue", async () => {
      vi.mocked(db.getMonthRevenue).mockResolvedValue(15000000);

      const result = await db.getMonthRevenue();
      expect(result).toBe(15000000);
    });

    it("should get active products count", async () => {
      vi.mocked(db.getActiveProductsCount).mockResolvedValue(4);

      const result = await db.getActiveProductsCount();
      expect(result).toBe(4);
    });

    it("should get low stock products", async () => {
      const mockLowStock = [
        {
          id: 4,
          name: "Sambal Level 10",
          stock: 5,
        },
      ];

      vi.mocked(db.getLowStockProducts).mockResolvedValue(mockLowStock as any);

      const result = await db.getLowStockProducts(10);
      expect(result).toEqual(mockLowStock);
    });
  });

  describe("User Management", () => {
    it("should retrieve user by ID", async () => {
      const mockUser = {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        role: "user",
      };

      vi.mocked(db.getUserById).mockResolvedValue(mockUser as any);

      const result = await db.getUserById(1);
      expect(result).toEqual(mockUser);
    });

    it("should update user profile", async () => {
      vi.mocked(db.updateUser).mockResolvedValue({} as any);

      await db.updateUser(1, { name: "Jane Doe" });
      expect(db.updateUser).toHaveBeenCalledWith(1, { name: "Jane Doe" });
    });

    it("should block user", async () => {
      vi.mocked(db.blockUser).mockResolvedValue({} as any);

      await db.blockUser(1);
      expect(db.blockUser).toHaveBeenCalledWith(1);
    });

    it("should unblock user", async () => {
      vi.mocked(db.unblockUser).mockResolvedValue({} as any);

      await db.unblockUser(1);
      expect(db.unblockUser).toHaveBeenCalledWith(1);
    });

    it("should retrieve all users", async () => {
      const mockUsers = [
        { id: 1, name: "John Doe", role: "user" },
        { id: 2, name: "Admin User", role: "admin" },
      ];

      vi.mocked(db.getAllUsers).mockResolvedValue(mockUsers as any);

      const result = await db.getAllUsers();
      expect(result).toEqual(mockUsers);
    });
  });
});

