import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, LogIn, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Login() {
  const [, navigate] = useLocation();
  const { loading, refresh } = useAuth();
  const utils = trpc.useUtils();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginMutation = trpc.auth.login.useMutation();

  // Hapus useEffect auto-redirect yang berpotensi loop
  // Kita akan gunakan navigasi eksplisit di handleEmailLogin

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await loginMutation.mutateAsync({
        email,
        password,
        isAdminLogin: false,
      });

      // Update cache tRPC secara manual agar state user langsung berubah
      if (response.user) {
        utils.auth.me.setData(undefined, response.user);
      }

      await refresh();
      if (response.user?.role === "admin") {
        navigate("/rahasia/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err: unknown) {
      // Use proper error extraction without console.error
      const errorMessage =
        err instanceof Error ? err.message : "Login gagal. Silakan coba lagi.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg mb-4">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Sambal Premium</h1>
          <p className="text-gray-600 mt-2">Masuk ke Akun Anda</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
            <CardTitle className="text-center">Masuk</CardTitle>
          </CardHeader>
          <CardContent className="pt-8 space-y-6">
            {/* Email/Password Login Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold h-12"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-2" />
                    Masuk
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">atau</span>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">Belum punya akun?</span>
                <br />
                Daftar sekarang untuk mulai berbelanja sambal premium kami.
              </p>
            </div>

            {/* Register Link */}
            <a href="/register">
              <Button
                variant="outline"
                size="lg"
                className="w-full border-2 border-red-600 text-red-600 hover:bg-red-50 font-semibold h-12"
              >
                Buat Akun Baru
              </Button>
            </a>

            {/* Back to Home */}
            <a href="/">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-gray-600 hover:text-gray-900"
              >
                Kembali ke Beranda
              </Button>
            </a>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl mb-2">🔒</div>
            <p className="text-xs text-gray-600">Aman</p>
          </div>
          <div>
            <div className="text-2xl mb-2">⚡</div>
            <p className="text-xs text-gray-600">Cepat</p>
          </div>
          <div>
            <div className="text-2xl mb-2">✨</div>
            <p className="text-xs text-gray-600">Mudah</p>
          </div>
        </div>
      </div>
    </div>
  );
}


