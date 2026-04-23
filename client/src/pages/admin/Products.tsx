import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { trpc, RouterOutputs } from "@/lib/trpc";
import { Trash2, Edit2, Package, Search, Plus } from "lucide-react";
import AdminLayout from "./AdminLayout";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Product = RouterOutputs["products"]["list"][number];

export default function AdminProducts() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [newProduct, setNewProduct] = useState({
    name: "",
    slug: "",
    description: "",
    price: 0,
    stock: 0,
    spiceLevel: 1,
    imageUrl: "",
  });

  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: products, refetch } = trpc.products.list.useQuery({
    isActive: undefined,
  });
  const createMutation = trpc.products.create.useMutation();
  const updateMutation = trpc.products.update.useMutation();
  const deleteMutation = trpc.products.delete.useMutation();
  const uploadMutation = trpc.media.upload.useMutation();

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      navigate("/");
    }
  }, [user, loading, navigate]);


  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^\w ]+/g, "")
      .replace(/ +/g, "-");
  };

  const handleNameChange = (name: string, isEdit: boolean = false) => {
    const slug = generateSlug(name);
    if (isEdit && editProduct) {
      setEditProduct({ ...editProduct, name, slug });
    } else {
      setNewProduct({ ...newProduct, name, slug });
    }
  };

  const handleCreateProduct = async () => {
    if (!newProduct.name || !newProduct.slug) {
      toast.error("Nama dan slug harus diisi");
      return;
    }

    try {
      await createMutation.mutateAsync({ ...newProduct });
      toast.success("Produk berhasil dibuat");
      setNewProduct({
        name: "",
        slug: "",
        description: "",
        price: 0,
        stock: 0,
        spiceLevel: 1,
        imageUrl: "",
      });
      refetch();
    } catch {
      toast.error("Gagal membuat produk");
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus produk ini?")) {
      try {
        await deleteMutation.mutateAsync({ id });
        toast.success("Produk berhasil dihapus");
        refetch();
      } catch {
        toast.error("Gagal menghapus produk");
      }
    }
  };

  const handleUpdateProduct = async () => {
    if (!editProduct) return;
    if (!editProduct.name || !editProduct.slug) {
      toast.error("Nama dan slug harus diisi");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: editProduct.id,
        name: editProduct.name,
        slug: editProduct.slug,
        description: editProduct.description || "",
        price: editProduct.price,
        stock: editProduct.stock,
        spiceLevel: editProduct.spiceLevel,
        imageUrl: editProduct.imageUrl || "",
      });
      toast.success("Produk berhasil diperbarui");
      setEditProduct(null);
      refetch();
    } catch {
      toast.error("Gagal memperbarui produk");
    }
  };

  const handleFileUpload = async (file: File, isEdit: boolean = false) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>(resolve => {
        reader.onload = () => resolve(reader.result as string);
      });
      reader.readAsDataURL(file);
      const base64Data = await base64Promise;

      const result = await uploadMutation.mutateAsync({
        filename: file.name,
        contentType: file.type,
        base64Data,
      });

      if (isEdit && editProduct) {
        setEditProduct({ ...editProduct, imageUrl: result.url });
      } else {
        setNewProduct({ ...newProduct, imageUrl: result.url });
      }
      toast.success("Gambar berhasil diunggah");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Gagal mengunggah gambar";
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(
      p =>
        (p.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ??
          false)
    );
  }, [products, searchQuery]);

  if (loading || !user || user.role !== "admin") return null;

  return (
    <AdminLayout title="Manajemen Katalog Produk">
      <div className="space-y-8">
        {/* Create Form */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Plus className="w-5 h-5 text-red-600" />
              Tambah Produk Baru
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Nama Produk
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Sambal Bawang Super"
                  value={newProduct.name}
                  onChange={e => handleNameChange(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Slug (URL)
                </label>
                <input
                  type="text"
                  placeholder="sambal-bawang-super"
                  value={newProduct.slug}
                  onChange={e =>
                    setNewProduct({ ...newProduct, slug: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
                />
              </div>
              <div className="space-y-2 lg:col-span-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Level Pedas
                </label>
                <select
                  value={newProduct.spiceLevel}
                  onChange={e =>
                    setNewProduct({
                      ...newProduct,
                      spiceLevel: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
                >
                  {[1, 2, 3, 4, 5].map(level => (
                    <option key={level} value={level}>
                      {"🌶️".repeat(level)} (Level {level})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 md:col-span-2 lg:col-span-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Deskripsi
                </label>
                <textarea
                  placeholder="Jelaskan aroma dan rasa sambal ini..."
                  value={newProduct.description}
                  onChange={e =>
                    setNewProduct({
                      ...newProduct,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all min-h-[100px] font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Harga (Rp)
                </label>
                <input
                  type="number"
                  placeholder="35000"
                  value={newProduct.price || ""}
                  onChange={e =>
                    setNewProduct({
                      ...newProduct,
                      price: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Stok
                </label>
                <input
                  type="number"
                  placeholder="100"
                  value={newProduct.stock || ""}
                  onChange={e =>
                    setNewProduct({
                      ...newProduct,
                      stock: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Gambar
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm shrink-0">
                    {newProduct.imageUrl ? (
                      <img
                        src={newProduct.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-5 h-5 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 flex gap-2">
                    <input
                      type="file"
                      id="create-image-upload"
                      accept="image/*"
                      onChange={e =>
                        e.target.files?.[0] &&
                        handleFileUpload(e.target.files[0])
                      }
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        document.getElementById("create-image-upload")?.click()
                      }
                      className="flex-1 rounded-xl border-slate-200 hover:bg-slate-50"
                      disabled={isUploading}
                    >
                      {isUploading
                        ? "..."
                        : newProduct.imageUrl
                          ? "Ganti"
                          : "Pilih"}
                    </Button>
                    {newProduct.imageUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() =>
                          setNewProduct({ ...newProduct, imageUrl: "" })
                        }
                        className="text-red-500 hover:bg-red-50 rounded-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <Button
              onClick={handleCreateProduct}
              disabled={createMutation.isPending || isUploading}
              className="w-full py-7 rounded-2xl bg-red-600 hover:bg-red-700 shadow-xl shadow-red-200 font-bold text-lg"
            >
              {createMutation.isPending
                ? "Sedang Menyimpan..."
                : "Simpan Produk ke Katalog"}
            </Button>
          </CardContent>
        </Card>

        {/* List Card */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 p-8">
            <div>
              <CardTitle className="text-xl font-bold text-slate-800">
                Daftar Produk
              </CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                Total {filteredProducts.length} produk aktif
              </p>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama sambal..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500/20 text-sm font-medium"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="text-left py-4 px-8">Informasi Produk</th>
                    <th className="text-left py-4 px-4">Harga</th>
                    <th className="text-left py-4 px-4">Stok</th>
                    <th className="text-left py-4 px-4">Pedas</th>
                    <th className="text-right py-4 px-8">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredProducts.map((product: Product) => (
                    <tr
                      key={product.id}
                      className="group hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-5 px-8">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shadow-sm group-hover:scale-105 transition-transform duration-300">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300 bg-white">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">
                              {product.name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {product.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-4">
                        <span className="font-bold text-slate-900">
                          Rp {product.price.toLocaleString("id-ID")}
                        </span>
                      </td>
                      <td className="py-5 px-4">
                        <span
                          className={cn(
                              "px-2.5 py-1 rounded-lg text-[11px] font-bold",
                              product.stock < 10
                                ? "bg-red-50 text-red-600"
                                : "bg-emerald-50 text-emerald-600"
                          )}
                        >
                          {product.stock} pcs
                        </span>
                      </td>
                      <td className="py-5 px-4">
                        <div className="flex gap-0.5">
                          {"🌶️".repeat(product.spiceLevel)}
                        </div>
                      </td>
                      <td className="py-5 px-8 text-right space-x-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setEditProduct(product)}
                          className="w-9 h-9 rounded-xl text-blue-500 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteProduct(product.id)}
                          className="w-9 h-9 rounded-xl text-red-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      {editProduct && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <Card className="w-full max-w-2xl border-none shadow-2xl overflow-hidden rounded-3xl">
              <CardHeader className="bg-slate-50 border-b border-slate-100 p-8">
                <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-blue-600" />
                  Edit Informasi Produk
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Nama Produk
                    </label>
                    <input
                      type="text"
                      value={editProduct.name}
                      onChange={e => handleNameChange(e.target.value, true)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Slug
                    </label>
                    <input
                      type="text"
                      value={editProduct.slug}
                      onChange={e =>
                        setEditProduct({ ...editProduct, slug: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Deskripsi
                    </label>
                    <textarea
                      value={editProduct.description || ""}
                      onChange={e =>
                        setEditProduct({
                          ...editProduct,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all min-h-[120px] font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Harga (Rp)
                    </label>
                    <input
                      type="number"
                      value={editProduct.price || ""}
                      onChange={e =>
                        setEditProduct({
                          ...editProduct,
                          price: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Stok
                    </label>
                    <input
                      type="number"
                      value={editProduct.stock || ""}
                      onChange={e =>
                        setEditProduct({
                          ...editProduct,
                          stock: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Pedas
                    </label>
                    <select
                      value={editProduct.spiceLevel}
                      onChange={e =>
                        setEditProduct({
                          ...editProduct,
                          spiceLevel: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    >
                      {[1, 2, 3, 4, 5].map(level => (
                        <option key={level} value={level}>
                          {"🌶️".repeat(level)} (Level {level})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Gambar
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm shrink-0">
                        {editProduct.imageUrl ? (
                          <img
                            src={editProduct.imageUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-6 h-6 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 flex gap-2">
                        <input
                          type="file"
                          id="edit-image-upload"
                          accept="image/*"
                          onChange={e =>
                            e.target.files?.[0] &&
                            handleFileUpload(e.target.files[0], true)
                          }
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            document
                              .getElementById("edit-image-upload")
                              ?.click()
                          }
                          className="flex-1 rounded-xl"
                          disabled={isUploading}
                        >
                          {isUploading ? "..." : "Ubah Foto"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 pt-8">
                  <Button
                    onClick={handleUpdateProduct}
                    disabled={updateMutation.isPending || isUploading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 py-7 rounded-2xl shadow-xl shadow-blue-200 font-bold"
                  >
                    Simpan Perubahan
                  </Button>
                  <Button
                    onClick={() => setEditProduct(null)}
                    variant="ghost"
                    className="flex-1 py-7 rounded-2xl border border-slate-200 hover:bg-slate-50"
                  >
                    Batal
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AdminLayout>
  );
}
