import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Copy, AlertCircle, Upload, CheckCircle2, MessageCircle, Loader2, XCircle, Send, Eye } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
 
 /**
  * Helper component for countdown timer (20 minutes)
  */
 function CountdownTimer({ createdAt }: { createdAt: string | Date }) {
   const [timeLeft, setTimeLeft] = useState<string>("");
   const expiryDate = useMemo(() => {
     const date = new Date(createdAt);
     date.setMinutes(date.getMinutes() + 20);
     return date;
   }, [createdAt]);
 
   useEffect(() => {
     const calculateTimeLeft = () => {
       const now = new Date();
       const difference = expiryDate.getTime() - now.getTime();
       
       if (difference <= 0) {
         setTimeLeft("00:00");
         // Auto reload to show cancelled status after 1 second
         setTimeout(() => window.location.reload(), 1000);
         return;
       }
 
       const minutes = Math.floor(difference / (1000 * 60));
       const seconds = Math.floor((difference % (1000 * 60)) / 1000);
       
       setTimeLeft(
         `${minutes.toString().padStart(2, "0")}:${seconds
           .toString()
           .padStart(2, "0")}`
       );
     };
 
     calculateTimeLeft();
     const timer = setInterval(calculateTimeLeft, 1000);
     return () => clearInterval(timer);
   }, [expiryDate]);
 
   return <>{timeLeft}</>;
 }

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
  const { data: fetchedOrder, isLoading: isQueryLoading, refetch } = trpc.orders.getById.useQuery(
    { orderId: initialOrderId! },
    { enabled: !!initialOrderId }
  );

  const { data: contactInfo } = trpc.settings.get.useQuery({ key: "contact_info" });
  const uploadMutation = trpc.media.uploadPublic.useMutation();
  const uploadProofMutation = trpc.orders.uploadPaymentProof.useMutation();

  // Local state for image upload preview
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadProof = async () => {
    if (!pendingFile || !previewImage || !initialOrderId) return;

    try {
      setIsUploading(true);
      const uploadRes = await uploadMutation.mutateAsync({
        filename: pendingFile.name,
        contentType: pendingFile.type,
        base64Data: previewImage
      });

      await uploadProofMutation.mutateAsync({
        orderId: Number(initialOrderId),
        imageUrl: uploadRes.url
      });

      toast.success("Bukti bayar berhasil dikirim!");
      setPreviewImage(null);
      setPendingFile(null);
      refetch();
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err?.message || "Gagal mengirim bukti bayar");
    } finally {
      setIsUploading(false);
    }
  };

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

  const isLoading = isQueryLoading && !fetchedOrder;

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

  // Use real order data if available, otherwise fallback to basic info
  const order = fetchedOrder || {
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
    paymentProofUrl: null,
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

          {/* Status Alert with Countdown */}
          <Alert className={`mb-6 border-2 ${order.status === "CANCELLED" ? "border-red-200 bg-red-50" : "border-yellow-200 bg-yellow-50 shadow-sm"}`}>
            {order.status === "CANCELLED" ? (
              <AlertCircle className="h-5 w-5 text-red-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            )}
            <AlertDescription className={order.status === "CANCELLED" ? "text-red-800" : "text-yellow-800"}>
              <div className="flex flex-col gap-1">
                <strong className="text-base">
                  {order.status === "PROCESSING" ? "✅ Pembayaran Berhasil" : 
                   order.status === "CANCELLED" ? "❌ Pesanan Dibatalkan" : 
                   "⏳ Menunggu Pembayaran"}
                </strong>
                
                {order.status === "PENDING_PAYMENT" && (
                  <div className="mt-2 p-3 bg-white/60 rounded-lg border border-yellow-200/50">
                    <p className="text-sm font-bold flex items-center gap-2">
                      Selesaikan pembayaran dalam waktu:
                      <span className="text-red-600 font-black text-lg tabular-nums animate-pulse">
                        <CountdownTimer createdAt={order.createdAt} />
                      </span>
                    </p>
                    <p className="text-[11px] text-yellow-700 mt-1">
                      Pesanan otomatis dibatalkan jika melewati batas waktu 20 menit.
                    </p>
                  </div>
                )}

                {order.status === "CANCELLED" && (
                  <p className="text-sm mt-1">
                    Batas waktu pembayaran (20 menit) telah habis. Pesanan ini telah otomatis dibatalkan oleh sistem.
                  </p>
                )}

                {order.status === "PROCESSING" && (
                  <p className="text-sm mt-1">
                    Pembayaran Anda telah diverifikasi dan pesanan sedang disiapkan.
                  </p>
                )}
              </div>
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

          {/* Payment Instructions & Proof Upload */}
          {order.paymentMethod === "TRANSFER_BANK" && order.status === "PENDING_PAYMENT" && (
            <div className="space-y-4">
              <Card className="border-blue-200 bg-blue-50">
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
                    <p className="text-[10px] text-gray-500 mt-2">
                      ⚠️ Pastikan jumlah transfer sesuai hingga digit terakhir
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Proof Upload Section */}
              <Card className="border-slate-200 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-800">Konfirmasi & Bukti Bayar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50 transition-all">
                    {/* CASE 1: Already uploaded and saved in DB */}
                    {order.paymentProofUrl && !previewImage ? (
                      <div className="space-y-6 text-center w-full p-2">
                        <div className="relative group max-w-[280px] mx-auto">
                          <img 
                            src={order.paymentProofUrl} 
                            alt="Bukti Bayar" 
                            className="w-full rounded-2xl shadow-xl border-4 border-white"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              onClick={() => window.open(order.paymentProofUrl || "", "_blank")}
                              className="font-black rounded-xl shadow-lg gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              Lihat Bukti Bayar
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-3 bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm shadow-emerald-50">
                          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2 text-emerald-600">
                             <CheckCircle2 className="w-7 h-7" />
                          </div>
                          <h3 className="text-lg font-black text-emerald-900 leading-tight">
                            PEMBAYARAN SEDANG DI VERIFIKASI OLEH SISTEM
                          </h3>
                          <p className="text-sm text-slate-500 font-medium">
                            Proses ini membutuhkan waktu <span className="text-slate-900 font-bold">5-30 menit</span>
                          </p>
                          
                          <div className="pt-4 border-t border-slate-50 mt-4">
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-3">
                              Butuh bantuan segera?
                            </p>
                            <Button
                              variant="outline"
                              className="w-full border-emerald-500 text-emerald-800 bg-emerald-50/50 font-black h-12 rounded-xl hover:bg-emerald-100 transition-all gap-2 border-2 shadow-sm"
                              onClick={() => {
                                const waNumber = (contactInfo as any)?.whatsapp || "6281234567890";
                                const message = `Halo Admin, saya sudah mengirim bukti bayar untuk pesanan #${order.orderNumber}. Mohon bantu percepat verifikasi ya. Terima kasih!`;
                                window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, "_blank");
                              }}
                            >
                              <MessageCircle className="w-5 h-5 text-emerald-600" />
                              RESPONSE CEPAT VIA WHATSAPP
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : previewImage ? (
                      /* CASE 2: Image selected but not yet sent to Admin */
                      <div className="space-y-4 text-center w-full">
                        <div className="relative max-w-[280px] mx-auto">
                          <img 
                            src={previewImage} 
                            alt="Preview" 
                            className="w-full rounded-2xl shadow-xl border-4 border-white"
                          />
                          <div className="absolute -top-2 -right-2">
                             <Button 
                              size="icon" 
                              className="rounded-full h-8 w-8 shadow-xl bg-red-600 hover:bg-red-700 text-white border-2 border-white opacity-100 z-10"
                              onClick={() => {
                                setPreviewImage(null);
                                setPendingFile(null);
                              }}
                             >
                               <XCircle className="w-5 h-5 fill-white text-red-600" />
                             </Button>
                          </div>
                        </div>
                        
                        <div className="flex gap-3 px-2">
                          <Button 
                            variant="outline" 
                            className="flex-1 border-slate-300 text-slate-700 font-bold h-12 rounded-xl"
                            onClick={() => document.getElementById("proof-upload")?.click()}
                          >
                            Ganti Gambar
                          </Button>
                          <Button 
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black h-12 rounded-xl shadow-lg shadow-blue-200"
                            onClick={handleUploadProof}
                            disabled={isUploading}
                          >
                            {isUploading ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <Send className="w-4 h-4 mr-2" />
                            )}
                            KIRIM SEKARANG
                          </Button>
                        </div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                          Satu langkah lagi untuk verifikasi
                        </p>
                      </div>
                    ) : (
                      /* CASE 3: Initial State */
                      <div className="text-center py-8">
                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-xl shadow-blue-50 border border-slate-100 mx-auto mb-6 transform -rotate-3">
                          <Upload className="w-10 h-10 text-blue-500" />
                        </div>
                        <h4 className="font-black text-slate-800 mb-2 text-lg">Upload Bukti Bayar</h4>
                        <p className="text-sm text-slate-400 mb-8 max-w-[200px] mx-auto">Klik tombol di bawah untuk memilih foto dari galeri</p>
                        
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = () => {
                              setPreviewImage(reader.result as string);
                              setPendingFile(file);
                            };
                            reader.readAsDataURL(file);
                          }}
                          className="hidden"
                          id="proof-upload"
                        />
                        <Button 
                          asChild 
                          className="bg-slate-900 hover:bg-black text-white font-black px-10 h-14 rounded-2xl shadow-2xl shadow-slate-300 border-none text-base"
                        >
                          <label htmlFor="proof-upload" className="cursor-pointer">
                            PILIH FOTO BUKTI
                          </label>
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="pt-6 border-t border-slate-100 mt-2">
                    <div className="bg-emerald-500 p-6 rounded-3xl shadow-xl shadow-emerald-100 border-b-4 border-emerald-700">
                      <p className="text-[11px] text-emerald-50 font-black text-center mb-4 flex items-center justify-center gap-2 uppercase tracking-widest">
                        <MessageCircle className="w-4 h-4" /> Konfirmasi Cepat via WhatsApp
                      </p>
                      <Button
                        className="w-full bg-white hover:bg-slate-50 text-emerald-600 font-black h-16 rounded-2xl shadow-lg border-none text-lg flex items-center justify-center gap-3"
                        onClick={() => {
                          const waNumber = (contactInfo as any)?.whatsapp || "6281234567890";
                          const message = `Halo Admin, saya ingin konfirmasi pembayaran untuk pesanan #${order.orderNumber}.\nTotal: Rp${order.total.toLocaleString("id-ID")}\nSudah saya upload bukti bayarnya di sistem.`;
                          window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, "_blank");
                        }}
                      >
                        <MessageCircle className="w-6 h-6 fill-emerald-600 text-white" />
                        HUBUNGI ADMIN SEKARANG
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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
