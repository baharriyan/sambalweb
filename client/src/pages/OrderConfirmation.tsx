import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Copy, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

/**
 * Order Confirmation Page
 * Ditampilkan setelah order berhasil dibuat
 */
export default function OrderConfirmation() {
  const [, navigate] = useLocation();
  
  // Initialize state directly from URL or session to avoid setState in useEffect
  const initialOrderId = useMemo(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const id = params.get("orderId");
    if (id) return Number(id);
    const savedId = sessionStorage.getItem("lastOrderId");
    return savedId ? Number(savedId) : null;
  }, []);

  const initialOrderNumber = useMemo(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const num = params.get("orderNumber");
    if (num) return num;
    return sessionStorage.getItem("lastOrderNumber");
  }, []);

  // Payment confirmation states
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isChecking, setIsChecking] = useState(false);

  const checkStatusMutation = trpc.orders.checkPaymentStatus.useMutation();

  // Save to sessionStorage if present in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("orderId");
    const orderNum = params.get("orderNumber");

    if (id && orderNum) {
      sessionStorage.setItem("lastOrderId", id);
      sessionStorage.setItem("lastOrderNumber", orderNum);
    }
  }, []);

  // Fetch order details
  const { data: orderData, isLoading: orderLoading } =
    trpc.orders.getById.useQuery({ orderId: initialOrderId! }, { enabled: !!initialOrderId });

  // Derived loading state to avoid setState in effect
  const isLoading = orderLoading && !orderData;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleCheckPaymentStatus = async () => {
    if (!initialOrderId) return;

    try {
      setIsChecking(true);
      const result = await checkStatusMutation.mutateAsync({ orderId: initialOrderId });

      if (result.paid) {
        toast.success(
          "Pembayaran Terverifikasi! Pesanan Anda sedang diproses."
        );
        window.location.reload();
      } else {
        toast.error("PEMBAYARAN BELUM BERHASIL, SILAKAN LAKUKAN PEMBAYARAN");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Gagal mengecek status pembayaran";
      toast.error(errorMessage);
    } finally {
      setIsChecking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <Loader2 className="animate-spin h-12 w-12 text-red-600" />
        </main>
        <Footer />
      </div>
    );
  }

  // Use real order data if available
  const order = orderData || {
    id: initialOrderId,
    orderNumber: initialOrderNumber || "ORD-XXXX",
    customerName: "Pelanggan",
    customerPhone: "",
    shippingAddress: "",
    shippingCity: "",
    shippingCourier: "JNE",
    shippingCost: 0,
    paymentMethod: "TRANSFER_BANK",
    paymentBank: "BCA",
    subtotal: 0,
    total: 0,
    status: "PENDING_PAYMENT",
    notes: "",
    createdAt: new Date().toISOString(),
  };

  const bankAccounts: Record<string, { name: string; number: string }> = {
    BCA: { name: "PT Sambal Indonesia", number: "1234567890" },
    Mandiri: { name: "PT Sambal Indonesia", number: "0987654321" },
    BNI: { name: "PT Sambal Indonesia", number: "1122334455" },
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} telah disalin!`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Success Message */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold mb-2">
              Pesanan Berhasil Dibuat!
            </h1>
            <p className="text-lg text-muted-foreground">
              Terima kasih telah berbelanja di Sambal Premium
            </p>
          </div>

          {/* Order Number */}
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Nomor Pesanan</p>
                <p className="text-3xl font-bold text-green-700 mb-4">
                  {order.orderNumber}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(order.orderNumber, "Nomor pesanan")
                  }
                  className="text-xs"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Salin Nomor Pesanan
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Status Alert */}
          <Alert className="mb-6 border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Status Pesanan:</strong> {order.status === "PROCESSING" ? "Sedang Diproses" : "Menunggu Pembayaran"}
              <br />
              <span className="text-sm">
                {order.status === "PROCESSING" 
                  ? "Pembayaran Anda telah diverifikasi dan pesanan sedang disiapkan."
                  : "Pesanan Anda akan diproses setelah kami menerima konfirmasi pembayaran."}
              </span>
            </AlertDescription>
          </Alert>

          {/* Order Details */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informasi Pelanggan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Nama:</span>
                  <p className="font-medium">{order.customerName}</p>
                </div>
                <div>
                  <span className="text-gray-600">Telepon:</span>
                  <p className="font-medium">{order.customerPhone}</p>
                </div>
                <div>
                  <span className="text-gray-600">Tanggal Pesanan:</span>
                  <p className="font-medium">
                    {new Date(order.createdAt).toLocaleDateString("id-ID", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informasi Pengiriman</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Kota:</span>
                  <p className="font-medium">{order.shippingCity}</p>
                </div>
                <div>
                  <span className="text-gray-600">Kurir:</span>
                  <p className="font-medium">{order.shippingCourier}</p>
                </div>
                <div>
                  <span className="text-gray-600">Ongkir:</span>
                  <p className="font-medium">
                    Rp{order.shippingCost.toLocaleString("id-ID")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Instructions */}
          {order.paymentMethod === "TRANSFER_BANK" && order.status === "PENDING_PAYMENT" && (
            <Card className="mb-6 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg text-blue-900">
                  Instruksi Pembayaran
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-blue-900">
                  Silakan transfer sesuai dengan total di bawah ke rekening
                  kami:
                </p>

                <div className="bg-white p-4 rounded-lg border border-blue-200">
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Bank:</span>
                      <p className="font-medium">
                        {order.paymentBank}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Atas Nama:</span>
                      <p className="font-medium">
                        {bankAccounts[
                          order.paymentBank as keyof typeof bankAccounts
                        ]?.name || "PT Sambal Indonesia"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Nomor Rekening:</span>
                      <div className="flex items-center gap-2">
                        <p className="font-medium font-mono text-lg">
                          {bankAccounts[
                            order.paymentBank as keyof typeof bankAccounts
                          ]?.number || "XXXX-XXXX-XXXX"}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(
                              bankAccounts[
                                order.paymentBank as keyof typeof bankAccounts
                              ]?.number || "",
                              "Nomor rekening"
                            )
                          }
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 rounded-lg border border-red-200">
                  <p className="text-sm text-gray-600 mb-1">Jumlah Transfer:</p>
                  <p className="text-2xl font-bold text-red-600">
                    Rp{order.total.toLocaleString("id-ID")}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    ⚠️ Pastikan jumlah transfer sesuai (termasuk ongkir)
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 h-12"
              onClick={() => {
                sessionStorage.removeItem("lastOrderId");
                sessionStorage.removeItem("lastOrderNumber");
                navigate("/");
              }}
            >
              Kembali ke Beranda
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/dashboard")}
            >
              Lihat Pesanan di Dashboard
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
