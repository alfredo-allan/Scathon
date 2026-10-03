import { apiFetch, resolveMediaUrl } from "./apiClient";

export interface InventoryItem {
  productId: string;
  slug: string;
  title: string;
  imageUrl: string | null;
  quantity: number;
  lowStock: boolean;
  updatedAt: string | null;
}

interface InventoryListResponse {
  items: InventoryItem[];
  page: number;
  perPage: number;
  total: number;
}

/**
 * Estoque real do catálogo (`GET /api/v1/admin/inventory` - ver `app/admin/
 * __init__.py`, fase 3 do roadmap, já concluída no backend), fase 4 do lado
 * do frontend. Substitui `inventoryStore` (um objeto `{slug: quantidade}`
 * persistido em `localStorage`, seedado com números pseudo-aleatórios) -
 * agora é a tabela `inventory_levels` de verdade. Exige token de admin.
 */
export async function getInventory(token: string): Promise<InventoryItem[]> {
  const data = await apiFetch<InventoryListResponse>("/admin/inventory?perPage=100", { token });
  // `imageUrl` vem cru do backend (`product.cover_image or product.image_url`)
  // - uma foto enviada pelo upload do admin é `/media/products/...`, que
  // precisa da origem do backend pra não quebrar (ver `resolveMediaUrl` em
  // `@/lib/apiClient`). `@/lib/products`'s `mapSummary` já resolve isso pro
  // resto do site, mas esta tela usa um endpoint/formato próprio
  // (`GET /admin/inventory`), então resolve aqui também.
  return data.items.map((item) => ({ ...item, imageUrl: resolveMediaUrl(item.imageUrl) }));
}

/** Define um saldo exato (ex.: depois de uma recontagem manual). Clamp em >= 0 já é feito pelo backend. */
export async function setStockFor(token: string, productId: string, quantity: number): Promise<void> {
  await apiFetch(`/admin/products/${encodeURIComponent(productId)}/inventory`, {
    method: "PATCH",
    token,
    body: { quantity: Math.max(0, Math.round(quantity)) },
  });
}

/** Soma (ou, com um delta negativo, subtrai) do saldo atual. Clamp em >= 0 já é feito pelo backend. */
export async function adjustStockFor(token: string, productId: string, delta: number): Promise<void> {
  await apiFetch(`/admin/products/${encodeURIComponent(productId)}/inventory`, {
    method: "PATCH",
    token,
    body: { delta: Math.round(delta) },
  });
}
