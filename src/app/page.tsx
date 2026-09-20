import { HeroCarousel } from "@/components/home/HeroCarousel";
import { TrustBadges } from "@/components/home/TrustBadges";
import { CategoryDividerCarousel } from "@/components/home/CategoryDividerCarousel";
import { ProductGrid } from "@/components/home/ProductGrid";
import { TestimonialsCarousel } from "@/components/home/TestimonialsCarousel";
import { heroSlides } from "@/data/hero-slides";
import { dividerSlides } from "@/data/dividers";
import { getBestSellers, getNewArrivals, products } from "@/data/products";

export default function Home() {
  const bestSellers = getBestSellers();
  const newArrivals = getNewArrivals();

  return (
    <>
      <HeroCarousel slides={heroSlides} />
      <TrustBadges />

      <ProductGrid title="Mais Vendidos" products={bestSellers} />

      <CategoryDividerCarousel slides={dividerSlides} />

      <ProductGrid title="Novidades" products={newArrivals} />

      <CategoryDividerCarousel slides={[...dividerSlides].reverse()} />

      <ProductGrid title="Todos os Produtos" products={products} />

      {/* Right above <Footer/>, which layout.tsx renders after {children}. */}
      <TestimonialsCarousel />
    </>
  );
}
