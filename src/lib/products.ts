import type { ColorVariant, Product } from "@/types";
import { apiFetch, ApiError } from "./apiClient";

/**
 * Catálogo real contra o backend Flask (`scathon-api` - ver
 * `app/catalog/__init__.py`), fase 4 do roadmap ("integração geral do
 * frontend"). Substitui `src/data/products.ts` (array estático em memória,
 * mantido no repo só como referência histórica - nada mais importa dele)
 * como fonte de produtos: catálogo, estoque e destaques agora vêm de
 * verdade do painel admin, não de um array hardcoded no bundle do cliente.
 *
 * O formato que o backend devolve (`Product.to_summary_dict()`/
 * `to_detail_dict()`) já bate campo a campo com o tipo `Product` de
 * `@/types` (mesmo princípio de `@/lib/auth`'s `ApiUser`) - o único
 * remapeamento real é `id` (igual em ambos os lados, "p-009"-like) e
 * `compareAtPrice`/`images`/`reviews`, que o backend simplesmente não tem
 * ainda (ficam `undefined`, exatamente como um produto do mock que nunca
 * preencheu esses campos opcionais).
 */

interface ApiColorVariant {
  name: string;
  hex: string;
  imageUrl: string;
}

interface ApiProductSummary {
  id: string;
  slug: string;
  title: string;
  price: number;
  currency: string;
  category: string;
  rating: number;
  reviewCount: number;
  isNew: boolean;
  isBestSeller: boolean;
  availability: "in_stock" | "coming_soon";
  imageUrl: string | null;
  coverImage: string | null;
  hoverImageUrl: string | null;
  colors: ApiColorVariant[];
}

interface ApiProductDetail extends ApiProductSummary {
  styleCode: string | null;
  description: string | null;
  sizes: string[];
  specimenImages: string[];
  stock: number;
}

interface ProductsListResponse {
  items: ApiProductSummary[];
  page: number;
  perPage: number;
  total: number;
}

interface ProductDetailResponse {
  product: ApiProductDetail;
}

function mapColors(colors: ApiColorVariant[]): ColorVariant[] {
  return colors.map((color) => ({ name: color.name, hex: color.hex, imageUrl: color.imageUrl }));
}

function mapSummary(product: ApiProductSummary): Product {
  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    price: product.price,
    currency: product.currency,
    category: product.category,
    rating: product.rating,
    reviewCount: product.reviewCount,
    isNew: product.isNew,
    isBestSeller: product.isBestSeller,
    availability: product.availability,
    imageUrl: product.imageUrl ?? "",
    coverImage: product.coverImage ?? undefined,
    hoverImageUrl: product.hoverImageUrl ?? undefined,
    colors: mapColors(product.colors),
  };
}

function mapDetail(product: ApiProductDetail): Product {
  return {
    ...mapSummary(product),
    styleCode: product.styleCode ?? undefined,
    description: product.description ?? undefined,
    sizes: product.sizes.length > 0 ? product.sizes : undefined,
    specimenImages: product.specimenImages.length > 0 ? product.specimenImages : undefined,
  };
}

export interface ListProductsParams {
  category?: string;
  isNew?: boolean;
  isBestSeller?: boolean;
  perPage?: number;
  /** Server Components only - ver o doc comment de `ApiFetchOptions.revalidate`. */
  revalidate?: number | false;
}

const MAX_PAGE_SIZE = 100;

export async function listProducts(params: ListProductsParams = {}): Promise<Product[]> {
  const query = new URLSearchParams();
  if (params.category) query.set("category", params.category);
  if (params.isNew) query.set("isNew", "true");
  if (params.isBestSeller) query.set("isBestSeller", "true");
  query.set("perPage", String(params.perPage ?? MAX_PAGE_SIZE));

  const data = await apiFetch<ProductsListResponse>(`/products?${query.toString()}`, {
    revalidate: params.revalidate,
  });
  return data.items.map(mapSummary);
}

export async function getBestSellers(revalidate?: number | false): Promise<Product[]> {
  return listProducts({ isBestSeller: true, revalidate });
}

export async function getNewArrivals(revalidate?: number | false): Promise<Product[]> {
  return listProducts({ isNew: true, revalidate });
}

export async function getProductsByCategory(
  categorySlug: string,
  revalidate?: number | false,
): Promise<Product[]> {
  return listProducts({ category: categorySlug, revalidate });
}

/**
 * Busca um produto pelo slug (`/shop/[category]/[product]`). Devolve
 * `undefined` num 404 - mesmo contrato de `getProductBySlug` no mock antigo,
 * pra quem chama continuar podendo decidir `notFound()`.
 */
export async function getProductBySlug(
  slug: string,
  revalidate?: number | false,
): Promise<Product | undefined> {
  try {
    const data = await apiFetch<ProductDetailResponse>(`/products/${encodeURIComponent(slug)}`, {
      revalidate,
    });
    return mapDetail(data.product);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return undefined;
    throw err;
  }
}

/**
 * Cache em memória, só do lado do cliente, pro catálogo completo - usado
 * pelos Client Components que precisam filtrar/resolver produtos por id
 * (`<SearchOverlay/>`, `/wishlist`) sem refazer a mesma chamada de rede a
 * cada tecla digitada ou a cada id da wishlist. Expira sozinho depois de um
 * minuto (tempo suficiente pra uma sessão de busca, curto o bastante pra
 * nunca mostrar um produto que o admin acabou de apagar por muito tempo) -
 * nunca usado em Server Components (cada um já tem o próprio `revalidate`
 * do Next.js pra isso).
 */
let cachedAllProducts: { expiresAt: number; promise: Promise<Product[]> } | null = null;
const CLIENT_CACHE_TTL_MS = 60_000;

function getAllProductsCached(): Promise<Product[]> {
  const now = Date.now();
  if (!cachedAllProducts || cachedAllProducts.expiresAt < now) {
    cachedAllProducts = {
      expiresAt: now + CLIENT_CACHE_TTL_MS,
      promise: listProducts({ perPage: MAX_PAGE_SIZE }),
    };
  }
  return cachedAllProducts.promise;
}

/** Busca produtos pelo catálogo completo (cacheado) - `/wishlist`'s only lookup today. */
export async function getProductById(id: string): Promise<Product | undefined> {
  const all = await getAllProductsCached();
  return all.find((product) => product.id === id);
}

/** Mesma ideia de `getProductById`, pra uma lista de ids de uma vez (`<WishlistView/>`). */
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  const all = await getAllProductsCached();
  const byId = new Map(all.map((product) => [product.id, product]));
  return ids.map((id) => byId.get(id)).filter((product): product is Product => product !== undefined);
}

/** Catálogo completo cacheado - usado por `<SearchOverlay/>` pra filtrar localmente enquanto o visitante digita. */
export async function searchableCatalog(): Promise<Product[]> {
  return getAllProductsCached();
}
