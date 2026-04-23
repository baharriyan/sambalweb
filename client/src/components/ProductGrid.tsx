import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus,
  Minus,
  Loader2,
  Heart,
  Flame,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { trpc, RouterOutputs } from "@/lib/trpc";
import { useCart } from "@/contexts/CartContextHook";
import { useAuth } from "@/_core/hooks/useAuth";
import { motion } from "framer-motion";
import OptimizedImage from "./OptimizedImage";

type Product = RouterOutputs["products"]["list"][number];

export default function ProductGrid() {
  const { user } = useAuth();
  const wishlistAdd = trpc.wishlist.add.useMutation({
    onSuccess: () => toast.success("Ditambahkan ke wishlist!"),
    onError: () => toast.error("Gagal menambahkan ke wishlist"),
  });
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const { data: products, isLoading } = trpc.products.list.useQuery({
    isActive: true,
  });
  const { addItem } = useCart();
  const [addingToCart, setAddingToCart] = useState<Record<number, boolean>>({});

  const handleQuantityChange = (
    productId: number,
    delta: number,
    maxStock: number
  ) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(
        0,
        Math.min(maxStock, (prev[productId] || 0) + delta)
      ),
    }));
  };

  const handleAddToCart = async (product: Product) => {
    const quantity = quantities[product.id] || 1;
    if (quantity <= 0) {
      toast.error("Pilih jumlah produk terlebih dahulu");
      return;
    }

    setAddingToCart(prev => ({ ...prev, [product.id]: true }));

    try {
      await addItem(
        product.id,
        product.name,
        product.price,
        product.imageUrl || "/attached_assets/product1.png",
        quantity
      );
      toast.success(`${product.name} ditambahkan ke keranjang!`);
      setQuantities(prev => ({ ...prev, [product.id]: 0 }));
    } catch {
      toast.error("Gagal menambahkan ke keranjang");
    } finally {
      setAddingToCart(prev => ({ ...prev, [product.id]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <section className="py-24 px-4 bg-[#f4f1ea] relative">
      {/* Subtle Grain Texture */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] -z-10" />

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-red-600 font-bold text-sm uppercase tracking-[0.2em] mb-4">
              <Flame className="w-4 h-4" /> Best Seller
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
              PILIHAN VARIAN <br /> SAMBAL TERBAIK.
            </h2>
            <p className="text-lg text-slate-500 leading-relaxed">
              Dibuat dengan resep turun-temurun, menghadirkan cita rasa otentik
              Nusantara di setiap suapan.
            </p>
          </div>
          <Link href="/catalog">
            <Button
              variant="outline"
              className="rounded-full border-2 border-slate-200 font-bold px-8 h-12 hover:bg-slate-900 hover:text-white transition-all"
            >
              Lihat Semua Produk
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products?.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="group border-none shadow-none bg-transparent overflow-hidden flex flex-col h-full">
                <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden mb-6 bg-slate-100 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-red-100">
                  <OptimizedImage
                    src={
                      product.imageUrl ||
                      (idx % 2 === 0
                        ? "/attached_assets/product1.png"
                        : "/attached_assets/product2.png")
                    }
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />

                  {/* Overlay Badges */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-900">
                      Level {product.spiceLevel}
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      user
                        ? wishlistAdd.mutate({ productId: product.id })
                        : toast.error("Login dulu ya")
                    }
                    className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Heart className="w-5 h-5 fill-current" />
                  </button>

                  {/* Add to Cart Quick Action */}
                  <div className="absolute bottom-6 left-0 right-0 px-6 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <Button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock === 0}
                      className="w-full bg-white text-slate-900 hover:bg-slate-900 hover:text-white rounded-2xl h-12 font-bold shadow-xl"
                    >
                      {addingToCart[product.id] ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Beli Sekarang"
                      )}
                    </Button>
                  </div>
                </div>

                <CardContent className="p-0 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <Link href={`/product/${product.slug}`}>
                      <h3 className="text-xl font-black text-slate-800 hover:text-red-600 transition-colors cursor-pointer leading-tight">
                        {product.name}
                      </h3>
                    </Link>
                  </div>

                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={`star-${i}`}
                        className="w-3 h-3 fill-orange-400 text-orange-400"
                      />
                    ))}
                  </div>

                  <div className="mt-auto pt-4 flex items-center justify-between">
                    <span className="text-2xl font-black text-red-600">
                      Rp {product.price.toLocaleString("id-ID")}
                    </span>
                    <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                      <button
                        onClick={() =>
                          handleQuantityChange(product.id, -1, product.stock)
                        }
                        className="text-slate-400 hover:text-slate-900 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-black text-slate-800 w-4 text-center">
                        {quantities[product.id] || 0}
                      </span>
                      <button
                        onClick={() =>
                          handleQuantityChange(product.id, 1, product.stock)
                        }
                        className="text-slate-400 hover:text-slate-900 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
