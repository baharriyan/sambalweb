import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import AdminLayout from "./AdminLayout";
import {
  Loader2,
  Image as ImageIcon,
  Layout as LayoutIcon,
  Settings as SettingsIcon,
  Truck,
  CreditCard,
  HelpCircle,
  Star,
  Phone,
} from "lucide-react";

interface HeroContent {
  badge?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
}

interface SystemSettings {
  midtransSimulation?: boolean;
  packingFee?: number;
  freeShippingThreshold?: number;
}

/**
 * Admin Settings Page
 * Separated into a loader and a content component to avoid cascading renders
 * and satisfy strict React Hook rules.
 */
export default function AdminSettings() {
  const { data: heroContent, isLoading: isHeroLoading } =
    trpc.settings.get.useQuery({ key: "hero_content" });
  const { data: systemSettings, isLoading: isSystemLoading } =
    trpc.settings.get.useQuery({ key: "system_settings" });
  const { data: howToOrder, isLoading: isHowToOrderLoading } =
    trpc.settings.get.useQuery({ key: "how_to_order" });
  const { data: faqContent, isLoading: isFaqLoading } =
    trpc.settings.get.useQuery({ key: "faq_content" });
  const { data: contactInfo, isLoading: isContactLoading } =
    trpc.settings.get.useQuery({ key: "contact_info" });
  const { data: testimonials, isLoading: isTestimonialsLoading } =
    trpc.settings.get.useQuery({ key: "testimonials_content" });

  if (isHeroLoading || isSystemLoading || isHowToOrderLoading || isFaqLoading || isContactLoading || isTestimonialsLoading) {
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
      <SettingsContent 
        heroContent={heroContent as HeroContent} 
        systemSettings={systemSettings as SystemSettings}
        howToOrder={howToOrder as any[]}
        faqContent={faqContent as any[]}
        contactInfo={contactInfo as any}
        testimonials={testimonials as any[]}
      />
    </AdminLayout>
  );
}

function SettingsContent({ 
  heroContent, 
  systemSettings,
  howToOrder,
  faqContent,
  contactInfo,
  testimonials
}: { 
  heroContent?: HeroContent; 
  systemSettings?: SystemSettings;
  howToOrder?: any[];
  faqContent?: any[];
  contactInfo?: any;
  testimonials?: any[];
}) {
  const utils = trpc.useUtils();
  const updateSettings = trpc.settings.update.useMutation();
  const uploadMutation = trpc.media.upload.useMutation();

  const [heroFormData, setHeroFormData] = useState({
    badge: heroContent?.badge || "",
    title: heroContent?.title || "",
    description: heroContent?.description || "",
    imageUrl: heroContent?.imageUrl || "",
  });

  const [systemFormData, setSystemFormData] = useState({
    midtransSimulation: systemSettings?.midtransSimulation ?? true,
    packingFee: systemSettings?.packingFee ?? 3000,
    freeShippingThreshold: systemSettings?.freeShippingThreshold ?? 500000,
  });

  const [contactFormData, setContactFormData] = useState({
    whatsapp: contactInfo?.whatsapp || "",
    email: contactInfo?.email || "",
    address: contactInfo?.address || "",
    instagram: contactInfo?.instagram || "",
    facebook: contactInfo?.facebook || "",
    tiktok: contactInfo?.tiktok || "",
  });

  const [isUploading, setIsUploading] = useState(false);

  const handleHeroSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings.mutateAsync({
        key: "hero_content",
        value: heroFormData,
      });
      toast.success("Pengaturan tampilan hero berhasil disimpan!");
      utils.settings.get.invalidate({ key: "hero_content" });
    } catch {
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
    } catch {
      toast.error("Gagal menyimpan pengaturan sistem");
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings.mutateAsync({
        key: "contact_info",
        value: contactFormData,
      });
      toast.success("Informasi kontak berhasil disimpan!");
      utils.settings.get.invalidate({ key: "contact_info" });
    } catch {
      toast.error("Gagal menyimpan informasi kontak");
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>(resolve => {
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Gagal mengunggah gambar";
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <Tabs defaultValue="hero" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1 rounded-2xl h-auto w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <TabsTrigger
            value="hero"
            className="rounded-xl data-[state=active]:bg-slate-900 data-[state=active]:text-white font-bold gap-2 py-3"
          >
            <LayoutIcon className="w-4 h-4" /> Hero
          </TabsTrigger>
          <TabsTrigger
            value="faq"
            className="rounded-xl data-[state=active]:bg-slate-900 data-[state=active]:text-white font-bold gap-2 py-3"
          >
            <HelpCircle className="w-4 h-4" /> FAQ
          </TabsTrigger>
          <TabsTrigger
            value="testimonials"
            className="rounded-xl data-[state=active]:bg-slate-900 data-[state=active]:text-white font-bold gap-2 py-3"
          >
            <Star className="w-4 h-4" /> Testimoni
          </TabsTrigger>
          <TabsTrigger
            value="contact"
            className="rounded-xl data-[state=active]:bg-slate-900 data-[state=active]:text-white font-bold gap-2 py-3"
          >
            <Phone className="w-4 h-4" /> Kontak
          </TabsTrigger>
          <TabsTrigger
            value="system"
            className="rounded-xl data-[state=active]:bg-slate-900 data-[state=active]:text-white font-bold gap-2 py-3"
          >
            <SettingsIcon className="w-4 h-4" /> Sistem
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hero">
          {/* ... (Hero card content) ... */}
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-lg font-bold text-slate-800">
                Konten Halaman Utama
              </CardTitle>
              <CardDescription>
                Kelola tulisan dan gambar yang muncul di bagian paling atas website.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleHeroSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="badge" className="text-xs font-bold text-slate-500 uppercase">
                    Teks Label (Badge Atas)
                  </Label>
                  <Input
                    id="badge"
                    value={heroFormData.badge}
                    onChange={e => setHeroFormData({ ...heroFormData, badge: e.target.value })}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title" className="text-xs font-bold text-slate-500 uppercase">
                    Judul Utama (HTML Supported)
                  </Label>
                  <Textarea
                    id="title"
                    value={heroFormData.title}
                    onChange={e => setHeroFormData({ ...heroFormData, title: e.target.value })}
                    className="min-h-[100px] font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-xs font-bold text-slate-500 uppercase">
                    Deskripsi
                  </Label>
                  <Textarea
                    id="description"
                    value={heroFormData.description}
                    onChange={e => setHeroFormData({ ...heroFormData, description: e.target.value })}
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase">Gambar Hero</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start mt-2">
                    <div className="aspect-video rounded-2xl bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group">
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
                        onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
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

        <TabsContent value="faq">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-lg font-bold text-slate-800">Manajemen FAQ</CardTitle>
              <CardDescription>Edit daftar pertanyaan dan jawaban yang sering diajukan.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                {(faqContent || []).map((faq: any, index: number) => (
                  <div key={index} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 relative">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                      onClick={() => {
                        const newFaq = [...faqContent!];
                        newFaq.splice(index, 1);
                        updateSettings.mutate({ key: "faq_content", value: newFaq });
                      }}
                    >
                      Hapus
                    </Button>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500">Pertanyaan</Label>
                      <Input 
                        value={faq.question} 
                        onChange={(e) => {
                          const newFaq = [...faqContent!];
                          newFaq[index].question = e.target.value;
                          updateSettings.mutate({ key: "faq_content", value: newFaq });
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500">Jawaban</Label>
                      <Textarea 
                        value={faq.answer} 
                        onChange={(e) => {
                          const newFaq = [...faqContent!];
                          newFaq[index].answer = e.target.value;
                          updateSettings.mutate({ key: "faq_content", value: newFaq });
                        }}
                      />
                    </div>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  className="w-full rounded-xl border-dashed py-8"
                  onClick={() => {
                    const newFaq = [...(faqContent || []), { id: Date.now(), question: "", answer: "" }];
                    updateSettings.mutate({ key: "faq_content", value: newFaq });
                  }}
                >
                  + Tambah Pertanyaan Baru
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testimonials">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-lg font-bold text-slate-800">Manajemen Testimoni</CardTitle>
              <CardDescription>Kelola ulasan dari pelanggan yang muncul di website.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                {(testimonials || []).map((t: any, index: number) => (
                  <div key={index} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 relative">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                      onClick={() => {
                        const newT = [...testimonials!];
                        newT.splice(index, 1);
                        updateSettings.mutate({ key: "testimonials_content", value: newT });
                      }}
                    >
                      Hapus
                    </Button>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500">Nama Pelanggan</Label>
                        <Input value={t.name} onChange={(e) => {
                          const newT = [...testimonials!];
                          newT[index].name = e.target.value;
                          updateSettings.mutate({ key: "testimonials_content", value: newT });
                        }} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500">Role/Jabatan</Label>
                        <Input value={t.role} onChange={(e) => {
                          const newT = [...testimonials!];
                          newT[index].role = e.target.value;
                          updateSettings.mutate({ key: "testimonials_content", value: newT });
                        }} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500">Komentar</Label>
                      <Textarea value={t.comment} onChange={(e) => {
                        const newT = [...testimonials!];
                        newT[index].comment = e.target.value;
                        updateSettings.mutate({ key: "testimonials_content", value: newT });
                      }} />
                    </div>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  className="w-full rounded-xl border-dashed py-8"
                  onClick={() => {
                    const newT = [...(testimonials || []), { id: Date.now(), name: "", role: "", comment: "", rating: 5, avatar: "👤" }];
                    updateSettings.mutate({ key: "testimonials_content", value: newT });
                  }}
                >
                  + Tambah Testimoni Baru
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-lg font-bold text-slate-800">Informasi Kontak & Sosial Media</CardTitle>
              <CardDescription>Update informasi kontak yang muncul di footer dan halaman FAQ.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleContactSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp" className="text-xs font-bold text-slate-500 uppercase">WhatsApp (Contoh: 6281234567890)</Label>
                    <Input id="whatsapp" value={contactFormData.whatsapp} onChange={e => setContactFormData({...contactFormData, whatsapp: e.target.value})} className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-bold text-slate-500 uppercase">Email Bisnis</Label>
                    <Input id="email" type="email" value={contactFormData.email} onChange={e => setContactFormData({...contactFormData, email: e.target.value})} className="rounded-xl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-xs font-bold text-slate-500 uppercase">Alamat Kantor/Toko</Label>
                  <Textarea id="address" value={contactFormData.address} onChange={e => setContactFormData({...contactFormData, address: e.target.value})} className="rounded-xl min-h-[80px]" />
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="instagram" className="text-xs font-bold text-slate-500 uppercase">Instagram Username</Label>
                    <Input id="instagram" value={contactFormData.instagram} onChange={e => setContactFormData({...contactFormData, instagram: e.target.value})} className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="facebook" className="text-xs font-bold text-slate-500 uppercase">Facebook Page ID</Label>
                    <Input id="facebook" value={contactFormData.facebook} onChange={e => setContactFormData({...contactFormData, facebook: e.target.value})} className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tiktok" className="text-xs font-bold text-slate-500 uppercase">TikTok Username</Label>
                    <Input id="tiktok" value={contactFormData.tiktok} onChange={e => setContactFormData({...contactFormData, tiktok: e.target.value})} className="rounded-xl" />
                  </div>
                </div>
                <Button type="submit" disabled={updateSettings.isPending} className="w-full bg-slate-900 py-6 rounded-xl font-bold">
                  Simpan Kontak
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
                      <CreditCard className="w-4 h-4 text-red-600" /> Midtrans Simulation Mode
                    </Label>
                    <p className="text-xs text-slate-500">Gunakan simulasi pembayaran untuk pengujian di localhost.</p>
                  </div>
                  <Switch
                    checked={systemFormData.midtransSimulation}
                    onCheckedChange={checked => setSystemFormData({ ...systemFormData, midtransSimulation: checked })}
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
                      onChange={e => setSystemFormData({ ...systemFormData, packingFee: parseInt(e.target.value) || 0 })}
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
                      onChange={e => setSystemFormData({ ...systemFormData, freeShippingThreshold: parseInt(e.target.value) || 0 })}
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={updateSettings.isPending} className="w-full bg-slate-900 py-6 rounded-xl font-bold">
                  Simpan Pengaturan Sistem
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
