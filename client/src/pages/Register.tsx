import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, LogIn, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Register() {
  const [, navigate] = useLocation();
  const { user, loading, refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const registerMutation = trpc.auth.register.useMutation();

  useEffect(() => {
    if (user && !loading) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (password !== confirmPassword) {
      setError("Password dan konfirmasi password tidak cocok");
      return;
    }

    if (password.length < 6) {
      setError("Password minimal 6 karakter");
      return;
    }

    setIsSubmitting(true);

    try {
      await registerMutation.mutateAsync({
        email,
        password,
        name: name || undefined,
        phone: phone || undefined,
      });
      setSuccess(true);
      await refresh();
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Pendaftaran gagal. Silakan coba lagi.");
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
          <p className="text-gray-600 mt-2">Buat Akun Baru</p>
        </div>

        {/* Register Card */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
            <CardTitle className="text-center">Daftar</CardTitle>
          </CardHeader>
          <CardContent className="pt-8 space-y-6">
            {/* Email Registration Form */}
            <form onSubmit={handleEmailRegister} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap (opsional)</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Masukkan nama anda"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Nomor Telepon (opsional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+62812345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Ketik ulang password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                    Daftar
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

            {/* Benefits */}
            <div className="space-y-3 bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="font-semibold text-green-900 text-sm">Keuntungan Menjadi Member:</p>
              <ul className="text-sm text-green-800 space-y-1">
                <li>✓ Akses eksklusif ke produk terbaru</li>
                <li>✓ Diskon khusus member</li>
                <li>✓ Tracking pesanan real-time</li>
                <li>✓ Riwayat pembelian tersimpan</li>
              </ul>
            </div>

            {/* Login Link */}
            <a href="/login">
              <Button variant="outline" size="lg" className="w-full border-2 border-red-600 text-red-600 hover:bg-red-50 font-semibold h-12">
                Sudah Punya Akun? Masuk
              </Button>
            </a>

            {/* Back to Home */}
            <a href="/">
              <Button variant="ghost" size="sm" className="w-full text-gray-600 hover:text-gray-900">
                Kembali ke Beranda
              </Button>
            </a>
          </CardContent>
        </Card>

        {/* Terms */}
        <p className="text-center text-xs text-gray-500 mt-6">
          Dengan mendaftar, Anda setuju dengan{" "}
          <a href="#" className="text-red-600 hover:underline">
            Syarat & Ketentuan
          </a>{" "}
          kami
        </p>
      </div>
    </div>
  );
}
