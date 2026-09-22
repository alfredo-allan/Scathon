import type { Product } from "@/types";

// The placeholder-generator helper that used to live here (`productImages`,
// built on `@/lib/placeholder`) went unused once the last placeholder-only
// products were replaced by real photography below - every product in the
// catalog now sets its own `imageUrl`/`coverImage` directly. Bring back
// `import { placeholderImage } from "@/lib/placeholder"` if a new product
// ever needs to ship before its real photos are ready.
export const products: Product[] = [
  {
    id: "p-009",
    slug: "cathedral-t-shirt-preta",
    title: "Camiseta Cathedral Preta",
    price: 159.9,
    currency: "BRL",
    category: "camisetas",
    rating: 4.8,
    reviewCount: 12,
    isNew: true,
    styleCode: "SCT-CT09-001",
    description:
      "Camiseta Cathedral, estampa gráfica de inspiração gótica em toda a extensão da frente.\n\nMalha 100% algodão penteado, gramatura média e caimento reto - a base perfeita pra deixar a estampa ser o centro das atenções.",
    sizes: ["P", "M", "G", "GG", "XG"],
    // Real photography (see `Product.coverImage`/`specimenImages`), not the
    // placeholder generator - `imageUrl`/`hoverImageUrl` below are just a
    // same-shaped fallback for anywhere that hasn't been switched to prefer
    // `coverImage` yet.
    imageUrl: "/category/shirt/BlackCathedral-T-shirt.jpeg",
    coverImage: "/category/shirt/BlackCathedral-T-shirt.jpeg",
    // Flat frente/verso shots (background removed, flattened to white since
    // .jpeg has no alpha channel) first, lifestyle/model photos after - the
    // usual e-commerce order: a clean, quick-scan product view leads, the
    // "how it's worn" context follows.
    specimenImages: [
      "/category/shirt/BlackCathedral-T-shirt.jpeg",
      "/category/shirt/BlackCathedral-T-shirt_1.jpeg",
      "/specimen/BlackModelCathedral-T-shirt.jpeg",
      "/specimen/BlackModel_1Cathedral-T-shirt.jpeg",
    ],
    colors: [
      {
        name: "Preto",
        hex: "#171717",
        imageUrl: "/category/shirt/BlackCathedral-T-shirt.jpeg",
      },
    ],
    // Curated into the home page's "Mais Vendidos" rail (see `isBestSeller`
    // on `Product` and `getBestSellers()`) - not because it has the most
    // reviews yet (it's a new product with 12), but because it's one of the
    // four products picked to headline that section.
    isBestSeller: true,
  },
  {
    id: "p-010",
    slug: "cathedral-t-shirt-branca",
    title: "Camiseta Cathedral Branca",
    price: 159.9,
    currency: "BRL",
    category: "camisetas",
    rating: 4.8,
    reviewCount: 9,
    isNew: true,
    styleCode: "SCT-CT10-002",
    description:
      "Camiseta Cathedral, estampa gráfica de inspiração gótica em toda a extensão da frente.\n\nMalha 100% algodão penteado, gramatura média e caimento reto - a base perfeita pra deixar a estampa ser o centro das atenções.",
    sizes: ["P", "M", "G", "GG", "XG"],
    imageUrl: "/category/shirt/WhiteCathedral-T-shirt.jpeg",
    coverImage: "/category/shirt/WhiteCathedral-T-shirt.jpeg",
    specimenImages: [
      "/category/shirt/WhiteCathedral-T-shirt.jpeg",
      "/category/shirt/WhiteCathedral-T-shirt_1.jpeg",
      "/specimen/WhiteModelCathedral-T-shirt.jpeg",
    ],
    colors: [
      {
        name: "Branco",
        hex: "#fafafa",
        imageUrl: "/category/shirt/WhiteCathedral-T-shirt.jpeg",
      },
    ],
    isBestSeller: true,
  },
  {
    id: "p-011",
    slug: "moletom-basico-preto",
    title: "Moletom Básico Preto",
    price: 259.9,
    currency: "BRL",
    category: "moletons",
    rating: 0,
    reviewCount: 0,
    styleCode: "SCT-SW11-001",
    // Not orderable yet - see `Product.availability`. `<ProductCard/>` and
    // `<ProductDetail/>` both swap their buy affordances for
    // `<NotifyMeButton/>` when this is set, so there's nothing else to wire
    // up per-product to get the waitlist behavior.
    availability: "coming_soon",
    isBestSeller: true,
    description:
      "Moletom careca básico, corte reto e visual limpo pra ir com tudo no closet.\n\nMoletom flanelado por dentro, punho e barra em ribana. Sem estampa - só o essencial bem feito.",
    sizes: ["P", "M", "G", "GG"],
    imageUrl: "/category/sweatshirt/BlackSweatshitBasic.jpeg",
    coverImage: "/category/sweatshirt/BlackSweatshitBasic.jpeg",
    specimenImages: [
      "/category/sweatshirt/BlackSweatshitBasic.jpeg",
      "/category/sweatshirt/BlackSweatshitBasic_1.jpeg",
    ],
    colors: [
      {
        name: "Preto",
        hex: "#171717",
        imageUrl: "/category/sweatshirt/BlackSweatshitBasic.jpeg",
      },
    ],
  },
  {
    id: "p-012",
    slug: "bermuda-moletom-cinza",
    title: "Bermuda de Moletom Cinza",
    price: 179.9,
    currency: "BRL",
    category: "calcas",
    rating: 0,
    reviewCount: 0,
    styleCode: "SCT-SS12-001",
    availability: "coming_soon",
    isBestSeller: true,
    description:
      "Bermuda de moletom básica, cintura com elástico e cordão de ajuste, bolsos laterais funcionais.\n\nMesmo tecido flanelado dos moletons da casa - o conforto de moletom no formato bermuda.",
    sizes: ["P", "M", "G", "GG"],
    imageUrl: "/category/sweat-shorts/GraySweatShortsBasic.jpeg",
    coverImage: "/category/sweat-shorts/GraySweatShortsBasic.jpeg",
    specimenImages: [
      "/category/sweat-shorts/GraySweatShortsBasic.jpeg",
      "/specimen/GrayModelSweatShortsBasic.jpeg",
    ],
    colors: [
      {
        name: "Cinza",
        hex: "#9ca3af",
        imageUrl: "/category/sweat-shorts/GraySweatShortsBasic.jpeg",
      },
    ],
  },
  {
    id: "p-013",
    slug: "bermuda-moletom-preta",
    title: "Bermuda de Moletom Preta",
    price: 179.9,
    currency: "BRL",
    category: "calcas",
    rating: 0,
    reviewCount: 0,
    styleCode: "SCT-SS13-002",
    // Same not-yet-in-stock treatment as the rest of this "moletom básico"
    // line (see `Product.availability`) - real photography exists, but
    // there's no inventory to sell yet.
    availability: "coming_soon",
    description:
      "Bermuda de moletom básica, cintura com elástico e cordão de ajuste, bolsos laterais funcionais.\n\nMesmo tecido flanelado dos moletons da casa - o conforto de moletom no formato bermuda, agora em preto.",
    sizes: ["P", "M", "G", "GG"],
    imageUrl: "/category/sweat-shorts/BlackSweatShortsBasic.jpeg",
    coverImage: "/category/sweat-shorts/BlackSweatShortsBasic.jpeg",
    specimenImages: ["/category/sweat-shorts/BlackSweatShortsBasic.jpeg"],
    colors: [
      {
        name: "Preto",
        hex: "#171717",
        imageUrl: "/category/sweat-shorts/BlackSweatShortsBasic.jpeg",
      },
    ],
  },
  {
    id: "p-014",
    slug: "calca-moletom-preta",
    title: "Calça de Moletom Preta",
    price: 229.9,
    currency: "BRL",
    category: "calcas",
    rating: 0,
    reviewCount: 0,
    styleCode: "SCT-SP14-001",
    availability: "coming_soon",
    description:
      "Calça de moletom básica, cintura com elástico e cordão de ajuste, punhos em ribana no tornozelo.\n\nMesmo tecido flanelado dos moletons da casa - conforto de moletom pra usar do sofá à rua.",
    sizes: ["P", "M", "G", "GG"],
    imageUrl: "/category/sweatpants/BlackSweatPantsBasic.jpeg",
    coverImage: "/category/sweatpants/BlackSweatPantsBasic.jpeg",
    specimenImages: ["/category/sweatpants/BlackSweatPantsBasic.jpeg"],
    colors: [
      {
        name: "Preto",
        hex: "#171717",
        imageUrl: "/category/sweatpants/BlackSweatPantsBasic.jpeg",
      },
    ],
  },
  {
    id: "p-015",
    slug: "calca-moletom-cinza",
    title: "Calça de Moletom Cinza",
    price: 229.9,
    currency: "BRL",
    category: "calcas",
    rating: 0,
    reviewCount: 0,
    styleCode: "SCT-SP15-002",
    availability: "coming_soon",
    description:
      "Calça de moletom básica, cintura com elástico e cordão de ajuste, punhos em ribana no tornozelo.\n\nMesmo tecido flanelado dos moletons da casa - conforto de moletom pra usar do sofá à rua, agora em cinza mescla.",
    sizes: ["P", "M", "G", "GG"],
    imageUrl: "/category/sweatpants/GraySweatPantsBasic.jpeg",
    coverImage: "/category/sweatpants/GraySweatPantsBasic.jpeg",
    specimenImages: ["/category/sweatpants/GraySweatPantsBasic.jpeg"],
    colors: [
      {
        name: "Cinza",
        hex: "#9ca3af",
        imageUrl: "/category/sweatpants/GraySweatPantsBasic.jpeg",
      },
    ],
  },
  {
    id: "p-016",
    slug: "moletom-basico-cinza",
    title: "Moletom Básico Cinza",
    price: 259.9,
    currency: "BRL",
    category: "moletons",
    rating: 0,
    reviewCount: 0,
    styleCode: "SCT-SW16-002",
    availability: "coming_soon",
    description:
      "Moletom careca básico, corte reto e visual limpo pra ir com tudo no closet.\n\nMoletom flanelado por dentro, punho e barra em ribana. Sem estampa - só o essencial bem feito, na versão cinza mescla.",
    sizes: ["P", "M", "G", "GG"],
    imageUrl: "/category/sweatshirt/GraySweatshitBasic.jpeg",
    coverImage: "/category/sweatshirt/GraySweatshitBasic.jpeg",
    specimenImages: [
      "/category/sweatshirt/GraySweatshitBasic.jpeg",
      "/category/sweatshirt/GraySweatshitBasic_1.jpeg",
    ],
    colors: [
      {
        name: "Cinza",
        hex: "#9ca3af",
        imageUrl: "/category/sweatshirt/GraySweatshitBasic.jpeg",
      },
    ],
  },
];

export function getBestSellers() {
  // A curated pick (`isBestSeller`) wins when one exists - this is how a
  // `coming_soon` product with 0 reviews can still headline the "Mais
  // Vendidos" rail. Falls back to the old reviewCount-sorted behavior so
  // the rail still shows something sensible before any product is curated.
  const curated = products.filter((product) => product.isBestSeller);
  if (curated.length > 0) return curated;
  return [...products]
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, 4);
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

/**
 * Looks up a single product by its slug (the `/shop/[category]/[product]`
 * URL segment). Returns `undefined` for an unknown slug so the page can
 * 404 via `notFound()` - it does not itself check that the slug's parent
 * `category` segment matches `product.category`; the page does that too,
 * since a valid product slug under the wrong category should still 404.
 */
export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

/**
 * Looks up a single product by its catalog id (`Product.id`, e.g.
 * "p-009") rather than its URL slug. Backs anything that only has the id
 * to work with - the wishlist ("curtir") store just remembers ids, and
 * `/wishlist` uses this to turn those back into full `Product`s to render.
 */
export function getProductById(id: string) {
  return products.find((product) => product.id === id);
}
