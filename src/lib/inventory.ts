import { products } from "@/data/products";
import { createPersistedStore } from "./createPersistedStore";

/**
 * Mock estoque (stock). There's no warehouse/inventory backend yet, so this
 * is a small persisted client-side store keyed by product slug - same
 * pattern as `cartStore`/`wishlistStore` - seeded with a deterministic
 * (not random-on-every-load) quantity per product so `<AdminInventoryTab/>`
 * has real, stable numbers to show and edit instead of an empty state.
 * Swapping this for a real inventory API later means replacing this
 * store's read/write with `GET`/`PATCH /api/inventory`; the admin tab, the
 * only caller, wouldn't need to change.
 */
function seedQuantity(slug: string, index: number): number {
  // Deterministic pseudo-variety spread across a believable small-batch
  // streetwear range (0-42), derived from each slug's own characters so it
  // stays stable across reloads/deploys - not `Math.random()`. The modulo
  // naturally lands at least one product on 0 ("esgotado"), which matters
  // for exercising that state in the UI instead of everything always
  // having stock.
  const hash = Array.from(slug).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return (hash + index * 7) % 43;
}

const SEED_STOCK: Record<string, number> = Object.fromEntries(
  products.map((product, index) => [product.slug, seedQuantity(product.slug, index)]),
);

export const inventoryStore = createPersistedStore<Record<string, number>>("scathon:inventory", SEED_STOCK);

export function getStockFor(slug: string): number {
  return inventoryStore.getSnapshot()[slug] ?? 0;
}

/** Sets an exact stock count (e.g. after a manual recount). Clamped to >= 0. */
export function setStockFor(slug: string, quantity: number): void {
  const safeQuantity = Math.max(0, Math.round(quantity));
  inventoryStore.setValue((prev) => ({ ...prev, [slug]: safeQuantity }));
}

/** Adds (or, with a negative delta, removes) stock relative to the current count. Clamped to >= 0. */
export function adjustStockFor(slug: string, delta: number): void {
  inventoryStore.setValue((prev) => ({
    ...prev,
    [slug]: Math.max(0, (prev[slug] ?? 0) + delta),
  }));
}
