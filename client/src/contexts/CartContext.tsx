import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { trpc, RouterOutputs } from "@/lib/trpc";
import { CartContext, CartItemData } from "./CartContextHook";

const GUEST_CART_STORAGE_KEY = "guest_cart_items";

type DBCartItem = RouterOutputs["cart"]["getItems"][number];

/**
 * CartProvider Component
 * Menyediakan cart state management untuk entire aplikasi
 * Optimized for React 19 / React Compiler by using useMemo for derived state
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  // State for guest items
  const [guestItems, setGuestItems] = useState<CartItemData[]>(() => {
    if (typeof window === "undefined") return [];
    const savedCart = localStorage.getItem(GUEST_CART_STORAGE_KEY);
    if (savedCart) {
      try {
        return JSON.parse(savedCart);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // tRPC queries
  const { data: user } = trpc.auth.me.useQuery();
  const getCartItemsQuery = trpc.cart.getItems.useQuery(undefined, {
    enabled: !!user,
  });

  const addItemMutation = trpc.cart.addItem.useMutation();
  const updateItemMutation = trpc.cart.updateItem.useMutation();
  const removeItemMutation = trpc.cart.removeItem.useMutation();
  const clearCartMutation = trpc.cart.clear.useMutation();

  // Unified items list - derived from DB or local state
  const items = useMemo(() => {
    if (user?.id && getCartItemsQuery.data) {
      return getCartItemsQuery.data.map((item: DBCartItem) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName || undefined,
        quantity: item.quantity,
        price: item.price,
        imageUrl: item.imageUrl || undefined,
      }));
    }
    return guestItems;
  }, [user, getCartItemsQuery.data, guestItems]);

  // Sync localStorage for guest cart
  useEffect(() => {
    if (!user?.id) {
      if (guestItems.length > 0) {
        localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(guestItems));
      } else {
        localStorage.removeItem(GUEST_CART_STORAGE_KEY);
      }
    }
  }, [guestItems, user]);

  // Actions
  const addItem = useCallback(async (
    productId: number,
    productName: string,
    price: number,
    imageUrl?: string,
    quantity: number = 1
  ) => {
    try {
      setError(null);
      setIsLoading(true);

      if (user?.id) {
        await addItemMutation.mutateAsync({ productId, quantity });
        await getCartItemsQuery.refetch();
      } else {
        setGuestItems(prevItems => {
          const existingItemIndex = prevItems.findIndex(
            item => item.productId === productId
          );

          if (existingItemIndex > -1) {
            const newItems = [...prevItems];
            newItems[existingItemIndex].quantity += quantity;
            return newItems;
          }

          return [
            ...prevItems,
            {
              id: 0,
              productId,
              productName,
              price,
              imageUrl,
              quantity,
              localId: `guest_${Date.now()}_${productId}`,
            },
          ];
        });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add item");
    } finally {
      setIsLoading(false);
    }
  }, [user, addItemMutation, getCartItemsQuery]);

  const updateQuantity = useCallback(async (
    cartItemId: number | string,
    quantity: number
  ) => {
    try {
      setError(null);
      setIsLoading(true);

      if (user?.id && typeof cartItemId === "number") {
        if (quantity <= 0) {
          await removeItemMutation.mutateAsync({ cartItemId });
        } else {
          await updateItemMutation.mutateAsync({ cartItemId, quantity });
        }
        await getCartItemsQuery.refetch();
      } else {
        setGuestItems(prevItems => {
          if (quantity <= 0) {
            return prevItems.filter(item => item.localId !== cartItemId);
          }
          return prevItems.map(item =>
            item.localId === cartItemId ? { ...item, quantity } : item
          );
        });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update item");
    } finally {
      setIsLoading(false);
    }
  }, [user, removeItemMutation, updateItemMutation, getCartItemsQuery]);

  const removeItem = useCallback(async (cartItemId: number | string) => {
    try {
      setError(null);
      setIsLoading(true);

      if (user?.id && typeof cartItemId === "number") {
        await removeItemMutation.mutateAsync({ cartItemId });
        await getCartItemsQuery.refetch();
      } else {
        setGuestItems(prevItems =>
          prevItems.filter(item => item.localId !== cartItemId)
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to remove item");
    } finally {
      setIsLoading(false);
    }
  }, [user, removeItemMutation, getCartItemsQuery]);

  const clearCart = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      if (user?.id) {
        await clearCartMutation.mutateAsync();
        await getCartItemsQuery.refetch();
      } else {
        setGuestItems([]);
        localStorage.removeItem(GUEST_CART_STORAGE_KEY);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to clear cart");
    } finally {
      setIsLoading(false);
    }
  }, [user, clearCartMutation, getCartItemsQuery]);

  const mergeGuestCart = useCallback(async (targetGuestItems: CartItemData[]) => {
    if (!user?.id || targetGuestItems.length === 0) return;

    try {
      setIsLoading(true);
      for (const item of targetGuestItems) {
        await addItemMutation.mutateAsync({
          productId: item.productId,
          quantity: item.quantity,
        });
      }
      setGuestItems([]);
      localStorage.removeItem(GUEST_CART_STORAGE_KEY);
      await getCartItemsQuery.refetch();
    } catch {
      // Ignore errors
    } finally {
      setIsLoading(false);
    }
  }, [user, addItemMutation, getCartItemsQuery]);

  const getTotalPrice = useCallback(() => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [items]);

  const getTotalItems = useCallback(() => {
    return items.reduce((total, item) => total + item.quantity, 0);
  }, [items]);

  // Provide state and actions
  const value = useMemo(
    () => ({
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
    }),
    [items, isLoading, error, addItem, updateQuantity, removeItem, clearCart, mergeGuestCart, getTotalPrice, getTotalItems]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
