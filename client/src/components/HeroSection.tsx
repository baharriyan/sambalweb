import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ChevronRight, Star, ShieldCheck, Flame, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function HeroSection() {
  const { data: heroContent, isLoading } = trpc.settings.get.useQuery({ key: "hero_content" });

  const content = {
    badge: heroContent?.badge || "Sambal Artisanal Terbaik 2024",
    title: heroContent?.title || "RASAKAN <br /><span class=\"text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600\">KEPEDASAN <br /></span>HAKIKI.",
    description: heroContent?.description || "Kombinasi sempurna antara cabai segar pilihan dan rempah rahasia. Homemade, tanpa pengawet, dan 100% Halal.",
    imageUrl: heroContent?.imageUrl || "/attached_assets/hero.png"
  };

  if (isLoading) {
    return (
      <div className="min-h-[90vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <section className="relative min-h-[90vh] flex items-center pt-20 pb-16 px-4 bg-[#faf9f6] overflow-hidden">
      {/* Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] -z-10" />

      {/* Background Decorative Gradients */}
      <div className="absolute top-0 right-0 w-[50%] h-full bg-gradient-to-l from-orange-100/30 to-transparent -z-10" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-red-100 rounded-full blur-3xl opacity-40 animate-pulse" />

      <div className="max-w-7xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Left Content */}
          <div className="space-y-8 relative z-10 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full mb-6 border border-red-100">
                <Flame className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">{content.badge}</span>
              </div>

              <h1
                className="text-6xl md:text-7xl lg:text-8xl font-black text-slate-900 leading-[0.9] tracking-tighter mb-6"
                dangerouslySetInnerHTML={{ __html: content.title }}
              />

              <p className="text-lg md:text-xl text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                {content.description}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4"
            >
              <Link href="/catalog">
                <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-10 h-14 text-lg font-bold transition-all hover:scale-105 shadow-xl shadow-slate-200">
                  Lihat Menu <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <a href="#how-to-order">
                <Button variant="ghost" size="lg" className="text-slate-600 font-bold hover:text-red-600 transition-colors">
                  Cara Pesan
                </Button>
              </a>
            </motion.div>
          </div>

          {/* Right Image Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative"
          >
            <div className="relative z-10 rounded-[2.5rem] overflow-hidden shadow-2xl border-[12px] border-white transform rotate-3 hover:rotate-0 transition-transform duration-700">
              <img
                src={content.imageUrl}
                alt="Sambal Premium"
                className="w-full aspect-square object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>

            {/* Floating Badges */}
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-6 -left-6 z-20 bg-white p-4 rounded-2xl shadow-xl border border-slate-50 flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Kualitas</p>
                <p className="text-sm font-black text-slate-800 leading-none">Terjamin</p>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 15, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute -bottom-10 -right-6 z-20 bg-white p-5 rounded-2xl shadow-xl border border-slate-50"
            >
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Pengiriman</p>
              <p className="text-sm font-black text-slate-800">Cepat Seluruh Indonesia</p>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
