import type { ColorVariant } from "@/types";
import { apiFetch, resolveMediaUrl } from "./apiClient";

/**
 * CRUD de catálogo pro painel admin (`POST/PATCH/DELETE /api/v1/admin/
 * products`, `POST /api/v1/admin/products/{id}/images` - ver `app/admin/
 * __init__.py` e `app/admin/product_images.py` no backend) - pedido pelo
 * Alfredo em 2026-10-03: "adicionar fotos de produtos e descrição... pra
 * visualmente o admin controlar tudo isso". Leitura de catálogo continua
 * pelos endpoints públicos (`@/lib/products`'s `listProducts`) - só a
 * ESCRITA (criar/editar/apagar produto, subir foto) e a leitura do detalhe
 * "cru" (que carrega `id`/`stock`, campos que o `Product` mapeado de
 * `@/lib/products` não leva pro resto do site) moram aqui; tudo exige token
 * de admin, exceto `listCategories` (mesma rota pública de `GET
 * /categories`).
 */

export interface AdminCategory {
  id: string;
  label: string;
}

/**
 * Mesmo formato que `ProductSchema` (backend) valida - nomes de campo em
 * camelCase, iguais ao que `apiFetch` manda como JSON (`data_key` de cada
 * campo no schema). Usado tanto pra criar (todos os campos, exceto `id` -
 * o servidor gera sozinho, ver `_generate_product_id`) quanto pra editar
 * (`Partial<AdminProductPayload>` - só o que mudou).
 */
export interface AdminProductPayload {
  slug: string;
  title: string;
  price: number;
  currency?: string;
  category: string;
  rating?: number;
  reviewCount?: number;
  isNew?: boolean;
  isBestSeller?: boolean;
  styleCode?: string | null;
  description?: string | null;
  availability?: "in_stock" | "coming_soon";
  imageUrl?: string | null;
  coverImage?: string | null;
  hoverImageUrl?: string | null;
  sizes?: string[];
  specimenImages?: string[];
  colors?: ColorVariant[];
  stock?: number;
}

/** O payload acima + o `id` - o que `<AdminProductsTab/>` carrega pra preencher o formulário de edição de um produto já existente. */
export interface AdminProductDetail extends AdminProductPayload {
  id: string;
}

interface CategoriesResponse {
  items: AdminCategory[];
}

/** `GET /categories` - pública, sem token (mesma rota que um futuro seletor de categoria na loja usaria). Alimenta o `<select>` de categoria do formulário de produto. */
export async function listCategories(): Promise<AdminCategory[]> {
  const data = await apiFetch<CategoriesResponse>("/categories");
  return data.items;
}

interface RawProductDetail {
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
  colors: ColorVariant[];
  styleCode: string | null;
  description: string | null;
  sizes: string[];
  specimenImages: string[];
  stock: number;
}

interface RawProductDetailResponse {
  product: RawProductDetail;
}

/**
 * Busca um produto pelo slug no MESMO endpoint público que `@/lib/products`'s
 * `getProductBySlug` usa (`GET /products/{slug}`), só que devolvendo o
 * formato "cru" do backend em vez do `Product` mapeado - precisa do `id`
 * (pra depois chamar `updateProduct`/`uploadProductImage`) e do `stock`
 * (campo que `mapDetail` em `@/lib/products` nunca leva pro resto do site,
 * porque nenhuma outra tela do storefront precisa saber o saldo exato).
 * Pública, sem token - mesma visibilidade de qualquer ficha de produto.
 */
export async function getAdminProductDetail(slug: string): Promise<AdminProductDetail> {
  const data = await apiFetch<RawProductDetailResponse>(`/products/${encodeURIComponent(slug)}`);
  const p = data.product;
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    price: p.price,
    currency: p.currency,
    category: p.category,
    rating: p.rating,
    reviewCount: p.reviewCount,
    isNew: p.isNew,
    isBestSeller: p.isBestSeller,
    styleCode: p.styleCode,
    description: p.description,
    availability: p.availability,
    imageUrl: p.imageUrl,
    coverImage: p.coverImage,
    hoverImageUrl: p.hoverImageUrl,
    sizes: p.sizes,
    specimenImages: p.specimenImages,
    colors: p.colors,
    stock: p.stock,
  };
}

interface AdminProductResponse {
  product: RawProductDetail;
}

/** Cria um produto novo - o backend gera o `id` sozinho (ver `_generate_product_id` em `app/admin/__init__.py`); o payload nunca inclui um. Devolve o `id` recém-criado, pra já poder subir fotos em seguida. */
export async function createProduct(token: string, payload: AdminProductPayload): Promise<string> {
  const data = await apiFetch<AdminProductResponse>("/admin/products", {
    method: "POST",
    token,
    body: payload,
  });
  return data.product.id;
}

/** Atualiza só os campos presentes em `payload` (PATCH parcial - espelha `ProductSchema.load(data, partial=True)` no backend; campos ausentes não são tocados). */
export async function updateProduct(
  token: string,
  productId: string,
  payload: Partial<AdminProductPayload>,
): Promise<void> {
  await apiFetch(`/admin/products/${encodeURIComponent(productId)}`, {
    method: "PATCH",
    token,
    body: payload,
  });
}

export async function deleteProduct(token: string, productId: string): Promise<void> {
  await apiFetch(`/admin/products/${encodeURIComponent(productId)}`, {
    method: "DELETE",
    token,
  });
}

interface UploadImageResponse {
  url: string;
}

/**
 * Sobe uma foto pro produto (`POST /admin/products/{id}/images`, multipart -
 * ver `app/admin/product_images.py`) e devolve a URL relativa já pronta
 * (`/media/products/...`) pra entrar num dos campos de imagem (`imageUrl`/
 * `coverImage`/`hoverImageUrl`/`specimenImages`/`colors[].imageUrl`) do
 * próximo `updateProduct`/`createProduct` - este endpoint só processa e
 * guarda o arquivo, nunca decide sozinho onde a URL vai (mesmo contrato do
 * backend, ver seu doc comment). Precisa de um produto já existente - um
 * produto novo sem `id` ainda (fluxo de criação) upa as fotos só depois do
 * primeiro `createProduct`.
 */
export async function uploadProductImage(token: string, productId: string, file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const data = await apiFetch<UploadImageResponse>(`/admin/products/${encodeURIComponent(productId)}/images`, {
    method: "POST",
    token,
    body: form,
  });
  return data.url;
}

/**
 * Resolve uma URL de imagem de produto pra exibir no painel admin. Fotos
 * enviadas pelo upload (`/media/products/...`, servidas pelo Flask) precisam
 * da origem do BACKEND, igual `resolveMediaUrl` já faz pro avatar (ver o doc
 * comment lá: sem isso, o navegador resolveria contra a origem do FRONTEND,
 * onde essa rota não existe). Fotos antigas do catálogo (`/category/...`,
 * `/specimen/...` - assets estáticos do próprio frontend em `public/`)
 * continuam resolvendo contra o frontend sem nenhum prefixo - só `/media/...`
 * é redirecionado pro backend.
 */
export function resolveProductImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (!path.startsWith("/media/")) return path;
  return resolveMediaUrl(path);
}
