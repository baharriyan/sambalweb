import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import AdminLayout from "./AdminLayout";
import { 
  Download, 
  FileText, 
  TrendingUp, 
  Package, 
  AlertTriangle,
  ArrowUpRight,
  ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function AdminReports() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuth();

  const { data: stats } = trpc.analytics.getDashboardStats.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  if (loading || !user || user.role !== "admin") return null;

  const exportToCSV = () => {
    // Basic CSV Export Logic
    const headers = ["Metrik", "Nilai"];
    const rows = [
      ["Pesanan Hari Ini", stats?.todayOrders || 0],
      ["Pendapatan Hari Ini", stats?.todayRevenue || 0],
      ["Pendapatan Bulan Ini", stats?.monthRevenue || 0],
      ["Total User", stats?.totalUsers || 0],
      ["Produk Aktif", stats?.activeProducts || 0],
    ];

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `laporan_sambalco_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout title="Laporan & Analitik">
      <div className="space-y-8">
        {/* Header Action */}
        <div className="flex justify-between items-center bg-slate-900 p-8 rounded-[2rem] text-white shadow-2xl shadow-slate-200">
          <div>
            <h3 className="text-2xl font-black tracking-tight">Pusat Laporan Bisnis</h3>
            <p className="text-slate-400 text-sm mt-1">Pantau performa penjualan dan stok secara real-time</p>
          </div>
          <Button 
            onClick={exportToCSV}
            className="bg-white text-slate-900 hover:bg-slate-100 rounded-2xl py-6 px-8 flex items-center gap-3 font-bold transition-transform hover:scale-105 active:scale-95"
          >
            <Download className="w-5 h-5" />
            Ekspor CSV
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Summary */}
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-none shadow-sm overflow-hidden bg-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Penjualan Bulan Ini</CardTitle>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black text-slate-800">Rp {stats?.monthRevenue?.toLocaleString("id-ID") || 0}</div>
                  <div className="flex items-center gap-1 mt-2 text-emerald-500 font-bold text-xs">
                    <ArrowUpRight className="w-3 h-3" />
                    <span>+12.5% dari bulan lalu</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm overflow-hidden bg-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Target Tercapai</CardTitle>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black text-slate-800">84%</div>
                  <div className="w-full h-2 bg-slate-100 rounded-full mt-4 overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '84%' }} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Details */}
            <Card className="border-none shadow-sm bg-white">
              <CardHeader className="p-8 border-b border-slate-50">
                <CardTitle className="text-lg font-bold text-slate-800">Rincian Performa Katalog</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-50">
                  {[
                    { label: "Total Pesanan", value: stats?.todayOrders || 0, sub: "Hari ini", color: "text-red-500" },
                    { label: "Pelanggan Baru", value: stats?.totalUsers || 0, sub: "Bulan ini", color: "text-blue-500" },
                    { label: "Produk Teraktif", value: stats?.activeProducts || 0, sub: "Varian sambal", color: "text-emerald-500" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-8 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-1.5 h-8 bg-slate-100 rounded-full" />
                        <div>
                          <p className="text-sm font-bold text-slate-800">{item.label}</p>
                          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{item.sub}</p>
                        </div>
                      </div>
                      <div className={cn("text-2xl font-black", item.color)}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Alerts */}
          <div className="space-y-6">
            <Card className="border-none shadow-sm bg-white">
              <CardHeader className="p-6">
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Peringatan Stok Rendah
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-0">
                <div className="space-y-4">
                  {stats?.lowStockProducts && stats.lowStockProducts.length > 0 ? (
                    stats.lowStockProducts.map((p: any) => (
                      <div key={p.id} className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Package className="w-4 h-4 text-amber-600" />
                          <span className="text-xs font-bold text-slate-700 truncate max-w-[120px]">{p.name}</span>
                        </div>
                        <span className="text-[10px] font-black text-amber-700 bg-white px-2 py-1 rounded-lg">
                          SISA {p.stock}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-4 italic">Semua stok dalam kondisi aman</p>
                  )}
                </div>
              </CardContent>
            </Card>


          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
