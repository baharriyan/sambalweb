import { createContext, useContext } from "react";

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
  addItem: (
    productId: number,
    productName: string,
    price: number,
    imageUrl?: string,
    quantity?: number
  ) => Promise<void>;
  updateQuantity: (
    cartItemId: number | string,
    quantity: number
  ) => Promise<void>;
  removeItem: (cartItemId: number | string) => Promise<void>;
  clearCart: () => Promise<void>;
  mergeGuestCart: (guestItems: CartItemData[]) => Promise<void>;

  // Calculations
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
