import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { trpc, RouterOutputs } from "@/lib/trpc";
import AdminLayout from "./AdminLayout";
import {
  Users,
  Search,
  Shield,
  ShieldAlert,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type User = RouterOutputs["users"]["getAllUsers"][number];

export default function AdminUsers() {
  const [, navigate] = useLocation();
  const { user: currentUser, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: users,
    refetch,
    isLoading,
    error,
  } = trpc.users.getAllUsers.useQuery({ limit: 100, offset: 0 });
  const blockMutation = trpc.users.blockUser.useMutation();
  const unblockMutation = trpc.users.unblockUser.useMutation();

  useEffect(() => {
    if (!loading && (!currentUser || currentUser.role !== "admin")) {
      navigate("/");
    }
  }, [currentUser, loading, navigate]);

  if (loading || !currentUser || currentUser.role !== "admin") return null;

  const handleToggleBlock = async (user: User) => {
    try {
      if (user.isBlocked) {
        await unblockMutation.mutateAsync({ userId: user.id });
        toast.success(`User ${user.name || user.email} telah diaktifkan kembali`);
      } else {
        await blockMutation.mutateAsync({ userId: user.id });
        toast.error(`User ${user.name || user.email} telah diblokir`);
      }
      refetch();
    } catch {
      toast.error("Gagal mengubah status user");
    }
  };

  const filteredUsers =
    users?.filter(
      (u: User) =>
        (u.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (u.email?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    ) || [];

  return (
    <AdminLayout title="Manajemen Pengguna">
      <div className="space-y-6">
        {/* Search & Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              Daftar Pengguna Sistem
            </h3>
            <p className="text-sm text-slate-500">
              Kelola akses dan status akun pelanggan
            </p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 text-sm"
            />
          </div>
        </div>

        {/* Users Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-3xl p-10 text-center">
            <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-red-800">
              Gagal Memuat Data
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredUsers.map((user: User, idx: number) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card
                  className={cn(
                    "border-none shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300",
                    user.isBlocked ? "opacity-75" : ""
                  )}
                >
                  <CardContent className="p-0">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                          <div
                            className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold border",
                              user.role === "admin"
                                ? "bg-red-50 text-red-600 border-red-100"
                                : "bg-slate-50 text-slate-600 border-slate-100"
                            )}
                          >
                            {(user.name || user.email || "?").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-800">
                                {user.name || "User"}
                              </h4>
                              {user.role === "admin" && (
                                <Shield className="w-3.5 h-3.5 text-red-500" />
                              )}
                            </div>
                            <span
                              className={cn(
                                "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider",
                                user.isBlocked
                                  ? "bg-red-100 text-red-600"
                                  : "bg-emerald-100 text-emerald-600"
                              )}
                            >
                              {user.isBlocked ? "Terblokir" : "Aktif"}
                            </span>
                          </div>
                        </div>

                        {user.id !== currentUser?.id && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleToggleBlock(user)}
                            className={cn(
                              "rounded-xl transition-colors",
                              user.isBlocked
                                ? "text-emerald-500 hover:bg-emerald-50"
                                : "text-slate-400 hover:bg-red-50 hover:text-red-600"
                            )}
                          >
                            {user.isBlocked ? (
                              <UserCheck className="w-5 h-5" />
                            ) : (
                              <UserX className="w-5 h-5" />
                            )}
                          </Button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-slate-500">
                          <Mail className="w-4 h-4" />
                          <span className="text-xs font-medium truncate">
                            {user.email || "Tidak ada email"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-500">
                          <Phone className="w-4 h-4" />
                          <span className="text-xs font-medium">
                            {user.phone || "-"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-400 pt-3 border-t border-slate-50">
                          <Calendar className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">
                            Joined{" "}
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString(
                              "id-ID",
                              { month: "short", year: "numeric" }
                            ) : "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {filteredUsers.length === 0 && (
          <div className="bg-white rounded-3xl p-20 border border-dashed border-slate-200 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <Users className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">
              Tidak ada pengguna ditemukan
            </h3>
            <p className="text-slate-400 mt-2">
              Coba gunakan kata kunci pencarian yang berbeda
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
