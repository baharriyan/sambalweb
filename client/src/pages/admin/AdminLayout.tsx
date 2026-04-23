import React from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Users, 
  BarChart, 
  LogOut, 
  Menu, 
  X,
  ChevronRight,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const [location] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/rahasia/dashboard" },
    { name: "Produk", icon: Package, href: "/rahasia/products" },
    { name: "Pesanan", icon: ShoppingBag, href: "/rahasia/orders" },
    { name: "User", icon: Users, href: "/rahasia/users" },
    { name: "Laporan", icon: BarChart, href: "/rahasia/reports" },
    { name: "Settings", icon: Settings, href: "/rahasia/settings" },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-slate-900">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-white border-r border-slate-200 transition-all duration-300 ease-in-out z-50 flex flex-col fixed inset-y-0 shadow-2xl lg:shadow-none",
          isSidebarOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full lg:w-20 lg:translate-x-0"
        )}
      >
        <div className="p-6 flex items-center justify-between border-b border-slate-50">
          <Link href="/rahasia/dashboard">
            <div className={cn("flex items-center gap-3 cursor-pointer", !isSidebarOpen && "lg:justify-center lg:w-full")}>
              <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-200 flex-shrink-0">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <AnimatePresence>
                {(isSidebarOpen || (typeof window !== 'undefined' && window.innerWidth < 1024)) && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="font-bold text-xl tracking-tight bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent whitespace-nowrap"
                  >
                    Sambal Admin
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsSidebarOpen(false)}>
            <X className="w-5 h-5 text-slate-500" />
          </Button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-6 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div 
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group relative",
                    isActive 
                      ? "bg-red-50 text-red-600 shadow-sm" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-red-600" : "group-hover:text-slate-900")} />
                  {(isSidebarOpen || (typeof window !== 'undefined' && window.innerWidth < 1024)) && (
                    <span className="font-bold text-sm tracking-tight flex-1 whitespace-nowrap">{item.name}</span>
                  )}
                  {isActive && isSidebarOpen && (
                    <div className="absolute left-0 w-1 h-6 bg-red-600 rounded-r-full" />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <Link href="/rahasia/logout">
            <div className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer group",
              !isSidebarOpen && "lg:justify-center"
            )}>
              <LogOut className="w-5 h-5 flex-shrink-0 group-hover:rotate-12 transition-transform" />
              {(isSidebarOpen || (typeof window !== 'undefined' && window.innerWidth < 1024)) && (
                <span className="font-bold text-sm tracking-tight">Logout</span>
              )}
            </div>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-300 min-h-screen flex flex-col",
        isSidebarOpen ? "lg:ml-64" : "lg:ml-20"
      )}>
        {/* Top Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-4 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-slate-500 hover:bg-slate-100 rounded-xl"
            >
              <Menu className="w-6 h-6" />
            </Button>
            <h2 className="text-lg lg:text-xl font-black text-slate-800 tracking-tight">{title}</h2>
          </div>

          <div className="flex items-center gap-3 lg:gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-900">Administrator</p>
              <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Super Admin</p>
            </div>
            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm">
              <img 
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-8 flex-1">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-7xl mx-auto"
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
