import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  Activity,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "./AdminLayout";
import { motion } from "framer-motion";

const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  color,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  trend?: "up" | "down";
  trendValue?: string;
  color: string;
}) => (
  <Card className="border-none shadow-sm overflow-hidden group">
    <CardContent className="p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
          {trend && (
            <div className="flex items-center mt-2 gap-1">
              <TrendingUp
                className={`w-4 h-4 ${trend === "up" ? "text-emerald-500" : "text-red-500 rotate-180"}`}
              />
              <span
                className={
                  trend === "up"
                    ? "text-emerald-600 text-xs font-bold"
                    : "text-red-600 text-xs font-bold"
                }
              >
                {trendValue}
              </span>
              <span className="text-slate-400 text-[10px] ml-1">
                vs bulan lalu
              </span>
            </div>
          )}
        </div>
        <div
          className={`p-3 rounded-2xl ${color} text-white shadow-lg transition-transform group-hover:scale-110 duration-300`}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuth();

  const { data: products } = trpc.products.list.useQuery({
    isActive: undefined,
  });
  const { data: analytics } = trpc.analytics.getDashboardStats.useQuery(
    undefined,
    {
      enabled: !!user && user.role === "admin",
    }
  );
  const { data: trendData } = trpc.analytics.getRevenueTrend.useQuery(
    undefined,
    {
      enabled: !!user && user.role === "admin",
    }
  );
  const { data: orders } = trpc.orders.getAllOrders.useQuery({ limit: 10 });

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  if (loading || !user || user.role !== "admin") return null;

  const chartData = trendData || [];

  const stats = [
    {
      title: "Pendapatan Bulan Ini",
      value: `Rp ${analytics?.monthRevenue?.toLocaleString("id-ID") || "12.450.000"}`,
      icon: TrendingUp,
      trend: "up" as const,
      trendValue: "+12.5%",
      color: "bg-gradient-to-br from-emerald-400 to-teal-500",
    },
    {
      title: "Pesanan Baru",
      value:
        analytics?.todayOrders?.toString() ||
        orders?.length?.toString() ||
        "24",
      icon: ShoppingCart,
      trend: "up" as const,
      trendValue: "+8.2%",
      color: "bg-gradient-to-br from-blue-400 to-indigo-500",
    },
    {
      title: "Produk Aktif",
      value:
        analytics?.activeProducts?.toString() ||
        products?.length?.toString() ||
        "0",
      icon: Package,
      trend: "down" as const,
      trendValue: "-2.4%",
      color: "bg-gradient-to-br from-orange-400 to-red-500",
    },
    {
      title: "Total Pelanggan",
      value: analytics?.totalUsers?.toString() || "152",
      icon: Users,
      trend: "up" as const,
      trendValue: "+14.1%",
      color: "bg-gradient-to-br from-violet-400 to-purple-500",
    },
  ];

  return (
    <AdminLayout title="Dashboard Overview">
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <StatCard {...stat} />
            </motion.div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Activity className="w-5 h-5 text-red-600" />
                Tren Pendapatan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#ef4444"
                          stopOpacity={0.1}
                        />
                        <stop
                          offset="95%"
                          stopColor="#ef4444"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#ef4444"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorRev)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-indigo-600" />
                Statistik Pesanan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12 }}
                    />
                    <Tooltip
                      cursor={{ fill: "#f8fafc" }}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Bar
                      dataKey="orders"
                      fill="#6366f1"
                      radius={[6, 6, 0, 0]}
                      barSize={30}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Products */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-800">
              Produk Terlaris
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-4 px-4 font-semibold text-slate-600">
                      Produk
                    </th>
                    <th className="text-center py-4 px-4 font-semibold text-slate-600">
                      Penjualan
                    </th>
                    <th className="text-right py-4 px-4 font-semibold text-slate-600">
                      Total
                    </th>
                    <th className="text-right py-4 px-4 font-semibold text-slate-600">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      name: "Sambal Bawang Ekstra Pedas",
                      sales: 45,
                      revenue: "Rp 1.350.000",
                      status: "Tinggi",
                    },
                    {
                      name: "Sambal Ijo Padang",
                      sales: 38,
                      revenue: "Rp 950.000",
                      status: "Stabil",
                    },
                    {
                      name: "Sambal Matah Bali",
                      sales: 32,
                      revenue: "Rp 1.280.000",
                      status: "Tinggi",
                    },
                    {
                      name: "Sambal Terasi Premium",
                      sales: 28,
                      revenue: "Rp 980.000",
                      status: "Normal",
                    },
                  ].map((item, i) => (
                    <tr
                      key={i}
                      className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-4 px-4 font-medium text-slate-800">
                        {item.name}
                      </td>
                      <td className="py-4 px-4 text-center text-slate-600">
                        {item.sales}
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-slate-900">
                        {item.revenue}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span
                          className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            item.status === "Tinggi"
                              ? "bg-emerald-50 text-emerald-600"
                              : item.status === "Stabil"
                                ? "bg-blue-50 text-blue-600"
                                : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}


