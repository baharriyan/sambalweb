import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { trpc } from "@/lib/trpc";

/**
 * Struktur item dalam cart
 */
export interface CartItemData {
  id: number; // cartItemId dari database (untuk logged-in users)
  productId: number;
  productName?: string;
  quantity: number;
  price: number; // harga per unit
  imageUrl?: string;
  localId?: string; // untuk guest cart (localStorage)
}

export interface CartContextType {
  // State
  items: CartItemData[];
  isLoading: boolean;
  error: string | null;

  // Actions
  addItem: (productId: number, productName: string, price: number, imageUrl?: string, quantity?: number) => Promise<void>;
  updateQuantity: (cartItemId: number | string, quantity: number) => Promise<void>;
  removeItem: (cartItemId: number | string) => Promise<void>;
  clearCart: () => Promise<void>;
  mergeGuestCart: (guestItems: CartItemData[]) => Promise<void>;

  // Calculations
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const GUEST_CART_STORAGE_KEY = "guest_cart_items";
const GUEST_CART_ID_PREFIX = "guest_";

/**
 * CartProvider Component
 * Menyediakan cart state management untuk entire aplikasi
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItemData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // tRPC queries
  const { data: user } = trpc.auth.me.useQuery();
  const getCartItemsQuery = trpc.cart.getItems.useQuery(undefined, {
    enabled: !!user && isInitialized,
  });
  const addItemMutation = trpc.cart.addItem.useMutation();
  const updateItemMutation = trpc.cart.updateItem.useMutation();
  const removeItemMutation = trpc.cart.removeItem.useMutation();
  const clearCartMutation = trpc.cart.clear.useMutation();

  // Initialize cart - load from localStorage untuk guests
  useEffect(() => {
    if (!isInitialized && !user?.id) {
      const savedCart = localStorage.getItem(GUEST_CART_STORAGE_KEY);
      if (savedCart) {
        try {
          setItems(JSON.parse(savedCart));
        } catch (e) {
          console.error("Failed to parse saved cart", e);
        }
      }
      setIsInitialized(true);
    }
  }, [user, isInitialized]);

  // Sync cart data with DB whenever user is logged in and data changes
  useEffect(() => {
    if (user?.id && getCartItemsQuery.data) {
      const dbItems: CartItemData[] = getCartItemsQuery.data.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        imageUrl: item.imageUrl,
      }));
      setItems(dbItems);
      setIsInitialized(true);
    }
  }, [user?.id, getCartItemsQuery.data]);

  // Persist guest cart to localStorage whenever items change
  useEffect(() => {
    if (!user?.id && isInitialized) {
      localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, user?.id, isInitialized]);

  // Sync cart dengan database saat user berubah
  useEffect(() => {
    if (user?.id && isInitialized) {
      // Check kalau perlu merge guest cart ke user cart
      const guestCart = localStorage.getItem(GUEST_CART_STORAGE_KEY);
      if (guestCart) {
        try {
          const guestItems = JSON.parse(guestCart);
          if (guestItems.length > 0) {
            // Merge guest cart ke user cart
            mergeGuestCart(guestItems);
          }
        } catch (e) {
          console.error("Failed to merge guest cart", e);
        }
      }
    }
  }, [user?.id, isInitialized]);

  /**
   * Add item ke cart
   */
  const addItem = useCallback(
    async (productId: number, productName: string, price: number, imageUrl?: string, quantity: number = 1) => {
      try {
        setError(null);
        setIsLoading(true);

        if (user?.id) {
          // User logged in - add ke database
          await addItemMutation.mutateAsync({
            productId,
            quantity,
          });

          // Refresh cart
          if (getCartItemsQuery.refetch) {
            await getCartItemsQuery.refetch();
          }
        } else {
          // Guest - add ke localStorage
          const localId = `${GUEST_CART_ID_PREFIX}${Date.now()}`;
          const newItem: CartItemData = {
            id: 0,
            localId,
            productId,
            productName,
            quantity,
            price,
            imageUrl,
          };

          setItems((prevItems) => {
            const existingItem = prevItems.find((item) => item.productId === productId);
            if (existingItem) {
              return prevItems.map((item) =>
                item.productId === productId
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              );
            } else {
              return [...prevItems, newItem];
            }
          });
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Failed to add item to cart";
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [user?.id, items, addItemMutation, getCartItemsQuery]
  );

  /**
   * Update quantity dari item
   */
  const updateQuantity = useCallback(
    async (cartItemId: number | string, quantity: number) => {
      try {
        setError(null);
        setIsLoading(true);

        if (user?.id && typeof cartItemId === "number") {
          // User logged in - update di database
          if (quantity <= 0) {
            await removeItemMutation.mutateAsync({ cartItemId });
          } else {
            await updateItemMutation.mutateAsync({
              cartItemId,
              quantity,
            });
          }

          // Refresh cart
          if (getCartItemsQuery.refetch) {
            await getCartItemsQuery.refetch();
          }
        } else {
          // Guest - update state
          setItems((prevItems) => {
            if (quantity <= 0) {
              return prevItems.filter((item) => item.localId !== cartItemId);
            }
            return prevItems.map((item) =>
              item.localId === cartItemId
                ? { ...item, quantity }
                : item
            );
          });
        }
      } catch (err: any) {
        setError(err.message || "Failed to update cart item");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [user?.id, items, updateItemMutation, removeItemMutation, getCartItemsQuery]
  );

  /**
   * Remove item dari cart
   */
  const removeItem = useCallback(
    async (cartItemId: number | string) => {
      try {
        setError(null);
        setIsLoading(true);

        if (user?.id && typeof cartItemId === "number") {
          // User logged in - remove dari database
          await removeItemMutation.mutateAsync({ cartItemId });

          // Refresh cart
          if (getCartItemsQuery.refetch) {
            await getCartItemsQuery.refetch();
          }
        } else {
          // Guest - remove dari state
          setItems((prevItems) => prevItems.filter((item) => item.localId !== cartItemId));
        }
      } catch (err: any) {
        setError(err.message || "Failed to remove cart item");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [user?.id, items, removeItemMutation, getCartItemsQuery]
  );

  /**
   * Clear seluruh cart
   */
  const clearCart = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      if (user?.id) {
        // User logged in - clear di database
        await clearCartMutation.mutateAsync();
        
        // Refresh cart
        if (getCartItemsQuery.refetch) {
          await getCartItemsQuery.refetch();
        }
      } else {
        // Guest - clear state
        setItems([]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to clear cart");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, clearCartMutation]);

  /**
   * Merge guest cart ke logged-in user cart
   */
  const mergeGuestCart = useCallback(
    async (guestItems: CartItemData[]) => {
      try {
        setError(null);

        // Add semua guest items ke user cart
        for (const item of guestItems) {
          if (item.quantity > 0) {
            await addItemMutation.mutateAsync({
              productId: item.productId,
              quantity: item.quantity,
            });
          }
        }

        // Clear localStorage
        localStorage.removeItem(GUEST_CART_STORAGE_KEY);

        // Refresh cart dari database
        if (getCartItemsQuery.refetch) {
          await getCartItemsQuery.refetch();
        }
      } catch (err: any) {
        setError(err.message || "Failed to merge cart");
        throw err;
      }
    },
    [addItemMutation, getCartItemsQuery]
  );

  /**
   * Calculate total price
   */
  const getTotalPrice = useCallback((): number => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [items]);

  /**
   * Calculate total items
   */
  const getTotalItems = useCallback((): number => {
    return items.reduce((total, item) => total + item.quantity, 0);
  }, [items]);

  const value: CartContextType = {
    items,
    isLoading,
    error,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    mergeGuestCart,
    getTotalPrice,
    getTotalItems,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

/**
 * Hook untuk menggunakan CartContext
 */
export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart harus digunakan dalam CartProvider");
  }
  return context;
}
