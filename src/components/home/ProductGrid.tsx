import type { Product } from "@/types";
import { ProductCard } from "@/components/product/ProductCard";

interface ProductGridProps {
  title: string;
  products: Product[];
}

/**
 * Titled section wrapping a responsive grid of <ProductCard/>s. Used for
 * "Best Sellers", "New In", etc. on the home page.
 */
export function ProductGrid({ title, products }: ProductGridProps) {
  return (
    <section className="px-4 md:px-8 py-10">
      <h2 className="text-sm font-semibold uppercase tracking-widest mb-4 text-neutral-900 dark:text-neutral-100">
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
