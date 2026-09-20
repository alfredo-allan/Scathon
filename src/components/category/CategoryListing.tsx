"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Category, Product } from "@/types";
import { ProductCard } from "@/components/product/ProductCard";
import {
  CategoryFilters,
  type ColorOption,
  type PriceBucket,
  type RatingOption,
} from "./CategoryFilters";
import { SortMenu, type SortOption } from "./SortMenu";

interface CategoryListingProps {
  category: Category;
  products: Product[];
}

const PRICE_BUCKETS: PriceBucket[] = [
  { id: "ate-150", label: "Até R$ 150", test: (price) => price <= 150 },
  { id: "150-300", label: "R$ 150 – R$ 300", test: (price) => price > 150 && price <= 300 },
  { id: "300-500", label: "R$ 300 – R$ 500", test: (price) => price > 300 && price <= 500 },
  { id: "acima-500", label: "Acima de R$ 500", test: (price) => price > 500 },
];

const RATING_OPTIONS: RatingOption[] = [
  { id: "4.5", label: "4,5 ★ ou mais", min: 4.5 },
  { id: "4", label: "4,0 ★ ou mais", min: 4 },
];

const SORT_OPTIONS: SortOption[] = [
  { id: "relevancia", label: "Relevância" },
  { id: "mais-vendidos", label: "Mais Vendidos" },
  { id: "melhor-avaliados", label: "Melhor Avaliados" },
  { id: "menor-preco", label: "Menor Preço" },
  { id: "maior-preco", label: "Maior Preço" },
  { id: "novidades", label: "Novidades Primeiro" },
];

/**
 * `/shop/[category]` page body: breadcrumb, title/count + share/filter/sort
 * controls, a desktop filter sidebar (mirrored in a mobile slide-over), and
 * the product grid - loosely modeled on the reference screenshot (Nike PLP)
 * but restyled in Scathon's own minimalist identity and scoped to filters
 * that make sense for a single-brand catalog (see `<CategoryFilters/>`).
 * All filtering/sorting happens client-side over the category's product
 * list, which the server-rendered page above already narrowed down - there's
 * no pagination or backend here, so this is plenty fast for the catalog size.
 */
export function CategoryListing({ category, products }: CategoryListingProps) {
  const [sortBy, setSortBy] = useState(SORT_OPTIONS[0].id);
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set());
  const [selectedPriceBuckets, setSelectedPriceBuckets] = useState<Set<string>>(new Set());
  const [minRating, setMinRating] = useState<number | null>(null);
  const [onlyNew, setOnlyNew] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [shareFeedback, setShareFeedback] = useState(false);

  useEffect(() => {
    if (!mobileFiltersOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [mobileFiltersOpen]);

  const availableColors = useMemo<ColorOption[]>(() => {
    const seen = new Map<string, string>();
    for (const product of products) {
      for (const color of product.colors) {
        if (!seen.has(color.name)) seen.set(color.name, color.hex);
      }
    }
    return Array.from(seen, ([name, hex]) => ({ name, hex }));
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (onlyNew && !product.isNew) return false;
      if (minRating !== null && product.rating < minRating) return false;
      if (
        selectedColors.size > 0 &&
        !product.colors.some((color) => selectedColors.has(color.name))
      ) {
        return false;
      }
      if (
        selectedPriceBuckets.size > 0 &&
        !PRICE_BUCKETS.some(
          (bucket) => selectedPriceBuckets.has(bucket.id) && bucket.test(product.price),
        )
      ) {
        return false;
      }
      return true;
    });
  }, [products, onlyNew, minRating, selectedColors, selectedPriceBuckets]);

  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    switch (sortBy) {
      case "mais-vendidos":
        return list.sort((a, b) => b.reviewCount - a.reviewCount);
      case "melhor-avaliados":
        return list.sort((a, b) => b.rating - a.rating);
      case "menor-preco":
        return list.sort((a, b) => a.price - b.price);
      case "maior-preco":
        return list.sort((a, b) => b.price - a.price);
      case "novidades":
        return list.sort((a, b) => Number(b.isNew ?? false) - Number(a.isNew ?? false));
      default:
        return list;
    }
  }, [filteredProducts, sortBy]);

  const hasActiveFilters =
    selectedColors.size > 0 || selectedPriceBuckets.size > 0 || minRating !== null || onlyNew;

  function clearFilters() {
    setSelectedColors(new Set());
    setSelectedPriceBuckets(new Set());
    setMinRating(null);
    setOnlyNew(false);
  }

  function toggleColor(name: string) {
    setSelectedColors((current) => {
      const next = new Set(current);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function togglePriceBucket(id: string) {
    setSelectedPriceBuckets((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: category.label, url });
      } catch {
        // Native share sheet dismissed - nothing to do.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareFeedback(true);
      setTimeout(() => setShareFeedback(false), 2000);
    } catch {
      // Clipboard blocked/unavailable - no good fallback UI for this yet.
    }
  }

  const filtersProps = {
    availableColors,
    selectedColors,
    onToggleColor: toggleColor,
    priceBuckets: PRICE_BUCKETS,
    selectedPriceBuckets,
    onTogglePriceBucket: togglePriceBucket,
    ratingOptions: RATING_OPTIONS,
    minRating,
    onSetMinRating: setMinRating,
    onlyNew,
    onToggleOnlyNew: () => setOnlyNew((current) => !current),
    hasActiveFilters,
    onClear: clearFilters,
  };

  return (
    <div className="px-4 md:px-8 py-6">
      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-neutral-900 dark:hover:text-neutral-100">
              Página Inicial
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-neutral-900 dark:text-neutral-100">{category.label}</li>
        </ol>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <h1 className="text-xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50 md:text-2xl">
          {category.label}{" "}
          <span className="text-base font-normal text-neutral-500 dark:text-neutral-400">
            ({sortedProducts.length})
          </span>
        </h1>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleShare}
            className="hidden items-center gap-2 text-xs font-medium uppercase tracking-widest text-neutral-600 transition-colors hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-neutral-100 sm:flex"
          >
            {shareFeedback ? "Link copiado!" : "Compartilhar"}
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
              <path
                d="M12 3v12M8 7l4-4 4 4M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="flex items-center gap-2 border border-neutral-300 dark:border-neutral-700 px-4 py-2 text-xs font-medium uppercase tracking-widest text-neutral-800 dark:text-neutral-100 lg:hidden"
          >
            Filtros
            {hasActiveFilters && (
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-neutral-100" aria-hidden />
            )}
          </button>

          <SortMenu options={SORT_OPTIONS} value={sortBy} onChange={setSortBy} />
        </div>
      </div>

      <div className="grid gap-8 py-6 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <CategoryFilters {...filtersProps} />
        </aside>

        <div>
          {sortedProducts.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-24 text-center">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Nenhum produto encontrado com esses filtros.
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-semibold uppercase tracking-widest text-neutral-900 underline underline-offset-4 dark:text-neutral-100"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {sortedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile/tablet filters drawer - same fixed-overlay convention as
          <DrawerMenu/> (backdrop + slide-in panel + body-scroll lock), just
          anchored to the right edge instead of the left: this panel refines
          the current listing rather than acting as the site's primary
          navigation, so it reads as a "detail" surface rather than a
          global one. */}
      <div
        aria-hidden={!mobileFiltersOpen}
        onClick={() => setMobileFiltersOpen(false)}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden ${
          mobileFiltersOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Filtros"
        className={`fixed right-0 top-0 z-50 flex h-full w-4/5 max-w-sm flex-col bg-white dark:bg-neutral-900 transition-transform duration-300 ease-out lg:hidden ${
          mobileFiltersOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 px-4 py-4">
          <span className="text-sm font-semibold uppercase tracking-widest">Filtros</span>
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(false)}
            aria-label="Fechar filtros"
            className="p-1 text-neutral-600 dark:text-neutral-400"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <CategoryFilters {...filtersProps} />
        </div>
        <div className="border-t border-neutral-200 dark:border-neutral-800 p-4">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(false)}
            className="w-full bg-neutral-950 py-3 text-xs font-semibold uppercase tracking-widest text-neutral-50 dark:bg-neutral-100 dark:text-neutral-950"
          >
            Ver {sortedProducts.length} {sortedProducts.length === 1 ? "resultado" : "resultados"}
          </button>
        </div>
      </aside>
    </div>
  );
}
