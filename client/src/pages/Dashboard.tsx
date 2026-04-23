import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package,
  User,
  LogOut,
  Lock,
  MapPin,
  Trash2,
  Edit2,
} from "lucide-react";
import { trpc, RouterOutputs } from "@/lib/trpc";
import { toast } from "sonner";

type Order = RouterOutputs["orders"]["getUserOrders"][number];
type Address = RouterOutputs["addresses"]["list"][number];

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { user, loading, logout } = useAuth();
  const utils = trpc.useContext();
  const { data: orders } = trpc.orders.getUserOrders.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: addresses, refetch: refetchAddresses } =
    trpc.addresses.list.useQuery(undefined, {
      enabled: !!user,
    });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [addressForm, setAddressForm] = useState({
    label: "",
    fullName: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    isPrimary: false,
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);

  const changePasswordMutation = trpc.auth.changePassword.useMutation();
  const createAddressMutation = trpc.addresses.create.useMutation();
  const updateAddressMutation = trpc.addresses.update.useMutation();
  const deleteAddressMutation = trpc.addresses.delete.useMutation();
  const orderAgainMutation = trpc.orders.orderAgain.useMutation();
  const cancelOrderMutation = trpc.orders.cancelOrder.useMutation();
  const deleteOrderMutation = trpc.orders.deleteOrder.useMutation();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error("Semua field harus diisi");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Password baru dan konfirmasi tidak sesuai");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("Password baru minimal 6 karakter");
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success("Password berhasil diubah");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Gagal mengubah password";
      toast.error(message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !addressForm.fullName ||
      !addressForm.phone ||
      !addressForm.address ||
      !addressForm.city
    ) {
      toast.error("Semua field wajib diisi");
      return;
    }

    setIsAddingAddress(true);
    try {
      if (editingAddressId) {
        await updateAddressMutation.mutateAsync({
          addressId: editingAddressId,
          ...addressForm,
        });
        toast.success("Alamat berhasil diperbarui");
        setEditingAddressId(null);
      } else {
        await createAddressMutation.mutateAsync(addressForm);
        toast.success("Alamat berhasil ditambahkan");
      }
      setAddressForm({
        label: "",
        fullName: "",
        phone: "",
        address: "",
        city: "",
        postalCode: "",
        isPrimary: false,
      });
      refetchAddresses();
    } catch {
      toast.error("Gagal menyimpan alamat");
    } finally {
      setIsAddingAddress(false);
    }
  };

  const handleDeleteAddress = async (addressId: number) => {
    if (confirm("Hapus alamat ini?")) {
      try {
        await deleteAddressMutation.mutateAsync({ addressId });
        toast.success("Alamat berhasil dihapus");
        refetchAddresses();
      } catch {
        toast.error("Gagal menghapus alamat");
      }
    }
  };

  const handleEditAddress = (address: Address) => {
    setAddressForm({
      label: address.label || "",
      fullName: address.fullName,
      phone: address.phone,
      address: address.address,
      city: address.city,
      postalCode: address.postalCode || "",
      isPrimary: !!address.isPrimary,
    });
    setEditingAddressId(address.id);
  };

  const handleOrderAgain = async (orderId: number) => {
    try {
      const result = await orderAgainMutation.mutateAsync({ orderId });
      toast.success("Siap checkout dengan produk yang sama");
      navigate("/checkout", { state: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Gagal repeat order";
      toast.error(message);
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (confirm("Apakah Anda yakin ingin membatalkan pesanan ini?")) {
      try {
        await cancelOrderMutation.mutateAsync({ orderId });
        toast.success("Pesanan berhasil dibatalkan");
        utils.orders.getUserOrders.invalidate();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Gagal membatalkan pesanan";
        toast.error(message);
      }
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus riwayat pesanan ini?")) {
      try {
        await deleteOrderMutation.mutateAsync({ orderId });
        toast.success("Riwayat pesanan berhasil dihapus");
        utils.orders.getUserOrders.invalidate();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Gagal menghapus riwayat pesanan";
        toast.error(message);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-2">Selamat datang, {user.name}!</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-2 border-red-600 text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="orders" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-4">
              <TabsTrigger value="orders" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Pesanan
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Profil
              </TabsTrigger>
              <TabsTrigger
                value="addresses"
                className="flex items-center gap-2"
              >
                <MapPin className="w-4 h-4" />
                Alamat
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Keamanan
              </TabsTrigger>
            </TabsList>

            {/* Orders Tab */}
            <TabsContent value="orders" className="space-y-4">
              {orders && orders.length > 0 ? (
                <div className="grid gap-4">
                  {orders.map((order: Order) => (
                    <Card
                      key={order.id}
                      className="hover:shadow-lg transition-shadow"
                    >
                      <CardContent className="pt-6">
                        <div className="grid md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-600">No. Pesanan</p>
                            <p className="font-semibold text-gray-900">
                              {order.orderNumber}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Tanggal</p>
                            <p className="font-semibold text-gray-900">
                              {new Date(order.createdAt).toLocaleDateString(
                                "id-ID"
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Total</p>
                            <p className="font-semibold text-red-600">
                              Rp{order.total.toLocaleString("id-ID")}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Status</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  order.status === "COMPLETED"
                                    ? "bg-green-100 text-green-800"
                                    : order.status === "PROCESSING"
                                      ? "bg-blue-100 text-blue-800"
                                      : order.status === "PENDING_PAYMENT"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {order.status === "COMPLETED"
                                  ? "Selesai"
                                  : order.status === "PROCESSING"
                                    ? "Diproses"
                                    : order.status === "SHIPPED"
                                      ? "Dikirim"
                                      : order.status === "PENDING_PAYMENT"
                                        ? "Menunggu Pembayaran"
                                        : "Dibatalkan"}
                              </span>
                            </div>
                          </div>
                        </div>
                        {order.status === "PENDING_PAYMENT" && (
                          <Button
                            onClick={() =>
                              navigate(
                                `/order-confirmation?orderId=${order.id}&orderNumber=${order.orderNumber}`
                              )
                            }
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 mr-2"
                          >
                            Bayar Sekarang
                          </Button>
                        )}
                        {(order.status === "PENDING_PAYMENT" ||
                          order.status === "PROCESSING") && (
                          <Button
                            onClick={() => handleCancelOrder(order.id)}
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-600 hover:bg-red-50 mr-2"
                          >
                            Batalkan Pesanan
                          </Button>
                        )}
                        {order.status === "CANCELLED" && (
                          <Button
                            onClick={() => handleDeleteOrder(order.id)}
                            size="sm"
                            variant="outline"
                            className="text-gray-500 border-gray-300 hover:bg-gray-50 mr-2"
                          >
                            Hapus Riwayat
                          </Button>
                        )}
                        {order.status === "COMPLETED" && (
                          <Button
                            onClick={() => handleOrderAgain(order.id)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Pesan Lagi
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-12 text-center pb-12">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      Anda belum memiliki pesanan
                    </p>
                    <a href="/catalog">
                      <Button className="bg-red-600 hover:bg-red-700">
                        Mulai Berbelanja
                      </Button>
                    </a>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Informasi Profil</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm text-gray-600">
                        Nama Lengkap
                      </label>
                      <p className="text-lg font-semibold text-gray-900 mt-1">
                        {user.name}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Email</label>
                      <p className="text-lg font-semibold text-gray-900 mt-1">
                        {user.email}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Tipe Akun</label>
                      <p className="text-lg font-semibold text-gray-900 mt-1">
                        {user.role === "admin" ? "Administrator" : "Pelanggan"}
                      </p>
                    </div>
                  </div>

                  {user.role === "admin" && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                      <p className="text-sm text-blue-900 font-semibold mb-2">
                        👤 Admin Access
                      </p>
                      <p className="text-sm text-blue-800 mb-4">
                        Anda memiliki akses ke panel admin untuk mengelola
                        produk, pesanan, dan pengguna.
                      </p>
                      <a href="/rahasia">
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Buka Panel Admin
                        </Button>
                      </a>
                    </div>
                  )}

                  <div className="border-t pt-6">
                    <p className="text-sm text-gray-600 mb-4">
                      Bergabung sejak:{" "}
                      <span className="font-semibold text-gray-900">
                        {new Date(user.createdAt).toLocaleDateString("id-ID")}
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Address Tab */}
            <TabsContent value="addresses" className="space-y-6">
              {/* Add/Edit Address Form */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    {editingAddressId ? "Edit Alamat" : "Tambah Alamat Baru"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddAddress} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Label (mis: Rumah, Kantor)
                        </label>
                        <input
                          type="text"
                          value={addressForm.label}
                          onChange={e =>
                            setAddressForm({
                              ...addressForm,
                              label: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                          placeholder="Contoh: Rumah"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nama Lengkap *
                        </label>
                        <input
                          type="text"
                          value={addressForm.fullName}
                          onChange={e =>
                            setAddressForm({
                              ...addressForm,
                              fullName: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                          placeholder="Nama lengkap penerima"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nomor Telepon *
                        </label>
                        <input
                          type="tel"
                          value={addressForm.phone}
                          onChange={e =>
                            setAddressForm({
                              ...addressForm,
                              phone: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                          placeholder="Nomor telepon"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Kota *
                        </label>
                        <input
                          type="text"
                          value={addressForm.city}
                          onChange={e =>
                            setAddressForm({
                              ...addressForm,
                              city: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                          placeholder="Kota"
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Alamat Lengkap *
                        </label>
                        <textarea
                          value={addressForm.address}
                          onChange={e =>
                            setAddressForm({
                              ...addressForm,
                              address: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                          placeholder="Jalan, nomor rumah, kelurahan, dst"
                          rows={3}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Kode Pos
                        </label>
                        <input
                          type="text"
                          value={addressForm.postalCode}
                          onChange={e =>
                            setAddressForm({
                              ...addressForm,
                              postalCode: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                          placeholder="Kode pos"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="isPrimary"
                          checked={addressForm.isPrimary}
                          onChange={e =>
                            setAddressForm({
                              ...addressForm,
                              isPrimary: e.target.checked,
                            })
                          }
                          className="w-4 h-4 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-600"
                        />
                        <label
                          htmlFor="isPrimary"
                          className="text-sm font-medium text-gray-700"
                        >
                          Jadikan alamat utama
                        </label>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={isAddingAddress}
                        className="flex-1 bg-red-600 hover:bg-red-700"
                      >
                        {isAddingAddress
                          ? "Menyimpan..."
                          : editingAddressId
                            ? "Perbarui Alamat"
                            : "Tambah Alamat"}
                      </Button>
                      {editingAddressId && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setEditingAddressId(null);
                            setAddressForm({
                              label: "",
                              fullName: "",
                              phone: "",
                              address: "",
                              city: "",
                              postalCode: "",
                              isPrimary: false,
                            });
                          }}
                        >
                          Batal
                        </Button>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Addresses List */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    Alamat Tersimpan ({addresses?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {addresses && addresses.length > 0 ? (
                    <div className="space-y-4">
                      {addresses.map((address: Address) => (
                        <div
                          key={address.id}
                          className="border rounded-lg p-4 hover:bg-gray-50"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-gray-900">
                                  {address.fullName}
                                </p>
                                {!!address.isPrimary && (
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                    Utama
                                  </span>
                                )}
                                {address.label && (
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                    {address.label}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                {address.phone}
                              </p>
                              <p className="text-sm text-gray-900">
                                {address.address}
                              </p>
                              <p className="text-sm text-gray-600">
                                {address.city}{" "}
                                {address.postalCode
                                  ? `, ${address.postalCode}`
                                  : ""}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditAddress(address)}
                              className="text-blue-600 border-blue-600 hover:bg-blue-50"
                            >
                              <Edit2 className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteAddress(address.id)}
                              className="text-red-600 border-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Hapus
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-600">
                        Tidak ada alamat tersimpan
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Tambahkan alamat di atas untuk pengiriman
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Keamanan</CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={handleChangePassword}
                    className="space-y-4 max-w-md"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password Saat Ini
                      </label>
                      <input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={e =>
                          setPasswordForm({
                            ...passwordForm,
                            currentPassword: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                        placeholder="Masukkan password saat ini"
                        disabled={isChangingPassword}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password Baru
                      </label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={e =>
                          setPasswordForm({
                            ...passwordForm,
                            newPassword: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                        placeholder="Masukkan password baru (min 6 karakter)"
                        disabled={isChangingPassword}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Konfirmasi Password Baru
                      </label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={e =>
                          setPasswordForm({
                            ...passwordForm,
                            confirmPassword: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                        placeholder="Konfirmasi password baru"
                        disabled={isChangingPassword}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isChangingPassword}
                      className="w-full bg-red-600 hover:bg-red-700"
                    >
                      {isChangingPassword ? "Memproses..." : "Ubah Password"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}


