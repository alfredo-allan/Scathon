import type { Category } from "@/types";

// Every href below is "/" on purpose: these four used to point at pages
// that don't exist yet (`/shop` as an all-products listing with query-
// string filters, `/collections/ss26`) and 404'd in the actual header -
// see the CategoryBar screenshot that flagged this. No resources yet for
// building those out for real, so every quick-nav label in this bar sends
// the visitor home instead of into a dead end. Point these at their real
// destinations once those pages exist; the labels/ids don't need to
// change, only the hrefs.
export const categories: Category[] = [
  { id: "shop-all", label: "Todos os Produtos", href: "/" },
  { id: "new-in", label: "Novidades", href: "/" },
  { id: "best-sellers", label: "Mais Vendidos", href: "/" },
  { id: "ss26", label: "SS26", href: "/" },
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
