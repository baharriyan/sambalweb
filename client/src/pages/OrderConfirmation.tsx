import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Copy, Copy as CopyIcon, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Search, Loader2, CreditCard, RefreshCw } from "lucide-react";

/**
 * Order Confirmation Page
 * Ditampilkan setelah order berhasil dibuat
 * Menampilkan: Order number, status, detail pembayaran, dll
 */
export default function OrderConfirmation() {
  const [, navigate] = useLocation();
  const [orderId, setOrderId] = useState<number | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Payment confirmation states
  const [isChecking, setIsChecking] = useState(false);
  
  const checkStatusMutation = trpc.orders.checkPaymentStatus.useMutation();

  // Get order ID dari URL params atau sessionStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("orderId");
    const orderNum = params.get("orderNumber");

    if (id && orderNum) {
      setOrderId(Number(id));
      setOrderNumber(orderNum);
      // Save ke sessionStorage untuk reference
      sessionStorage.setItem("lastOrderId", id);
      sessionStorage.setItem("lastOrderNumber", orderNum);
    } else {
      // Cek sessionStorage
      const savedId = sessionStorage.getItem("lastOrderId");
      const savedNum = sessionStorage.getItem("lastOrderNumber");
      if (savedId && savedNum) {
        setOrderId(Number(savedId));
        setOrderNumber(savedNum);
      }
    }
  }, []);

  // Fetch order details jika orderId ada
  const { data: orderData, isLoading: orderLoading } = trpc.orders.getById.useQuery(
    { orderId: orderId! },
    { enabled: !!orderId }
  );

  useEffect(() => {
    setIsLoading(orderLoading);
    if (orderData) {
      setIsLoading(false);
    }
  }, [orderLoading, orderData]);

  const handleCheckPaymentStatus = async () => {
    if (!orderId) return;

    try {
      setIsChecking(true);
      const result = await checkStatusMutation.mutateAsync({ orderId });

      if (result.paid) {
        toast.success("Pembayaran Terverifikasi! Pesanan Anda sedang diproses.");
        // Refresh page to show updated status
        window.location.reload();
      } else {
        toast.error("PEMBAYARAN BELUM BERHASIL, SILAKAN LAKUKAN PEMBAYARAN");
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal mengecek status pembayaran");
    } finally {
      setIsChecking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </main>
        <Footer />
      </div>
    );
  }

  // Dummy order data jika tidak bisa fetch dari API
  const order = orderData || {
    id: orderId,
    orderNumber: orderNumber || "ORD-XXXX",
    customerName: "Pelanggan",
    customerPhone: "",
    shippingAddress: "",
    shippingCity: "",
    shippingCourier: "JNE",
    shippingCost: 50000,
    paymentMethod: "TRANSFER_BANK",
    paymentBank: "BCA",
    subtotal: 0,
    total: 0,
    status: "PENDING_PAYMENT",
    notes: "",
    createdAt: new Date(),
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
            <h1 className="text-4xl font-bold mb-2">Pesanan Berhasil Dibuat!</h1>
            <p className="text-lg text-muted-foreground">
              Terima kasih telah berbelanja di Sambal Premium
            </p>
          </div>

          {/* Order Number */}
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Nomor Pesanan</p>
                <p className="text-3xl font-bold text-green-700 mb-4">{order.orderNumber}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(order.orderNumber, "Nomor pesanan")}
                  className="text-xs"
                >
                  <CopyIcon className="h-3 w-3 mr-1" />
                  Salin Nomor Pesanan
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Status Alert */}
          <Alert className="mb-6 border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Status Pesanan:</strong> Menunggu Pembayaran
              <br />
              <span className="text-sm">
                Pesanan Anda akan diproses setelah kami menerima konfirmasi pembayaran.
              </span>
            </AlertDescription>
          </Alert>

          {/* Order Details */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Customer Info */}
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

            {/* Shipping Info */}
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
                  <p className="font-medium">Rp{order.shippingCost.toLocaleString("id-ID")}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Instructions */}
          {order.paymentMethod === "TRANSFER_BANK" && (
            <Card className="mb-6 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg text-blue-900">Instruksi Pembayaran</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-blue-900">
                  Silakan transfer sesuai dengan total di bawah ke rekening kami:
                </p>

                {/* Bank Details */}
                <div className="bg-white p-4 rounded-lg border border-blue-200">
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Bank:</span>
                      <p className="font-medium">{bankAccounts[order.paymentBank as keyof typeof bankAccounts]?.name || order.paymentBank}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Atas Nama:</span>
                      <p className="font-medium">
                        {bankAccounts[order.paymentBank as keyof typeof bankAccounts]?.name || "PT Sambal Indonesia"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Nomor Rekening:</span>
                      <div className="flex items-center gap-2">
                        <p className="font-medium font-mono text-lg">
                          {bankAccounts[order.paymentBank as keyof typeof bankAccounts]?.number || "XXXX-XXXX-XXXX"}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(
                              bankAccounts[order.paymentBank as keyof typeof bankAccounts]?.number || "",
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

                {/* Amount */}
                <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 rounded-lg border border-red-200">
                  <p className="text-sm text-gray-600 mb-1">Jumlah Transfer:</p>
                  <p className="text-2xl font-bold text-red-600">
                    Rp{order.total.toLocaleString("id-ID")}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    ⚠️ Pastikan jumlah transfer sesuai (termasuk ongkir)
                  </p>
                </div>

                {/* Instructions */}
                <div className="bg-white p-4 rounded-lg border border-blue-200">
                  <p className="text-sm font-semibold text-gray-900 mb-2">Cara Pembayaran:</p>
                  <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                    <li>Buka aplikasi perbankan Anda</li>
                    <li>Pilih menu Transfer / Kirim Uang</li>
                    <li>Masukkan nomor rekening kami</li>
                    <li>Masukkan jumlah: <strong>Rp{order.total.toLocaleString("id-ID")}</strong></li>
                    <li>Gunakan nomor pesanan <strong>{order.orderNumber}</strong> sebagai keterangan</li>
                    <li>Selesaikan transaksi</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Status Check Section - Only show if pending */}
          {order.status === "PENDING_PAYMENT" && (
            <Card className="mb-6 border-blue-200 bg-blue-50/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  Status Pembayaran Otomatis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white p-6 rounded-xl border border-blue-100 text-center space-y-4">
                  <p className="text-sm text-gray-600">
                    Sistem akan memverifikasi pembayaran Anda secara otomatis. Jika Anda sudah melakukan pembayaran, silakan klik tombol di bawah untuk memperbarui status pesanan.
                  </p>
                  
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 rounded-xl"
                    disabled={isChecking}
                    onClick={handleCheckPaymentStatus}
                  >
                    {isChecking ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Sedang Mengecek...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Cek Status Pembayaran
                      </>
                    )}
                  </Button>
                </div>
                
                <p className="text-[11px] text-center text-blue-600/70 italic">
                  * Verifikasi biasanya instan setelah Anda menyelesaikan pembayaran di Midtrans.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Success Status - Show if processing */}
          {order.status === "PROCESSING" && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Pembayaran Berhasil Diterima!</strong>
                <br />
                <span className="text-sm">
                  Pesanan Anda sedang diproses oleh tim kami. Terima kasih atas konfirmasinya.
                </span>
              </AlertDescription>
            </Alert>
          )}

          {/* QRIS Payment */}
          {order.paymentMethod === "QRIS" && (
            <Card className="mb-6 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg text-blue-900">Pembayaran via QRIS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-center">
                <p className="text-sm text-blue-900">
                  Scan kode QR di bawah menggunakan aplikasi e-wallet Anda:
                </p>
                <div className="bg-white p-8 rounded-lg border border-blue-200 inline-block">
                  <div className="w-48 h-48 bg-gray-200 flex items-center justify-center rounded">
                    <p className="text-gray-500 text-sm">QRIS Code Here</p>
                  </div>
                </div>
                <p className="text-sm font-semibold">Total: Rp{order.total.toLocaleString("id-ID")}</p>
              </CardContent>
            </Card>
          )}

          {/* Order Summary */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Ringkasan Pesanan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>Rp{order.subtotal.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Ongkir ({order.shippingCourier}):</span>
                <span>Rp{order.shippingCost.toLocaleString("id-ID")}</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-red-600">Rp{order.total.toLocaleString("id-ID")}</span>
              </div>
            </CardContent>
          </Card>

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

          {/* Contact Info */}
          <Card className="mt-6 bg-gray-50">
            <CardContent className="pt-6 text-center text-sm">
              <p className="text-gray-600 mb-2">
                Jika ada pertanyaan, silakan hubungi kami:
              </p>
              <p className="font-medium">
                WhatsApp: <a href="tel:+6281234567890" className="text-red-600 hover:underline">081234567890</a>
              </p>
              <p className="font-medium">
                Email: <a href="mailto:info@sambal.id" className="text-red-600 hover:underline">info@sambal.id</a>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
