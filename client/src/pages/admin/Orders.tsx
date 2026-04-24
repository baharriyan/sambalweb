import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { trpc, RouterOutputs } from "@/lib/trpc";
import AdminLayout from "./AdminLayout";
import {
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  CreditCard,
  Search,
  RefreshCcw,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import type { LucideIcon } from "lucide-react";

type Order = RouterOutputs["orders"]["getAllOrders"][number];
type OrderStatus = "PENDING_PAYMENT" | "PROCESSING" | "SHIPPED" | "COMPLETED" | "CANCELLED";

const statusConfig: Record<
  string,
  { label: string; color: string; icon: LucideIcon }
> = {
  PENDING_PAYMENT: {
    label: "Menunggu",
    color: "bg-amber-50 text-amber-600 border-amber-200",
    icon: Clock,
  },
  PROCESSING: {
    label: "Diproses",
    color: "bg-blue-50 text-blue-600 border-blue-200",
    icon: CreditCard,
  },
  SHIPPED: {
    label: "Dikirim",
    color: "bg-indigo-50 text-indigo-600 border-indigo-200",
    icon: Truck,
  },
  COMPLETED: {
    label: "Selesai",
    color: "bg-emerald-50 text-emerald-600 border-emerald-200",
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: "Batal",
    color: "bg-red-50 text-red-600 border-red-200",
    icon: XCircle,
  },
};

export default function AdminOrders() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: allOrders,
    refetch,
    isLoading,
    error,
  } = trpc.orders.getAllOrders.useQuery({ limit: 100, offset: 0 });
  const updateStatusMutation = trpc.orders.updateStatus.useMutation();
  const syncPaymentsMutation = trpc.orders.syncAllPayments.useMutation();
  const checkOnePaymentMutation = trpc.orders.checkPaymentStatus.useMutation();

  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  if (loading || !user || user.role !== "admin") return null;

  const handleUpdateStatus = async (orderId: number, newStatus: string, trackingNumber?: string) => {
    try {
      await updateStatusMutation.mutateAsync({
        orderId,
        status: newStatus as OrderStatus,
        trackingNumber,
      });
      toast.success("Status pesanan berhasil diperbarui");
      refetch();
    } catch {
      toast.error("Gagal memperbarui status");
    }
  };

  const filteredOrders = allOrders?.filter((o: Order) => {
    const matchesStatus = statusFilter ? o.status === statusFilter : true;
    const matchesSearch = searchQuery
      ? (o.orderNumber?.toLowerCase() || "").includes(
          searchQuery.toLowerCase()
        ) ||
        (o.customerName?.toLowerCase() || "").includes(
          searchQuery.toLowerCase()
        )
      : true;
    return matchesStatus && matchesSearch;
  });

  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      await syncPaymentsMutation.mutateAsync();
      toast.success("Sinkronisasi pembayaran berhasil");
      refetch();
    } catch (err) {
      toast.error("Gagal sinkronisasi pembayaran");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCheckPayment = async (orderId: number) => {
    try {
      const result = await checkOnePaymentMutation.mutateAsync({ orderId });
      if (result.paid) {
        toast.success("Pembayaran terverifikasi!");
      } else {
        toast.info(`Status pembayaran: ${result.status}`);
      }
      refetch();
    } catch {
      toast.error("Gagal memeriksa pembayaran");
    }
  };

  return (
    <AdminLayout title="Manajemen Pesanan">
      <div className="space-y-6">
        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={statusFilter === null ? "default" : "outline"}
              onClick={() => setStatusFilter(null)}
              className={cn(
                "rounded-xl transition-all",
                statusFilter === null
                  ? "bg-red-600 shadow-lg shadow-red-200"
                  : "border-slate-200"
              )}
            >
              Semua
            </Button>
            {Object.entries(statusConfig).map(([status, config]) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "rounded-xl transition-all capitalize",
                  statusFilter === status
                    ? "bg-red-600 shadow-lg shadow-red-200"
                    : "border-slate-200"
                )}
              >
                {config.label}
              </Button>
            ))}
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              onClick={handleSyncAll}
              disabled={isSyncing}
              className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 flex-1 md:flex-none"
            >
              <RefreshCcw
                className={cn("w-4 h-4 mr-2", isSyncing && "animate-spin")}
              />
              {isSyncing ? "Sinkronisasi..." : "Sinkronisasi Pembayaran"}
            </Button>

            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari Order ID atau Pelanggan..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="grid grid-cols-1 gap-4">
          {isLoading ? (
            <div className="flex justify-center py-20 bg-white rounded-3xl border border-slate-100">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-100 rounded-3xl p-10 text-center">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-red-800">
                Gagal Memuat Pesanan
              </h3>
              <p className="text-red-600/70 text-sm mt-1">{error.message}</p>
              <Button
                variant="outline"
                onClick={() => refetch()}
                className="mt-6 rounded-xl border-red-200 text-red-600 hover:bg-red-50"
              >
                Coba Lagi
              </Button>
            </div>
          ) : filteredOrders && filteredOrders.length > 0 ? (
            filteredOrders.map((order: Order, idx: number) => {
              const config = statusConfig[order.status || "PENDING_PAYMENT"];
              const StatusIcon = config.icon;
              const isExpanded = expandedOrderId === order.id;

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card
                    className={cn(
                      "border-none shadow-sm overflow-hidden transition-all duration-300",
                      isExpanded
                        ? "ring-2 ring-red-500/10 shadow-md"
                        : "hover:shadow-md"
                    )}
                  >
                    <CardContent className="p-0">
                      <div
                        className="p-6 cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                        onClick={() =>
                          setExpandedOrderId(isExpanded ? null : order.id)
                        }
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={cn(
                              "p-3 rounded-2xl",
                              config.color.split(" ")[0]
                            )}
                          >
                            <StatusIcon
                              className={cn(
                                "w-6 h-6",
                                config.color.split(" ")[1]
                              )}
                            />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">
                              {order.orderNumber}
                            </p>
                            <p className="text-xs text-slate-400 font-medium">
                              {order.createdAt ? new Date(order.createdAt).toLocaleString(
                                "id-ID",
                                { dateStyle: "medium", timeStyle: "short" }
                              ) : "-"}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 flex-1 md:px-8">
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">
                              Pelanggan
                            </p>
                            <p className="text-sm font-bold text-slate-700">
                              {order.customerName}
                            </p>
                          </div>
                          <div className="hidden md:block">
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">
                              Total Bayar
                            </p>
                            <p className="text-sm font-bold text-red-600">
                              Rp {order.total.toLocaleString("id-ID")}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">
                              Kurir
                            </p>
                            <p className="text-sm font-bold text-slate-700">
                              {order.shippingCourier}
                            </p>
                          </div>
                          <div className="hidden lg:block">
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">
                              Metode Bayar
                            </p>
                            <span className={cn(
                              "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                              order.paymentMethod === "TRANSFER_BANK" 
                                ? "bg-amber-100 text-amber-700" 
                                : "bg-blue-100 text-blue-700"
                            )}>
                              {order.paymentMethod === "TRANSFER_BANK" ? "Manual" : "Otomatis"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end md:self-auto">
                          <div
                            className={cn(
                              "px-3 py-1 rounded-full text-[11px] font-bold border",
                              config.color
                            )}
                          >
                            {config.label.toUpperCase()}
                          </div>
                          {order.status === "PENDING_PAYMENT" &&
                            order.paymentMethod === "MIDTRANS" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={e => {
                                  e.stopPropagation();
                                  handleCheckPayment(order.id);
                                }}
                                className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600"
                                title="Cek Status Pembayaran"
                              >
                                <RefreshCcw className="w-4 h-4" />
                              </Button>
                            )}
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-slate-300" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-300" />
                          )}
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-slate-50/50 border-t border-slate-100"
                          >
                            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                              <div className="space-y-4">
                                <div>
                                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                                    Informasi Kontak
                                  </h4>
                                  <p className="text-sm text-slate-600 font-medium">
                                    {order.customerEmail || "No Email"}
                                  </p>
                                  <p className="text-sm text-slate-600 font-medium">
                                    {order.customerPhone}
                                  </p>
                                </div>
                                {order.paymentMethod === "TRANSFER_BANK" ? (
                                  order.paymentProofUrl && (
                                    <div className="pt-2 border-t border-slate-100">
                                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                                        Bukti Pembayaran (Manual)
                                      </h4>
                                      <div className="relative group overflow-hidden rounded-xl border border-slate-200">
                                        <img 
                                          src={order.paymentProofUrl} 
                                          alt="Bukti" 
                                          className="w-full h-48 object-cover cursor-zoom-in hover:scale-105 transition-transform duration-300"
                                          onClick={() => window.open(order.paymentProofUrl || "", '_blank')}
                                        />
                                        <div className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                          <ExternalLink className="w-4 h-4" />
                                        </div>
                                        {order.status === "PENDING_PAYMENT" && (
                                          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent flex gap-2">
                                            <Button
                                              size="sm"
                                              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl border-none shadow-lg"
                                              onClick={() => {
                                                if (confirm("Terima bukti bayar ini? Status akan berubah menjadi DIPROSES.")) {
                                                  handleUpdateStatus(order.id, "PROCESSING");
                                                  toast.success("Pembayaran diterima!");
                                                }
                                              }}
                                            >
                                              <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                              TERIMA
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="destructive"
                                              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl border-none shadow-lg"
                                              onClick={() => {
                                                if (confirm("Tolak bukti bayar ini? Pesanan akan otomatis DIBATALKAN.")) {
                                                  handleUpdateStatus(order.id, "CANCELLED");
                                                  toast.error("Pesanan dibatalkan");
                                                }
                                              }}
                                            >
                                              <XCircle className="w-4 h-4 mr-1.5" />
                                              TOLAK
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )
                                ) : (
                                  <div className="pt-2 border-t border-slate-100">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                                      Sistem Pembayaran
                                    </h4>
                                    <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl flex items-center gap-3">
                                      <CreditCard className="w-5 h-5 text-blue-500" />
                                      <div>
                                        <p className="text-xs font-bold text-blue-900 uppercase">Otomatis</p>
                                        <p className="text-[10px] text-blue-600">Terverifikasi oleh sistem</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                <div>
                                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                                    Catatan Pesanan
                                  </h4>
                                  <p className="text-sm text-slate-500 italic">
                                    "{order.notes || "Tidak ada catatan"}"
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                                  Alamat Pengiriman
                                </h4>
                                <div className="text-sm text-slate-600 space-y-1">
                                  <p className="font-bold text-slate-800 underline decoration-red-200 underline-offset-4">
                                    {order.shippingCity}
                                  </p>
                                  <p className="leading-relaxed">
                                    {order.shippingAddress}
                                  </p>
                                </div>
                              </div>

                                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-full">
                                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 text-center">
                                    Manajemen Status & Resi
                                  </h4>
                                  <div className="space-y-3">
                                    <div className="relative">
                                      <select
                                        value={order.status}
                                        onChange={e =>
                                          handleUpdateStatus(
                                            order.id,
                                            e.target.value
                                          )
                                        }
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 text-sm font-bold appearance-none cursor-pointer text-center"
                                      >
                                        {Object.entries(statusConfig).map(
                                          ([status, cfg]) => (
                                            <option key={status} value={status}>
                                              {cfg.label.toUpperCase()}
                                            </option>
                                          )
                                        )}
                                      </select>
                                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                    </div>

                                    {(order.status === "SHIPPED" || order.status === "COMPLETED") && (
                                      <div className="space-y-2 pt-2 border-t border-slate-100">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase text-center block">
                                          Nomor Resi
                                        </label>
                                        <div className="flex gap-2">
                                          <input
                                            type="text"
                                            placeholder="Input No. Resi..."
                                            defaultValue={order.trackingNumber || ""}
                                            id={`resi-${order.id}`}
                                            className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-red-500/20 outline-none"
                                          />
                                          <Button
                                            size="sm"
                                            onClick={() => {
                                              const resi = (document.getElementById(`resi-${order.id}`) as HTMLInputElement).value;
                                              handleUpdateStatus(order.id, order.status, resi);
                                            }}
                                            className="bg-red-600 hover:bg-red-700 text-white rounded-xl h-9 px-3"
                                          >
                                            Simpan
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                    <p className="text-[9px] text-center text-slate-400 italic mt-2">
                                      * Status akan langsung berubah saat dipilih
                                    </p>
                                  </div>
                                </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          ) : (
            <div className="bg-white rounded-3xl p-20 border border-dashed border-slate-200 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <ShoppingBag className="w-10 h-10 text-slate-200" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">
                Tidak ada pesanan
              </h3>
              <p className="text-slate-400 mt-2">
                Coba ganti filter atau kata kunci pencarian Anda
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
