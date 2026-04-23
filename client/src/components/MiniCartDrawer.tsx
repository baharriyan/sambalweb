import React, { useState } from "react";
import { useLocation } from "wouter";
import { useCart } from "@/contexts/CartContextHook";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { X, ShoppingCart, Plus, Minus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface MiniCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Mini Cart Drawer Component
 * Menampilkan cart items dalam sidebar drawer
 * Support untuk guest dan logged-in users
 */
export function MiniCartDrawer({ isOpen, onClose }: MiniCartDrawerProps) {
  const [, navigate] = useLocation();
  const { items, removeItem, updateQuantity, getTotalPrice, getTotalItems } =
    useCart();
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Handle quantity increment
   */
  const handleIncrement = async (
    cartItemId: number | string,
    currentQuantity: number
  ) => {
    try {
      setIsProcessing(true);
      await updateQuantity(cartItemId, currentQuantity + 1);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Gagal update quantity");
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle quantity decrement
   */
  const handleDecrement = async (
    cartItemId: number | string,
    currentQuantity: number
  ) => {
    if (currentQuantity <= 1) {
      return handleRemoveItem(cartItemId);
    }

    try {
      setIsProcessing(true);
      await updateQuantity(cartItemId, currentQuantity - 1);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Gagal update quantity");
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle remove item
   */
  const handleRemoveItem = async (cartItemId: number | string) => {
    try {
      setIsProcessing(true);
      await removeItem(cartItemId);
      toast.success("Item dihapus dari cart");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Gagal hapus item");
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle checkout
   */
  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error("Cart kosong");
      return;
    }
    onClose();
    navigate("/checkout");
  };

  const totalPrice = getTotalPrice();
  const totalItems = getTotalItems();
  const isEmpty = items.length === 0;

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="h-full md:h-screen md:max-h-screen md:w-96 md:rounded-l-lg md:rounded-r-none">
        {/* Header */}
        <DrawerHeader className="border-b">
          <div className="flex items-center justify-between">
            <DrawerTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Keranjang ({totalItems})
            </DrawerTitle>
            <DrawerClose asChild>
              <button className="p-1 hover:bg-secondary rounded-md">
                <X className="h-5 w-5" />
              </button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        {/* Content */}
        {isEmpty ? (
          // Empty state
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Keranjang Kosong</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Tambahkan produk untuk mulai berbelanja
            </p>
            <DrawerClose asChild>
              <Button
                className="w-full"
                onClick={() => {
                  onClose();
                  navigate("/catalog");
                }}
              >
                Lanjutkan Belanja
              </Button>
            </DrawerClose>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {items.map(item => (
                  <div
                    key={item.localId || item.id}
                    className="flex gap-3 border rounded-lg p-3"
                  >
                    {/* Product Image */}
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        loading="lazy"
                        className="h-20 w-20 rounded object-cover flex-shrink-0"
                      />
                    )}

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium truncate">
                        {item.productName}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Rp{item.price.toLocaleString("id-ID")}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 w-7 p-0"
                          onClick={() =>
                            handleDecrement(
                              item.localId || item.id,
                              item.quantity
                            )
                          }
                          disabled={isProcessing}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>

                        <span className="w-6 text-center text-sm font-medium">
                          {item.quantity}
                        </span>

                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 w-7 p-0"
                          onClick={() =>
                            handleIncrement(
                              item.localId || item.id,
                              item.quantity
                            )
                          }
                          disabled={isProcessing}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>

                        {/* Remove Button */}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 ml-auto text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() =>
                            handleRemoveItem(item.localId || item.id)
                          }
                          disabled={isProcessing}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Subtotal */}
                      <p className="text-xs text-muted-foreground mt-2">
                        Subtotal: Rp
                        {(item.price * item.quantity).toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Separator */}
            <Separator />

            {/* Footer with Total and Actions */}
            <div className="p-4 space-y-4">
              {/* Total Price */}
              <div className="bg-secondary rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total:</span>
                  <span className="text-lg font-bold">
                    Rp{totalPrice.toLocaleString("id-ID")}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  ({totalItems} item{totalItems !== 1 ? "s" : ""})
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleCheckout}
                  disabled={isEmpty || isProcessing}
                >
                  Lanjutkan ke Checkout
                </Button>

                <DrawerClose asChild>
                  <Button
                    className="w-full"
                    variant="outline"
                    size="lg"
                    onClick={() => navigate("/catalog")}
                  >
                    Lanjutkan Belanja
                  </Button>
                </DrawerClose>
              </div>
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}


