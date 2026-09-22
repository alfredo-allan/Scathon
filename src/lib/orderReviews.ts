import { createPersistedStore } from "./createPersistedStore";

export interface OrderReview {
  slug: string;
  rating: number;
  comment: string;
  createdAt: string;
}

/**
 * Reviews written from `/account/orders`' "avalie este produto" prompt,
 * keyed by product slug. Same persisted-external-store shape as
 * `waitlistStore`/`WishlistContext` (see those files' doc comments) - read
 * via `useSyncExternalStore` wherever "did I already review this" needs to
 * be known on first render.
 */
export const orderReviewsStore = createPersistedStore<Record<string, OrderReview>>(
  "scathon:order-reviews",
  {},
);

/**
 * Records a star rating + comment for a product bought in a past order.
 *
 * No review backend yet, so - same seam as `@/lib/waitlist`'s
 * `notifyInterest` - this only persists to `localStorage` for now, but is
 * already `async`/`Promise`-returning so the body below can become a real
 * request later:
 *
 *   await fetch("/api/reviews", {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json" },
 *     body: JSON.stringify({ slug, rating, comment }),
 *   });
 *
 * without `<OrderReviewForm/>`, its only caller, needing to change.
 */
export async function submitOrderReview(slug: string, rating: number, comment: string): Promise<void> {
  const current = orderReviewsStore.getSnapshot();
  orderReviewsStore.setValue({
    ...current,
    [slug]: { slug, rating, comment, createdAt: new Date().toISOString() },
  });
}
