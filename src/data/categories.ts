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
  // { id: "ss26", label: "SS26", href: "/" },
];

// The id doubles as the URL slug (see `/shop/[category]`), and is derived
// from the Portuguese label on purpose - Alfredo wants the category page's
// URL to read in Portuguese too (e.g. /shop/moletons), not carry over the
// old English internal names (hoodies, tees, ...) that only ever showed up
// in code, never on screen.
//
// IMPORTANTE - precisa bater 1:1 com as categorias reais do backend
// (`Category`, tabela seedada por `SEED_CATEGORIES` em `seed.py`:
// moletons/camisetas/casacos/calcas/acessorios). `getCategoryBySlug` abaixo
// é quem decide se `/shop/[category]/[product]` existe ou dá 404 (ver o
// `!category` check em `app/shop/[category]/[product]/page.tsx`) - antes
// deste ajuste, "casacos" e "acessorios" estavam comentados aqui (nenhum
// produto do catálogo inicial usava essas duas), então o primeiro produto
// cadastrado pelo Alfredo numa delas via `<AdminProductsTab/>` ficava
// "indisponível" ao clicar, mesmo existindo de verdade no banco - o painel
// admin deixa escolher QUALQUER categoria real (`GET /categories`), mas esta
// lista aqui é estática e só sabia de parte delas. "bermudas" nunca existiu
// como categoria real no backend (era só um resquício do mock antigo em
// `src/data/products.ts`) - removida daqui também, já que selecioná-la no
// admin é impossível (o dropdown só lista categorias reais) e o link nunca
// levava a produto nenhum. Se um dia o admin ganhar uma tela de "criar
// categoria", esta lista precisa voltar a ser buscada de `GET /categories`
// em vez de mantida à mão feito agora.
export const popularCategories: Category[] = [
  { id: "moletons", label: "Moletons", href: "/shop/moletons" },
  { id: "camisetas", label: "Camisetas", href: "/shop/camisetas" },
  { id: "casacos", label: "Casacos", href: "/shop/casacos" },
  { id: "calcas", label: "Calças", href: "/shop/calcas" },
  // { id: "acessorios", label: "Acessórios", href: "/shop/acessorios" },
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
