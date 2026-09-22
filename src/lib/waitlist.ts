import { createPersistedStore } from "./createPersistedStore";

export interface WaitlistEntry {
  productId: string;
  email: string;
  /** The apparel size the visitor had selected, if any, when they signed up. */
  size?: string;
  createdAt: string;
}

/**
 * Same persisted-external-store shape as `CartContext`/`WishlistContext`
 * (see `createPersistedStore`'s doc comment) - `<NotifyMeButton/>` reads
 * this via `useSyncExternalStore` directly rather than a `useEffect`, which
 * is what keeps "has this visitor already joined this product's waitlist"
 * both hydration-safe and free of the `react-hooks/set-state-in-effect`
 * lint rule.
 */
export const waitlistStore = createPersistedStore<WaitlistEntry[]>("scathon:waitlist", []);

/**
 * Records interest in a `coming_soon` product (see `Product.availability`).
 *
 * There's no backend yet, so this only persists to `localStorage` for
 * now - same pattern as the cart/wishlist stores elsewhere in this app.
 * It's written as the seam for that backend, though: the function is
 * already `async` and already returns a `Promise`, so swapping the body
 * below for a real request once there's an endpoint -
 *
 *   await fetch("/api/waitlist", {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json" },
 *     body: JSON.stringify({ productId, email, size }),
 *   });
 *
 * - is a one-place change. `<NotifyMeButton/>`, the only caller, doesn't
 * need to change at all when that happens.
 */
export async function notifyInterest(productId: string, email: string, size?: string): Promise<void> {
  const current = waitlistStore.getSnapshot();
  if (current.some((entry) => entry.productId === productId && entry.email === email)) return;
  waitlistStore.setValue([...current, { productId, email, size, createdAt: new Date().toISOString() }]);
}
