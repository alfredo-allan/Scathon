import type { Category } from "@/types";

export const categories: Category[] = [
  { id: "shop-all", label: "Todos os Produtos", href: "/shop" },
  { id: "new-in", label: "Novidades", href: "/shop?filter=new" },
  { id: "best-sellers", label: "Mais Vendidos", href: "/shop?filter=best-sellers" },
  { id: "ss26", label: "SS26", href: "/collections/ss26" },
];

// The id doubles as the URL slug (see `/shop/[category]`), and is derived
// from the Portuguese label on purpose - Alfredo wants the category page's
// URL to read in Portuguese too (e.g. /shop/moletons), not carry over the
// old English internal names (hoodies, tees, ...) that only ever showed up
// in code, never on screen.
export const popularCategories: Category[] = [
  { id: "moletons", label: "Moletons", href: "/shop/moletons" },
  { id: "camisetas", label: "Camisetas", href: "/shop/camisetas" },
  { id: "casacos", label: "Casacos", href: "/shop/casacos" },
  { id: "calcas", label: "Calças", href: "/shop/calcas" },
  { id: "acessorios", label: "Acessórios", href: "/shop/acessorios" },
];

/**
 * Looks up a `popularCategories` entry by its slug (the `id`/URL segment).
 * Used by the `/shop/[category]` page to resolve the dynamic route param
 * into the category's display label - and to 404 via `notFound()` when the
 * slug doesn't match any known category.
 */
export function getCategoryBySlug(slug: string): Category | undefined {
  return popularCategories.find((category) => category.id === slug);
}
