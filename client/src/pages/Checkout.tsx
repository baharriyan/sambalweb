import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { trpc, RouterOutputs } from "@/lib/trpc";
import { useCart } from "@/contexts/CartContextHook";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { loadMidtransSnap } from "@/lib/loadMidtrans";

const COURIERS = [
  { id: "jne", name: "JNE (Reguler)" },
  { id: "jnt", name: "J&T (Economy)" },
  { id: "sicepat", name: "SiCepat (Halu)" },
];

const BANKS = [
  { id: "BCA", name: "BCA" },
  { id: "Mandiri", name: "Mandiri" },
  { id: "BNI", name: "BNI" },
];

type Address = RouterOutputs["addresses"]["list"][number];

export default function Checkout() {
  const [, navigate] = useLocation();
  const { items: cartItems, getTotalPrice, clearCart } = useCart();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    shippingAddress: "",
    shippingProvinceId: "",
    shippingCity: "",
    shippingPostalCode: "",
    shippingCourier: "jne",
    paymentMethod: "TRANSFER_BANK",
    paymentBank: "BCA",
    notes: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("manual");

  // Fetch Provinces & Cost based on Zone (No API needed)
  const { data: provinces } = trpc.shipping.getProvinces.useQuery();
  const { data: costData, isLoading: isCostLoading } =
    trpc.shipping.getCost.useQuery(
      {
        provinceId: formData.shippingProvinceId,
        courier: formData.shippingCourier,
      },
      {
        enabled: !!formData.shippingProvinceId,
        refetchOnWindowFocus: false,
      }
    );

  const { data: addresses } = trpc.addresses.list.useQuery(undefined, {
    enabled: !!user,
  });

  // Memoize shipping cost from costData
  const shippingCost = useMemo(() => costData?.totalCost || 0, [costData]);

  const subtotal = getTotalPrice();
  const total = subtotal + shippingCost;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId);
    if (addressId === "manual") {
      setFormData(prev => ({
        ...prev,
        shippingAddress: "",
        shippingProvinceId: "",
        shippingCity: "",
        shippingPostalCode: "",
      }));
      return;
    }

    const address = addresses?.find(a => a.id.toString() === addressId);
    if (address) {
      // Use explicit type or optional chaining for address fields
      const provinceName = (address as Record<string, unknown>).province as string || "";
      const matchingProvince = provinces?.find(
        p => p.name.toLowerCase() === provinceName.toLowerCase()
      );

      setFormData(prev => ({
        ...prev,
        customerName: address.fullName,
        customerPhone: address.phone,
        shippingAddress: address.address,
        shippingProvinceId: matchingProvince?.id || "",
        shippingCity: address.city,
        shippingPostalCode: address.postalCode || "",
      }));
    }
  };

  const createOrderMutation = trpc.orders.create.useMutation();
  const getSnapTokenMutation = trpc.orders.createPaymentToken.useMutation();
  const updateStatusMutation = trpc.orders.updateStatus.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.customerName ||
      !formData.customerPhone ||
      !formData.shippingAddress ||
      !formData.shippingProvinceId
    ) {
      toast.error("Mohon isi semua field yang diperlukan");
      return;
    }
    if (cartItems.length === 0) {
      toast.error("Keranjang kosong");
      return;
    }

    setIsLoading(true);
    try {
      const orderCartItems = cartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      const result = await createOrderMutation.mutateAsync({
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail,
        shippingAddress: formData.shippingAddress,
        shippingCity: formData.shippingCity,
        shippingPostalCode: formData.shippingPostalCode,
        shippingCourier: formData.shippingCourier as "jne" | "jnt" | "sicepat",
        shippingCost,
        paymentMethod: formData.paymentMethod as "MIDTRANS" | "TRANSFER_BANK",
        paymentBank:
          formData.paymentMethod === "TRANSFER_BANK"
            ? (formData.paymentBank as "BCA" | "Mandiri" | "BNI")
            : undefined,
        notes: formData.notes,
        cartItems: orderCartItems,
      });

      await clearCart();
      sessionStorage.setItem("lastOrderId", result.orderId.toString());
      sessionStorage.setItem("lastOrderNumber", result.orderNumber);

      if (formData.paymentMethod === "MIDTRANS") {
        const { snapToken } = await getSnapTokenMutation.mutateAsync({
          orderId: result.orderId,
        });

        // Handle Demo Mode
        if (snapToken.startsWith("demo-snap-token")) {
          toast.info("Mode Simulasi: Melanjutkan ke konfirmasi pesanan...");
          setTimeout(() => {
            navigate(
              `/order-confirmation?orderId=${result.orderId}&orderNumber=${result.orderNumber}`
            );
          }, 1500);
          return;
        }

        // Load Midtrans Snap dynamically
        await loadMidtransSnap();

        // @ts-expect-error - Midtrans type mismatch
        window.snap.pay(snapToken, {
          onSuccess: async () => {
            await updateStatusMutation.mutateAsync({
              orderId: result.orderId,
              status: "PROCESSING",
            });
            navigate(
              `/order-confirmation?orderId=${result.orderId}&orderNumber=${result.orderNumber}`
            );
          },
          onPending: () =>
            navigate(
              `/order-confirmation?orderId=${result.orderId}&orderNumber=${result.orderNumber}`
            ),
          onError: () =>
            navigate(
              `/order-confirmation?orderId=${result.orderId}&orderNumber=${result.orderNumber}`
            ),
          onClose: () =>
            navigate(
              `/order-confirmation?orderId=${result.orderId}&orderNumber=${result.orderNumber}`
            ),
        });
        return;
      }
      navigate(
        `/order-confirmation?orderId=${result.orderId}&orderNumber=${result.orderNumber}`
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Gagal membuat pesanan";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background font-outfit">
      <Navbar />
      <main className="flex-1 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-black mb-8 text-slate-900">Checkout</h1>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <form
                id="checkout-form"
                onSubmit={handleSubmit}
                className="space-y-8"
              >
                <Card className="border-slate-200 shadow-sm overflow-hidden border-t-[6px] border-t-red-600 rounded-2xl">
                  <CardHeader className="bg-slate-50 border-b border-slate-100">
                    <CardTitle className="text-xl font-bold text-slate-900">
                      Informasi Pelanggan
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    <Input
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleInputChange}
                      required
                      placeholder="Nama Lengkap"
                      className="h-11"
                    />
                    <div className="grid md:grid-cols-2 gap-4">
                      <Input
                        name="customerPhone"
                        value={formData.customerPhone}
                        onChange={handleInputChange}
                        required
                        placeholder="WhatsApp"
                        className="h-11"
                      />
                      <Input
                        name="customerEmail"
                        type="email"
                        value={formData.customerEmail}
                        onChange={handleInputChange}
                        placeholder="Email (Opsional)"
                        className="h-11"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm overflow-hidden border-t-[6px] border-t-red-600 rounded-2xl">
                  <CardHeader className="bg-slate-50 border-b border-slate-100">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-xl font-bold text-slate-900">
                        Alamat Pengiriman
                      </CardTitle>
                      {addresses && addresses.length > 0 && (
                        <Select
                          value={selectedAddressId}
                          onValueChange={handleAddressSelect}
                        >
                          <SelectTrigger className="w-48 h-9 text-xs">
                            <SelectValue placeholder="Pilih Alamat" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manual">Alamat Baru</SelectItem>
                            {addresses.map((addr: Address) => (
                              <SelectItem
                                key={addr.id}
                                value={addr.id.toString()}
                              >
                                {addr.label || addr.fullName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    <Textarea
                      name="shippingAddress"
                      value={formData.shippingAddress}
                      onChange={handleInputChange}
                      required
                      placeholder="Alamat Lengkap (Jalan, No Rumah, RT/RW)"
                      rows={2}
                    />

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Provinsi Tujuan *
                        </label>
                        <Select
                          value={formData.shippingProvinceId}
                          onValueChange={val =>
                            handleSelectChange("shippingProvinceId", val)
                          }
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Pilih Provinsi" />
                          </SelectTrigger>
                          <SelectContent>
                            {provinces?.map(p => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Kota/Kabupaten
                        </label>
                        <Input
                          name="shippingCity"
                          value={formData.shippingCity}
                          onChange={handleInputChange}
                          placeholder="Ketik Nama Kota"
                          className="h-11"
                        />
                      </div>
                    </div>
                    <Input
                      name="shippingPostalCode"
                      value={formData.shippingPostalCode}
                      onChange={handleInputChange}
                      placeholder="Kode Pos"
                      className="h-11"
                    />
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm overflow-hidden border-t-[6px] border-t-red-600 rounded-2xl">
                  <CardHeader className="bg-slate-50 border-b border-slate-100">
                    <CardTitle className="text-xl font-bold text-slate-900">
                      Metode Pengiriman & Pembayaran
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-800">
                          Pilih Kurir
                        </label>
                        <Select
                          value={formData.shippingCourier}
                          onValueChange={val =>
                            handleSelectChange("shippingCourier", val)
                          }
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {COURIERS.map(c => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-800">
                          Metode Pembayaran
                        </label>
                        <Select
                          value={formData.paymentMethod}
                          onValueChange={val =>
                            handleSelectChange("paymentMethod", val)
                          }
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MIDTRANS">
                              Otomatis (QRIS/VA/Gopay)
                            </SelectItem>
                            <SelectItem value="TRANSFER_BANK">
                              Transfer Bank Manual
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {formData.paymentMethod === "TRANSFER_BANK" && (
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-800">
                          Pilih Bank
                        </label>
                        <Select
                          value={formData.paymentBank}
                          onValueChange={val =>
                            handleSelectChange("paymentBank", val)
                          }
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {BANKS.map(b => (
                              <SelectItem key={b.id} value={b.id}>
                                {b.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <Textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Catatan khusus (Opsional)"
                      rows={2}
                    />
                  </CardContent>
                </Card>
              </form>
            </div>

            <div>
              <Card className="sticky top-20 border-slate-200 shadow-md">
                <CardHeader className="bg-slate-50 border-b border-slate-100 rounded-t-2xl">
                  <CardTitle className="text-xl font-bold text-slate-900">Ringkasan Pesanan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-3 border-b border-dashed pb-4">
                    {cartItems.map(item => (
                      <div
                        key={item.id || item.localId}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-slate-600">
                          {item.productName}{" "}
                          <span className="text-slate-500">
                            x{item.quantity}
                          </span>
                        </span>
                        <span className="font-medium text-slate-800">
                          Rp{(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Subtotal</span>
                      <span className="font-medium">
                        Rp{subtotal.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 flex items-center gap-1">
                        Ongkir ({formData.shippingCourier.toUpperCase()})
                        {isCostLoading && (
                          <Loader2 className="w-3 h-3 animate-spin text-red-600" />
                        )}
                      </span>
                      <span className="font-medium text-slate-800">
                        {formData.shippingProvinceId
                          ? `Rp${shippingCost.toLocaleString()}`
                          : "Pilih Provinsi"}
                      </span>
                    </div>
                    {costData?.etd && (
                      <p className="text-[10px] text-right text-slate-400 italic">
                        Estimasi sampai: {costData.etd} hari
                      </p>
                    )}
                    <div className="flex justify-between font-bold text-lg border-t border-slate-200 pt-4">
                      <span className="text-slate-800">Total</span>
                      <span className="text-red-600 text-xl font-bold">
                        Rp{total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    form="checkout-form"
                    disabled={isLoading || isCostLoading}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-12 mt-4 shadow-lg shadow-red-100 transition-all active:scale-95"
                  >
                    {isLoading ? (
                      <Loader2 className="animate-spin mr-2" />
                    ) : null}
                    {isLoading ? "Memproses..." : "Bayar Sekarang"}
                  </Button>
                  <p className="text-[10px] text-center text-slate-400 mt-4 italic">
                    Sistem Ongkir Berbasis Provinsi - Akurat & Unlimited
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
