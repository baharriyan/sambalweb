import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import AdminLayout from "./AdminLayout";
import { Loader2, Save, Image as ImageIcon, Layout as LayoutIcon, Settings as SettingsIcon, Truck, CreditCard } from "lucide-react";

export default function AdminSettings() {
  const utils = trpc.useUtils();
  const { data: heroContent, isLoading: isHeroLoading } = trpc.settings.get.useQuery({ key: "hero_content" });
  const { data: systemSettings, isLoading: isSystemLoading } = trpc.settings.get.useQuery({ key: "system_settings" });
  
  const updateSettings = trpc.settings.update.useMutation();
  const uploadMutation = trpc.media.upload.useMutation();

  const [heroFormData, setHeroFormData] = useState({
    badge: "",
    title: "",
    description: "",
    imageUrl: "",
  });

  const [systemFormData, setSystemFormData] = useState({
    midtransSimulation: true,
    packingFee: 3000,
    freeShippingThreshold: 500000,
  });

  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (heroContent) {
      setHeroFormData({
        badge: heroContent.badge || "",
        title: heroContent.title || "",
        description: heroContent.description || "",
        imageUrl: heroContent.imageUrl || "",
      });
    }
    if (systemSettings) {
      setSystemFormData({
        midtransSimulation: systemSettings.midtransSimulation ?? true,
        packingFee: systemSettings.packingFee ?? 3000,
        freeShippingThreshold: systemSettings.freeShippingThreshold ?? 500000,
      });
    }
  }, [heroContent, systemSettings]);

  const handleHeroSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings.mutateAsync({
        key: "hero_content",
        value: heroFormData,
      });
      toast.success("Pengaturan tampilan hero berhasil disimpan!");
      utils.settings.get.invalidate({ key: "hero_content" });
    } catch (error) {
      toast.error("Gagal menyimpan pengaturan");
    }
  };

  const handleSystemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings.mutateAsync({
        key: "system_settings",
        value: systemFormData,
      });
      toast.success("Pengaturan sistem berhasil disimpan!");
      utils.settings.get.invalidate({ key: "system_settings" });
    } catch (error) {
      toast.error("Gagal menyimpan pengaturan sistem");
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
      });
      reader.readAsDataURL(file);
      const base64Data = await base64Promise;

      const result = await uploadMutation.mutateAsync({
        filename: `hero_${Date.now()}_${file.name}`,
        contentType: file.type,
        base64Data,
      });

      setHeroFormData(prev => ({ ...prev, imageUrl: result.url }));
      toast.success("Gambar hero berhasil diunggah");
    } catch (error: any) {
      toast.error(error?.message || "Gagal mengunggah gambar");
    } finally {
      setIsUploading(false);
    }
  };

  if (isHeroLoading || isSystemLoading) {
    return (
      <AdminLayout title="Settings">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Pengaturan Website">
      <div className="max-w-5xl mx-auto">
        <Tabs defaultValue="hero" className="space-y-6">
          <TabsList className="bg-white border border-slate-200 p-1 rounded-2xl h-14 w-full sm:w-auto grid grid-cols-2">
            <TabsTrigger value="hero" className="rounded-xl data-[state=active]:bg-slate-900 data-[state=active]:text-white font-bold gap-2">
              <LayoutIcon className="w-4 h-4" /> Tampilan Hero
            </TabsTrigger>
            <TabsTrigger value="system" className="rounded-xl data-[state=active]:bg-slate-900 data-[state=active]:text-white font-bold gap-2">
              <SettingsIcon className="w-4 h-4" /> Sistem & Fitur
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hero">
            <Card className="border-none shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="text-lg font-bold text-slate-800">Konten Halaman Utama</CardTitle>
                <CardDescription>Kelola tulisan dan gambar yang muncul di bagian paling atas website.</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleHeroSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="badge" className="text-xs font-bold text-slate-500 uppercase">Teks Label (Badge Atas)</Label>
                    <Input
                      id="badge"
                      placeholder="SAMBAL ARTISANAL TERBAIK 2024"
                      value={heroFormData.badge}
                      onChange={(e) => setHeroFormData({ ...heroFormData, badge: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-xs font-bold text-slate-500 uppercase">Judul Utama</Label>
                    <Textarea
                      id="title"
                      placeholder="RASAKAN <br /> KEPEDASAN <br /> HAKIKI."
                      value={heroFormData.title}
                      onChange={(e) => setHeroFormData({ ...heroFormData, title: e.target.value })}
                      className="min-h-[100px] font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-xs font-bold text-slate-500 uppercase">Deskripsi</Label>
                    <Textarea
                      id="description"
                      placeholder="Kombinasi sempurna antara cabai segar pilihan..."
                      value={heroFormData.description}
                      onChange={(e) => setHeroFormData({ ...heroFormData, description: e.target.value })}
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase">Gambar Hero</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start mt-2">
                      <div className="aspect-square rounded-2xl bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group">
                        {heroFormData.imageUrl ? (
                          <img src={heroFormData.imageUrl} alt="Hero Preview" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-12 h-12 text-slate-300" />
                        )}
                        {isUploading && (
                          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-red-600" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-4">
                        <input
                          type="file"
                          id="hero-image-upload"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById("hero-image-upload")?.click()}
                          className="w-full rounded-xl"
                          disabled={isUploading}
                        >
                          Ganti Gambar
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Button type="submit" disabled={updateSettings.isPending} className="w-full bg-slate-900 py-6 rounded-xl font-bold">
                    {updateSettings.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Simpan Perubahan Hero
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system">
            <Card className="border-none shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="text-lg font-bold text-slate-800">Pengaturan Sistem</CardTitle>
                <CardDescription>Konfigurasi fitur pembayaran dan pengiriman.</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleSystemSubmit} className="space-y-8">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-bold flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-red-600" /> 
                        Midtrans Simulation Mode
                      </Label>
                      <p className="text-xs text-slate-500">Gunakan simulasi pembayaran untuk pengujian di localhost.</p>
                    </div>
                    <Switch
                      checked={systemFormData.midtransSimulation}
                      onCheckedChange={(checked) => setSystemFormData({ ...systemFormData, midtransSimulation: checked })}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="packingFee" className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                        <Truck className="w-4 h-4" /> Biaya Packing (Rp)
                      </Label>
                      <Input
                        id="packingFee"
                        type="number"
                        value={systemFormData.packingFee}
                        onChange={(e) => setSystemFormData({ ...systemFormData, packingFee: parseInt(e.target.value) || 0 })}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="freeShipping" className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                        Minimal Belanja Gratis Ongkir (Rp)
                      </Label>
                      <Input
                        id="freeShipping"
                        type="number"
                        value={systemFormData.freeShippingThreshold}
                        onChange={(e) => setSystemFormData({ ...systemFormData, freeShippingThreshold: parseInt(e.target.value) || 0 })}
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={updateSettings.isPending} className="w-full bg-slate-900 py-6 rounded-xl font-bold">
                    {updateSettings.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Simpan Pengaturan Sistem
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
