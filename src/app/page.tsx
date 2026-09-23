import { HeroCarousel } from "@/components/home/HeroCarousel";
import { TrustBadges } from "@/components/home/TrustBadges";
import { BrandMarquee } from "@/components/home/BrandMarquee";
import { CategoryDividerCarousel } from "@/components/home/CategoryDividerCarousel";
import { ProductGrid } from "@/components/home/ProductGrid";
import { TestimonialsCarousel } from "@/components/home/TestimonialsCarousel";
import { heroSlides } from "@/data/hero-slides";
import { dividerSlides } from "@/data/dividers";
import { getBestSellers, products } from "@/data/products";

// One product grid per catalog "slice", no more. With only a dozen
// products, an earlier version of this page also showed a "Novidades" grid
// and a second (reversed) copy of <CategoryDividerCarousel/> between two
// near-identical product listings - a small catalog made every one of those
// sections repeat most of the products the others already showed, and the
// duplicated carousel visibly looked like the same banner twice. Keeping
// "Mais Vendidos" as the one deliberately curated highlight (see
// `isBestSeller` on `Product`) and "Todos os Produtos" as the single
// complete listing - right after the one divider banner, not buried at the
// very bottom - covers the same ground without the repetition. Reintroduce
// a dedicated "Novidades" grid (`getNewArrivals()` is still exported from
// `@/data/products` for this) once the catalog is large enough that "new"
// and "everything" stop being almost the same list.
export default function Home() {
  const bestSellers = getBestSellers();

  return (
    <>
      <HeroCarousel slides={heroSlides} />
      <TrustBadges />

      {/* Placed right after <TrustBadges/> - Alfredo pointed at that
          section when asking for this, and it reads as a natural ramp-up
          in energy: quiet reassurance text, then a bold brand statement,
          before the product grids start. Easy to move elsewhere (e.g.
          right under the hero, or just above <Footer/>) if a different
          spot reads better once it's live. */}
      <BrandMarquee />

      <ProductGrid title="Mais Vendidos" products={bestSellers} />

      <CategoryDividerCarousel slides={dividerSlides} />

      <ProductGrid title="Todos os Produtos" products={products} />

      {/* Right above <Footer/>, which layout.tsx renders after {children}. */}
      <TestimonialsCarousel />
    </>
  );
}
