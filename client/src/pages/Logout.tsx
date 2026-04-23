import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2 } from "lucide-react";

export default function Logout() {
  const [, navigate] = useLocation();
  const { logout } = useAuth();

  useEffect(() => {
    const doLogout = async () => {
      await logout();
      navigate("/login");
    };
    doLogout();
  }, [logout, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-red-600 mx-auto mb-4" />
        <p className="text-gray-600">Sedang keluar...</p>
      </div>
    </div>
  );
}


