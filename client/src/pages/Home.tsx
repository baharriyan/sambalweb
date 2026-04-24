import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ProductGrid from "@/components/ProductGrid";
import HowToOrder from "@/components/HowToOrder";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import LazySection from "@/components/LazySection";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f6]">
      <Navbar />
      <main className="flex-1">
        {/* Above the fold - render immediately */}
        <HeroSection />

        {/* Near fold - render with small margin */}
        <LazySection minHeight="600px" rootMargin="400px 0px">
          <ProductGrid />
        </LazySection>

        {/* Below fold - defer until user scrolls near */}
        <div id="how-to-order">
          <LazySection minHeight="400px">
            <HowToOrder />
          </LazySection>
        </div>

        <LazySection minHeight="400px">
          <Testimonials />
        </LazySection>

        <div id="faq">
          <LazySection minHeight="300px">
            <FAQ />
          </LazySection>
        </div>
      </main>
      <LazySection minHeight="200px">
        <Footer />
      </LazySection>
    </div>
  );
}
