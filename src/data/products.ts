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
    styleCode: "SCT-HW01-001",
    description:
      "O moletom oversized definitivo para quem não abre mão de conforto sem perder a atitude de rua.\n\nTecido moletom peso pesado (400g/m²), gola careca reforçada e caimento solto do jeito que pede o streetwear. Ideal para compor looks em camadas nas estações mais frias.",
    sizes: ["P", "M", "G", "GG"],
    ...productImages("Moletom Pesado", "Preto", "#d4d4d4"),
    // Demo gallery for this product only - see the `images` field's doc
    // comment on `Product`: everything else in the catalog omits it on
    // purpose, to prove <ProductGallery/>'s fallback also looks complete.
    images: [
      placeholderImage("Moletom Pesado\nVista Frontal", { bg: "#d4d4d4" }),
      placeholderImage("Moletom Pesado\nVista Traseira", { bg: "#dad9d0", fg: "#171717" }),
      placeholderImage("Moletom Pesado\nDetalhe da Gola", { bg: "#e7e5e4" }),
      placeholderImage("Moletom Pesado\nDetalhe do Tecido", { bg: "#d6d3d1", fg: "#171717" }),
    ],
    reviews: [
      {
        author: "Bianca S.",
        rating: 5,
        comment: "Muito mais grosso do que eu esperava, veste super bem no oversized. Já é o segundo que compro.",
      },
      {
        author: "Diego M.",
        rating: 4,
        comment: "Caimento excelente, só achei o comprimento das mangas um pouco longo pro meu gosto.",
      },
      {
        author: "Renata F.",
        rating: 5,
        comment: "Tecido pesado de verdade, esquenta bem e não desbota depois de várias lavagens.",
      },
    ],
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
    styleCode: "SCT-TB02-100",
    description:
      "A camiseta boxy que virou queridinha do closet Scathon: modelagem ampla, ombros caídos e estampa exclusiva na frente.\n\nMalha 100% algodão penteado, gramatura média para não marcar e não esquentar. Combina com qualquer coisa - do cargo ao jeans reto.",
    sizes: ["P", "M", "G", "GG", "XG"],
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
    styleCode: "SCT-CP03-200",
    description:
      "Calça cargo utilitária com seis bolsos funcionais e cadarço de ajuste na barra, pensada pra quem vive na rua.\n\nTecido sarja reforçado, resistente ao uso diário, com elastano suficiente pra não travar o movimento. Cintura com regulagem interna.",
    sizes: ["38", "40", "42", "44", "46"],
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
    styleCode: "SCT-CJ04-300",
    description:
      "A jaqueta coach que não sai do gancho: corta-vento leve, forro em malha e fechamento em botões de pressão.\n\nProteção real contra vento e garoa sem pesar no visual. Bolsos frontais amplos e caimento reto, perfeita pra usar por cima de qualquer look.",
    sizes: ["P", "M", "G", "GG"],
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
    styleCode: "SCT-BN05-010",
    description:
      "Touca de tricô canelado, básica e essencial pra fechar qualquer produção no frio.\n\nFio acrílico macio, dupla camada nas bordas pra não desfiar e caimento levemente slouchy - nem justo, nem largo demais. Tamanho único, serve na maioria das cabeças.",
    // No `sizes` - one-size accessory, so the detail page's size selector
    // is hidden entirely rather than showing a single disabled option.
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
    styleCode: "SCT-DN06-050",
    description:
      "Jeans de modelagem relaxada, lavagem exclusiva e caimento que não aperta em lugar nenhum.\n\nDenim 100% algodão com processo de lavagem stone wash, bolsos reforçados e barra reta pronta pra dobrar ou usar solta.",
    sizes: ["38", "40", "42", "44", "46"],
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
    styleCode: "SCT-CN07-002",
    description:
      "Moletom careca com logo bordado no peito - o básico definitivo pra girar o closet inteiro.\n\nMoletom flanelado por dentro, punho e barra em ribana reforçada. Corte reto, nem oversized nem justo.",
    sizes: ["P", "M", "G", "GG"],
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
    styleCode: "SCT-BG08-001",
    description:
      "Bolsa transversal em nylon resistente à água, compartimento principal com zíper e bolso frontal rápido.\n\nAlça ajustável e removível, cabe tranquilo o essencial do dia: carteira, chaves e celular.",
    // One-size accessory - no `sizes` here either.
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
