import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
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
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminOrders() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: allOrders, refetch, isLoading, error } = trpc.orders.getAllOrders.useQuery({ limit: 100, offset: 0 });
  const updateStatusMutation = trpc.orders.updateStatus.useMutation();

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  if (loading || !user || user.role !== "admin") return null;

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({
        orderId,
        status: newStatus as any,
      });
      toast.success("Status pesanan berhasil diperbarui");
      refetch();
    } catch (error: unknown) {
      toast.error("Gagal memperbarui status");
    }
  };

  const filteredOrders = allOrders?.filter((o: any) => {
    const matchesStatus = statusFilter ? o.status === statusFilter : true;
    const matchesSearch = searchQuery 
      ? (o.orderNumber?.toLowerCase() || "").includes(searchQuery.toLowerCase()) || 
        (o.customerName?.toLowerCase() || "").includes(searchQuery.toLowerCase())
      : true;
    return matchesStatus && matchesSearch;
  });

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    PENDING_PAYMENT: { label: "Menunggu", color: "bg-amber-50 text-amber-600 border-amber-200", icon: Clock },
    PROCESSING: { label: "Diproses", color: "bg-blue-50 text-blue-600 border-blue-200", icon: CreditCard },
    SHIPPED: { label: "Dikirim", color: "bg-indigo-50 text-indigo-600 border-indigo-200", icon: Truck },
    COMPLETED: { label: "Selesai", color: "bg-emerald-50 text-emerald-600 border-emerald-200", icon: CheckCircle2 },
    CANCELLED: { label: "Batal", color: "bg-red-50 text-red-600 border-red-200", icon: XCircle },
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
              className={cn("rounded-xl transition-all", statusFilter === null ? "bg-red-600 shadow-lg shadow-red-200" : "border-slate-200")}
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
                  statusFilter === status ? "bg-red-600 shadow-lg shadow-red-200" : "border-slate-200"
                )}
              >
                {config.label}
              </Button>
            ))}
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Order ID atau Pelanggan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 text-sm"
            />
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
              <h3 className="text-lg font-bold text-red-800">Gagal Memuat Pesanan</h3>
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
            filteredOrders.map((order: any, idx: number) => {
              const config = statusConfig[order.status];
              const StatusIcon = config.icon;
              const isExpanded = expandedOrderId === order.id;

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className={cn(
                    "border-none shadow-sm overflow-hidden transition-all duration-300",
                    isExpanded ? "ring-2 ring-red-500/10 shadow-md" : "hover:shadow-md"
                  )}>
                    <CardContent className="p-0">
                      <div 
                        className="p-6 cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn("p-3 rounded-2xl", config.color.split(' ')[0])}>
                            <StatusIcon className={cn("w-6 h-6", config.color.split(' ')[1])} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{order.orderNumber}</p>
                            <p className="text-xs text-slate-400 font-medium">
                              {new Date(order.createdAt).toLocaleString("id-ID", { dateStyle: 'medium', timeStyle: 'short' })}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 flex-1 md:px-8">
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Pelanggan</p>
                            <p className="text-sm font-bold text-slate-700">{order.customerName}</p>
                          </div>
                          <div className="hidden md:block">
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Total Bayar</p>
                            <p className="text-sm font-bold text-red-600">Rp {order.total.toLocaleString("id-ID")}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Kurir</p>
                            <p className="text-sm font-bold text-slate-700">{order.shippingCourier}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end md:self-auto">
                          <div className={cn("px-3 py-1 rounded-full text-[11px] font-bold border", config.color)}>
                            {config.label.toUpperCase()}
                          </div>
                          {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-300" /> : <ChevronDown className="w-5 h-5 text-slate-300" />}
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
                                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Informasi Kontak</h4>
                                  <p className="text-sm text-slate-600 font-medium">{order.customerEmail || 'No Email'}</p>
                                  <p className="text-sm text-slate-600 font-medium">{order.customerPhone}</p>
                                </div>
                                <div>
                                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Catatan Pesanan</h4>
                                  <p className="text-sm text-slate-500 italic">"{order.notes || 'Tidak ada catatan'}"</p>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Alamat Pengiriman</h4>
                                <div className="text-sm text-slate-600 space-y-1">
                                  <p className="font-bold text-slate-800 underline decoration-red-200 underline-offset-4">{order.shippingCity}</p>
                                  <p className="leading-relaxed">{order.shippingAddress}</p>
                                </div>
                                {order.paymentProofUrl && (
                                  <div className="mt-4">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Bukti Pembayaran</h4>
                                    <a href={order.paymentProofUrl} target="_blank" rel="noreferrer" className="block w-24 h-24 rounded-xl overflow-hidden border border-slate-200 hover:ring-2 hover:ring-red-500 transition-all">
                                      <img src={order.paymentProofUrl} alt="Bukti Bayar" className="w-full h-full object-cover" />
                                    </a>
                                  </div>
                                )}
                              </div>

                              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 text-center">Ganti Status Pesanan</h4>
                                <div className="grid grid-cols-1 gap-2">
                                  <select
                                    value={order.status}
                                    onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 text-sm font-bold appearance-none cursor-pointer text-center"
                                  >
                                    {Object.entries(statusConfig).map(([status, cfg]) => (
                                      <option key={status} value={status}>
                                        {cfg.label.toUpperCase()}
                                      </option>
                                    ))}
                                  </select>
                                  <p className="text-[9px] text-center text-slate-400 italic mt-2">* Status akan langsung berubah saat dipilih</p>
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
              <h3 className="text-xl font-bold text-slate-800">Tidak ada pesanan</h3>
              <p className="text-slate-400 mt-2">Coba ganti filter atau kata kunci pencarian Anda</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
