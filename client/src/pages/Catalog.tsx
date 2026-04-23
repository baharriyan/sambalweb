import { useState, useMemo } from "react";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, Plus, Minus, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useCart } from "@/contexts/CartContext";

export default function Catalog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [addingToCart, setAddingToCart] = useState<Record<number, boolean>>({});

  const { data: products, isLoading, error } = trpc.products.list.useQuery({ isActive: true });
  const { addItem } = useCart();

  const renderSpiceLevel = (level: number) => "🌶️".repeat(Math.min(level, 5));

  const handleQuantityChange = (productId: number, delta: number, maxStock: number) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(0, Math.min(maxStock, (prev[productId] || 0) + delta)),
    }));
  };

  const handleAddToCart = async (product: any) => {
    const quantity = quantities[product.id] || 1;
    if (quantity <= 0) {
      toast.error("Pilih jumlah produk terlebih dahulu");
      return;
    }

    if (quantity > product.stock) {
      toast.error("Jumlah melebihi stok yang tersedia");
      return;
    }

    setAddingToCart((prev) => ({ ...prev, [product.id]: true }));

    try {
      await addItem(product.id, product.name, product.price, product.imageUrl || "🌶️", quantity);
      toast.success(`${product.name} ditambahkan ke keranjang!`);
      setQuantities((prev) => ({
        ...prev,
        [product.id]: 0,
      }));
    } catch (err) {
      toast.error("Gagal menambahkan ke keranjang");
      console.error(err);
    } finally {
      setAddingToCart((prev) => ({ ...prev, [product.id]: false }));
    }
  };

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    return products
      .filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        if (sortBy === "price-low") return a.price - b.price;
        if (sortBy === "price-high") return b.price - a.price;
        if (sortBy === "spice") return b.spiceLevel - a.spiceLevel;
        return 0;
      });
  }, [products, searchTerm, sortBy]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Katalog Produk</h1>
            <p className="text-lg text-gray-600">
              Temukan semua varian sambal premium kami
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="grid md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Cari produk..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger disabled={isLoading}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nama (A-Z)</SelectItem>
                  <SelectItem value="price-low">Harga (Termurah)</SelectItem>
                  <SelectItem value="price-high">Harga (Termahal)</SelectItem>
                  <SelectItem value="spice">Level Pedas</SelectItem>
                </SelectContent>
              </Select>

              {/* Results Count */}
              <div className="flex items-center justify-end">
                <p className="text-sm text-gray-600">
                  Menampilkan <span className="font-semibold">{filteredProducts.length}</span> produk
                </p>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center min-h-96">
              <Loader2 className="w-8 h-8 animate-spin text-red-600" />
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-600">Terjadi kesalahan saat memuat produk</p>
            </div>
          )}

          {/* Products Grid */}
          {!isLoading && !error && filteredProducts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 flex flex-col"
                >
                  {/* Product Image */}
                  <div className="h-48 bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center text-6xl overflow-hidden">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      "🌶️"
                    )}
                  </div>

                  {/* Product Info */}
                  <CardContent className="p-6 flex-1 flex flex-col">
                    <Link href={`/product/${product.slug}`}>
                      <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-red-600 transition-colors cursor-pointer">
                        {product.name}
                      </h3>
                    </Link>

                    <p className="text-sm text-gray-600 mb-4 flex-1">
                      {product.description}
                    </p>

                    {/* Spice Level */}
                    <div className="mb-4">
                      <p className="text-sm text-gray-500 mb-1">Level Pedas</p>
                      <p className="text-lg">{renderSpiceLevel(product.spiceLevel)}</p>
                    </div>

                    {/* Price and Stock */}
                    <div className="mb-4 border-t border-gray-200 pt-4">
                      <p className="text-2xl font-bold text-red-600 mb-1">
                        Rp{product.price.toLocaleString("id-ID")}
                      </p>
                      <p className="text-sm text-gray-500">
                        Stok: <span className={`font-semibold ${product.stock > 0 ? "text-gray-900" : "text-red-600"}`}>{product.stock}</span>
                      </p>
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center justify-between mb-4 bg-gray-100 rounded-lg p-2">
                      <button
                        onClick={() => handleQuantityChange(product.id, -1, product.stock)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
                        disabled={product.stock === 0}
                      >
                        <Minus className="w-4 h-4 text-gray-700" />
                      </button>
                      <span className="font-semibold text-gray-900 min-w-8 text-center">
                        {quantities[product.id] || 0}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(product.id, 1, product.stock)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
                        disabled={product.stock <= (quantities[product.id] || 0) || product.stock === 0}
                      >
                        <Plus className="w-4 h-4 text-gray-700" />
                      </button>
                    </div>

                    {/* Add to Cart Button */}
                    <Button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock === 0 || addingToCart[product.id]}
                      className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold disabled:opacity-50"
                    >
                      {addingToCart[product.id] ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Menambahkan...
                        </>
                      ) : product.stock === 0 ? (
                        "Stok Habis"
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Tambah ke Keranjang
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && filteredProducts.length === 0 && products && products.length > 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">Tidak ada produk yang ditemukan dengan pencarian Anda</p>
              <Button
                onClick={() => setSearchTerm("")}
                variant="outline"
              >
                Hapus Filter
              </Button>
            </div>
          )}

          {/* No Products Available */}
          {!isLoading && !error && products && products.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">Tidak ada produk yang tersedia saat ini</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
