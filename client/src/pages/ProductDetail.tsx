import { useState } from "react";
import { useRoute, Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useCart } from "@/contexts/CartContextHook";
import { toast } from "sonner";
import { Minus, Plus, ShoppingCart, Loader2, ArrowLeft } from "lucide-react";

export default function ProductDetail() {
  const [match, params] = useRoute("/product/:slug");
  const slug = params?.slug;

  const {
    data: product,
    isLoading,
    error,
  } = trpc.products.getBySlug.useQuery({ slug: slug! }, { enabled: !!slug });

  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const { addItem } = useCart();

  if (!match) return null;

  const renderSpiceLevel = (level: number) => "🌶️".repeat(Math.min(level, 5));

  const handleQuantityChange = (delta: number) => {
    if (!product) return;
    setQuantity(prev => Math.max(1, Math.min(product.stock, prev + delta)));
  };

  const handleAddToCart = async () => {
    if (!product) return;

    if (quantity <= 0) {
      toast.error("Pilih jumlah produk terlebih dahulu");
      return;
    }

    if (quantity > product.stock) {
      toast.error("Jumlah melebihi stok yang tersedia");
      return;
    }

    setAddingToCart(true);

    try {
      await addItem(
        product.id,
        product.name,
        product.price,
        product.imageUrl || "🌶️",
        quantity
      );
      toast.success(`${product.name} ditambahkan ke keranjang!`);
      setQuantity(1);
    } catch {
      toast.error("Gagal menambahkan ke keranjang");
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <Link
            href="/catalog"
            className="inline-flex items-center text-red-600 hover:text-red-700 font-medium mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Katalog
          </Link>

          {isLoading && (
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="w-12 h-12 animate-spin text-red-600" />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-12 text-center">
              <h2 className="text-2xl font-bold text-red-700 mb-2">
                Produk Tidak Ditemukan
              </h2>
              <p className="text-red-600 mb-6">
                Maaf, produk yang Anda cari tidak tersedia atau terjadi
                kesalahan.
              </p>
              <Link href="/catalog">
                <Button>Lihat Katalog Produk</Button>
              </Link>
            </div>
          )}

          {product && (
            <div className="grid md:grid-cols-2 gap-12 bg-white p-6 md:p-12 rounded-2xl shadow-sm border border-gray-100">
              {/* Product Image */}
              <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl overflow-hidden aspect-square flex items-center justify-center text-9xl">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  "🌶️"
                )}
              </div>

              {/* Product Info */}
              <div className="flex flex-col">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  {product.name}
                </h1>

                <div className="mb-6">
                  <p className="text-3xl font-bold text-red-600">
                    Rp{product.price.toLocaleString("id-ID")}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600 font-medium">
                      Level Pedas
                    </span>
                    <span className="text-xl">
                      {renderSpiceLevel(product.spiceLevel)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">
                      Stok Tersedia
                    </span>
                    <span
                      className={`font-semibold ${product.stock > 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {product.stock > 0 ? `${product.stock} pcs` : "Habis"}
                    </span>
                  </div>
                </div>

                <div className="prose prose-red mb-8 flex-1">
                  <h3 className="text-lg font-semibold mb-2">
                    Deskripsi Produk
                  </h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {product.description ||
                      "Tidak ada deskripsi tersedia untuk produk ini."}
                  </p>
                </div>

                {/* Add to Cart Controls */}
                <div className="border-t border-gray-100 pt-6 mt-auto">
                  <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="w-full sm:w-1/3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Jumlah
                      </label>
                      <div className="flex items-center justify-between bg-gray-100 rounded-lg p-2">
                        <button
                          onClick={() => handleQuantityChange(-1)}
                          className="p-2 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
                          disabled={product.stock === 0 || quantity <= 1}
                        >
                          <Minus className="w-4 h-4 text-gray-700" />
                        </button>
                        <span className="font-semibold text-gray-900 min-w-8 text-center text-lg">
                          {product.stock === 0 ? 0 : quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(1)}
                          className="p-2 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
                          disabled={
                            product.stock === 0 || quantity >= product.stock
                          }
                        >
                          <Plus className="w-4 h-4 text-gray-700" />
                        </button>
                      </div>
                    </div>

                    <Button
                      onClick={handleAddToCart}
                      disabled={product.stock === 0 || addingToCart}
                      size="lg"
                      className="w-full sm:w-2/3 h-[52px] bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold disabled:opacity-50 text-lg"
                    >
                      {addingToCart ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Menambahkan...
                        </>
                      ) : product.stock === 0 ? (
                        "Stok Habis"
                      ) : (
                        <>
                          <ShoppingCart className="w-5 h-5 mr-2" />
                          Tambah ke Keranjang
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
