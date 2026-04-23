import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useCart } from "@/contexts/CartContextHook";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  Menu,
  X,
  LogOut,
  Settings,
  User,
  Heart,
} from "lucide-react";
import { MiniCartDrawer } from "@/components/MiniCartDrawer";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth();
  const { getTotalItems } = useCart();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { label: "Beranda", href: "/" },
    { label: "Produk", href: "/catalog" },
    { label: "Cara Pesan", href: "/#how-to-order" },
    { label: "FAQ", href: "/#faq" },
  ];

  const isActive = (href: string) => location === href;
  const cartItemsCount = getTotalItems();

  return (
    <>
      <nav
        className={`sticky top-0 z-50 transition-all duration-500 ${
          isScrolled
            ? "bg-white/80 backdrop-blur-lg border-b border-slate-100 py-2 shadow-sm"
            : "bg-transparent py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo */}
            <Link href="/">
              <div className="flex items-center space-x-2 cursor-pointer">
                <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <span className="font-bold text-lg text-gray-900 hidden sm:inline">
                  Sambal Premium
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map(item =>
                item.href.includes("#") ? (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? "bg-red-100 text-red-900"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link key={item.href} href={item.href}>
                    <a
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive(item.href)
                          ? "bg-red-100 text-red-900"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {item.label}
                    </a>
                  </Link>
                )
              )}
              {user && (
                <Link href="/dashboard">
                  <a className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">
                    Dashboard
                  </a>
                </Link>
              )}
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-4">
              {/* Cart Icon - Opens Drawer */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-gray-700 hover:text-red-600 transition-colors"
              >
                <ShoppingCart className="w-6 h-6" />
                {cartItemsCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {cartItemsCount > 99 ? "99+" : cartItemsCount}
                  </span>
                )}
              </button>

              {/* Auth Buttons */}
              {!user ? (
                <div className="hidden sm:flex space-x-2">
                  <Link href="/login">
                    <Button variant="outline" size="sm">
                      Masuk
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm" className="bg-red-600 hover:bg-red-700">
                      Daftar
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user.role === "admin" ? "Admin" : "Pelanggan"}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {user.role === "admin" && (
                      <Link href="/rahasia">
                        <Button
                          variant="outline"
                          size="sm"
                          className="hidden sm:flex"
                        >
                          <Settings className="w-4 h-4 mr-1" />
                          Admin
                        </Button>
                      </Link>
                    )}
                    {user.role !== "admin" && (
                      <Link href="/dashboard">
                        <Button
                          variant="outline"
                          size="sm"
                          className="hidden sm:flex"
                        >
                          <User className="w-4 h-4 mr-1" />
                          Profil
                        </Button>
                      </Link>
                    )}
                    {user.role !== "admin" && (
                      <Link href="/wishlist">
                        <Button
                          variant="outline"
                          size="sm"
                          className="hidden sm:flex"
                        >
                          <Heart className="w-4 h-4 mr-1 text-red-600" />
                          Wishlist
                        </Button>
                      </Link>
                    )}
                    <Link
                      href={
                        user.role === "admin" ? "/rahasia/logout" : "/logout"
                      }
                    >
                      <Button variant="ghost" size="sm">
                        <LogOut className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-2 text-gray-700"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 bg-white">
              <div className="px-2 pt-2 pb-3 space-y-1">
                {navItems.map(item =>
                  item.href.includes("#") ? (
                    <a
                      key={item.href}
                      href={item.href}
                      className={`block px-3 py-2 rounded-md text-base font-medium ${
                        isActive(item.href)
                          ? "bg-red-100 text-red-900"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link key={item.href} href={item.href}>
                      <a
                        className={`block px-3 py-2 rounded-md text-base font-medium ${
                          isActive(item.href)
                            ? "bg-red-100 text-red-900"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item.label}
                      </a>
                    </Link>
                  )
                )}
                {user && (
                  <Link href="/dashboard">
                    <a className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100">
                      Dashboard
                    </a>
                  </Link>
                )}
                {!user && (
                  <div className="px-3 py-2 space-y-2">
                    <Link href="/login">
                      <Button variant="outline" size="sm" className="w-full">
                        Masuk
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button
                        size="sm"
                        className="w-full bg-red-600 hover:bg-red-700"
                      >
                        Daftar
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Mini Cart Drawer */}
      <MiniCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
    </>
  );
}


