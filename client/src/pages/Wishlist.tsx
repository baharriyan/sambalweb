import { useAuth } from "@/_core/hooks/useAuth";
import { useCart } from "@/contexts/CartContextHook";
import { trpc } from "@/lib/trpc";
import { Heart, HeartOff, Loader2, ShoppingCart } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatRupiah } from "@/lib/utils";

export default function Wishlist() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { addItem } = useCart();
  const utils = trpc.useUtils();

  const { data: wishlistItems, isLoading } = trpc.wishlist.list.useQuery(
    undefined,
    {
      enabled: !!user,
    }
  );

  const removeMutation = trpc.wishlist.remove.useMutation({
    onSuccess: () => {
      utils.wishlist.list.invalidate();
      toast.success("Produk dihapus dari wishlist");
    },
  });

  if (authLoading)
    return (
      <div className="p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto" />
      </div>
    );

  if (!user) {
    navigate("/login");
    return null;
  }

  const handleAddToCart = (product: {
    id: number;
    name: string;
    price: number;
    imageUrl?: string | null;
  }) => {
    addItem(
      product.id,
      product.name,
      product.price,
      product.imageUrl || undefined,
      1
    );
    toast.success(`${product.name} ditambahkan ke keranjang`);
  };

  const handleRemove = (productId: number) => {
    removeMutation.mutate({ productId });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 flex items-center">
        <Heart className="w-8 h-8 mr-3 text-red-600" />
        Wishlist Saya
      </h1>

      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Memuat wishlist...</p>
        </div>
      ) : !wishlistItems || wishlistItems.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center border">
          <HeartOff className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Wishlist Anda Kosong
          </h2>
          <p className="text-gray-500 mb-6">
            Anda belum menambahkan produk apapun ke wishlist.
          </p>
          <Link href="/catalog">
            <Button className="bg-red-600 hover:bg-red-700 text-white">
              Jelajahi Produk
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {wishlistItems.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-sm border p-4 flex flex-col sm:flex-row gap-4 items-center"
            >
              <div className="w-24 h-24 bg-gray-100 rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden">
                {item.product.imageUrl ? (
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-400 text-xs">No Image</span>
                )}
              </div>
              <div className="flex-1 text-center sm:text-left">
                <Link href={`/product/${item.product.slug}`}>
                  <h3 className="font-semibold text-lg text-gray-900 hover:text-red-600 transition-colors">
                    {item.product.name}
                  </h3>
                </Link>
                <p className="text-red-600 font-bold mt-1">
                  {formatRupiah(item.product.price)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Stok:{" "}
                  {item.product.stock > 0 ? (
                    `${item.product.stock} tersedia`
                  ) : (
                    <span className="text-red-500">Habis</span>
                  )}
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <Button
                  onClick={() => handleAddToCart(item.product)}
                  disabled={item.product.stock <= 0}
                  className="bg-red-600 hover:bg-red-700 text-white w-full"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />+ Keranjang
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleRemove(item.product.id)}
                  disabled={removeMutation.isPending}
                  className="text-gray-600 w-full"
                >
                  {removeMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Hapus"
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


