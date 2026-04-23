import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Lock, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const { loading, refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginMutation = trpc.auth.login.useMutation();

  // Hapus useEffect auto-redirect yang berpotensi loop
  // Kita akan gunakan navigasi eksplisit di handleAdminLogin

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await loginMutation.mutateAsync({
        email,
        password,
        isAdminLogin: true,
      });

      await refresh();

      if (response.user?.role === "admin") {
        navigate("/rahasia/dashboard");
      } else {
        setError(
          "Akses ditolak. Hanya akun dengan role 'admin' yang dapat masuk di sini."
        );
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Login gagal. Silakan periksa kredensial Anda.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Loader2 className="w-12 h-12 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-600 rounded-2xl mb-4 shadow-2xl">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Admin Portal
          </h1>
          <p className="text-gray-400 mt-2">Masuk ke area manajemen rahasia</p>
        </div>

        <Card className="border-0 bg-white shadow-2xl">
          <CardHeader className="border-b border-gray-100 pb-4">
            <CardTitle className="text-center text-gray-800">
              Admin Login
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8 space-y-6">
            <form onSubmit={handleAdminLogin} className="space-y-4">
              {error && (
                <Alert
                  variant="destructive"
                  className="bg-red-50 border-red-200"
                >
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Admin</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="h-12 border-gray-200 focus:ring-red-600"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="h-12 border-gray-200 focus:ring-red-600"
                  disabled={isSubmitting}
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-12 shadow-lg transition-all active:scale-[0.98]"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  "Masuk ke Dashboard"
                )}
              </Button>
            </form>

            <div className="pt-4 text-center">
              <a
                href="/"
                className="text-sm text-gray-500 hover:text-red-600 transition-colors"
              >
                &larr; Kembali ke Situs Utama
              </a>
            </div>
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-gray-500 text-xs uppercase tracking-widest">
          Secure Access Only • Sambal Premium &copy; 2026
        </p>
      </div>
    </div>
  );
}


