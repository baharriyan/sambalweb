import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ProductGrid from "@/components/ProductGrid";
import HowToOrder from "@/components/HowToOrder";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f6]">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <ProductGrid />
        <HowToOrder />
        <Testimonials />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
