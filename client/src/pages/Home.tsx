import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ProductGrid from "@/components/ProductGrid";
import HowToOrder from "@/components/HowToOrder";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f6]">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <ProductGrid />
        <HowToOrder />
        <Testimonials />
        <FAQ />
        
        {/* CTA Bottom Section */}
        <section className="py-32 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-slate-900 -z-10" />
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(220,38,38,0.15),transparent)] -z-10" />
          
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter leading-tight">
                SIAP MERASAKAN <br />
                <span className="text-red-500">KELEZATANNYA?</span>
              </h2>
              <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                Bergabunglah dengan ribuan pecinta pedas lainnya. Stok terbatas setiap harinya karena kami menjaga kesegaran bahan.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link href="/catalog">
                  <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white font-black px-12 h-16 rounded-2xl text-lg shadow-2xl shadow-red-900/20 transition-all hover:scale-105">
                    PESAN SEKARANG
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
