import { placeholderImage } from "@/lib/placeholder";
import type { Product } from "@/types";

function productImages(label: string, colorLabel: string, bg: string) {
  return {
    imageUrl: placeholderImage(`${label}\n${colorLabel}`, { bg }),
    hoverImageUrl: placeholderImage(`${label}\n${colorLabel} (alt)`, {
      bg,
      fg: "#171717",
    }),
  };
}

export const products: Product[] = [
  {
    id: "p-001",
    slug: "oversized-heavyweight-hoodie",
    title: "Moletom Oversized Pesado",
    price: 349.9,
    compareAtPrice: 429.9,
    currency: "BRL",
    category: "moletons",
    rating: 4.7,
    reviewCount: 128,
    isNew: true,
    ...productImages("Moletom Pesado", "Preto", "#d4d4d4"),
    colors: [
      { name: "Preto", hex: "#171717", imageUrl: placeholderImage("Moletom\nPreto", { bg: "#d4d4d4" }) },
      { name: "Pedra", hex: "#d6d3d1", imageUrl: placeholderImage("Moletom\nPedra", { bg: "#e7e5e4" }) },
      { name: "Verde Oliva", hex: "#4d5339", imageUrl: placeholderImage("Moletom\nVerde Oliva", { bg: "#dad9d0" }) },
    ],
  },
  {
    id: "p-002",
    slug: "boxy-fit-tee",
    title: "Camiseta Boxy Estampada",
    price: 149.9,
    currency: "BRL",
    category: "camisetas",
    rating: 4.5,
    reviewCount: 84,
    ...productImages("Camiseta Boxy", "Branco", "#f5f5f5"),
    colors: [
      { name: "Branco", hex: "#fafafa", imageUrl: placeholderImage("Camiseta\nBranco", { bg: "#f5f5f5" }) },
      { name: "Preto", hex: "#171717", imageUrl: placeholderImage("Camiseta\nPreto", { bg: "#e5e5e5" }) },
    ],
  },
  {
    id: "p-003",
    slug: "cargo-utility-pants",
    title: "Calça Cargo Utilitária",
    price: 389.9,
    currency: "BRL",
    category: "calcas",
    rating: 4.8,
    reviewCount: 201,
    isNew: true,
    ...productImages("Calça Cargo", "Caqui", "#e7e5e4"),
    colors: [
      { name: "Caqui", hex: "#a8a29e", imageUrl: placeholderImage("Cargo\nCaqui", { bg: "#e7e5e4" }) },
      { name: "Preto", hex: "#171717", imageUrl: placeholderImage("Cargo\nPreto", { bg: "#d4d4d4" }) },
    ],
  },
  {
    id: "p-004",
    slug: "coach-shell-jacket",
    title: "Jaqueta Coach Corta-Vento",
    price: 549.9,
    compareAtPrice: 649.9,
    currency: "BRL",
    category: "casacos",
    rating: 4.6,
    reviewCount: 57,
    ...productImages("Jaqueta Coach", "Azul-Marinho", "#d1d5db"),
    colors: [
      { name: "Azul-Marinho", hex: "#1e293b", imageUrl: placeholderImage("Jaqueta\nAzul-Marinho", { bg: "#d1d5db" }) },
      { name: "Preto", hex: "#171717", imageUrl: placeholderImage("Jaqueta\nPreto", { bg: "#d4d4d4" }) },
    ],
  },
  {
    id: "p-005",
    slug: "ribbed-beanie",
    title: "Touca de Tricô Canelada",
    price: 89.9,
    currency: "BRL",
    category: "acessorios",
    rating: 4.9,
    reviewCount: 312,
    ...productImages("Touca", "Chumbo", "#e5e5e5"),
    colors: [
      { name: "Chumbo", hex: "#404040", imageUrl: placeholderImage("Touca\nChumbo", { bg: "#e5e5e5" }) },
      { name: "Creme", hex: "#f5f0e6", imageUrl: placeholderImage("Touca\nCreme", { bg: "#f5f5f4" }) },
      { name: "Ferrugem", hex: "#9a3412", imageUrl: placeholderImage("Touca\nFerrugem", { bg: "#e7e5e4" }) },
    ],
  },
  {
    id: "p-006",
    slug: "relaxed-denim-jeans",
    title: "Calça Jeans Modelagem Relaxada",
    price: 329.9,
    currency: "BRL",
    category: "calcas",
    rating: 4.4,
    reviewCount: 96,
    ...productImages("Jeans", "Azul Lavado", "#dbeafe"),
    colors: [
      { name: "Azul Lavado", hex: "#60a5fa", imageUrl: placeholderImage("Jeans\nAzul Lavado", { bg: "#dbeafe" }) },
      { name: "Preto", hex: "#171717", imageUrl: placeholderImage("Jeans\nPreto", { bg: "#d4d4d4" }) },
    ],
  },
  {
    id: "p-007",
    slug: "logo-crewneck-sweatshirt",
    title: "Moletom Careca com Logo",
    price: 279.9,
    currency: "BRL",
    category: "moletons",
    rating: 4.6,
    reviewCount: 143,
    isNew: true,
    ...productImages("Careca", "Cinza Mescla", "#e5e7eb"),
    colors: [
      { name: "Cinza Mescla", hex: "#9ca3af", imageUrl: placeholderImage("Careca\nCinza", { bg: "#e5e7eb" }) },
      { name: "Preto", hex: "#171717", imageUrl: placeholderImage("Careca\nPreto", { bg: "#d4d4d4" }) },
    ],
  },
  {
    id: "p-008",
    slug: "nylon-crossbody-bag",
    title: "Bolsa Transversal de Nylon",
    price: 199.9,
    currency: "BRL",
    category: "acessorios",
    rating: 4.3,
    reviewCount: 41,
    ...productImages("Bolsa Transversal", "Preto", "#d4d4d4"),
    colors: [
      { name: "Preto", hex: "#171717", imageUrl: placeholderImage("Bolsa\nPreto", { bg: "#d4d4d4" }) },
      { name: "Verde Oliva", hex: "#4d5339", imageUrl: placeholderImage("Bolsa\nVerde Oliva", { bg: "#dad9d0" }) },
    ],
  },
];

export function getBestSellers() {
  return [...products].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 4);
}

export function getNewArrivals() {
  return products.filter((product) => product.isNew);
}

/**
 * Products belonging to a given category slug (see `popularCategories` in
 * `@/data/categories` - `product.category` is kept in sync with those
 * slugs). Backs the `/shop/[category]` listing page.
 */
export function getProductsByCategory(categorySlug: string) {
  return products.filter((product) => product.category === categorySlug);
}
