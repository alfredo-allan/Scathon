"use client";

import { useCallback, useSyncExternalStore } from "react";
import { checkoutShippingStore, type ShippingSelection } from "@/lib/checkoutShipping";

/**
 * Read+write access to the in-progress shipping selection shared between
 * `/cart` and `/checkout` (see `@/lib/checkoutShipping`'s doc comment).
 * Mirrors `useCart()`'s shape (a plain hook wrapping one persisted store)
 * rather than a Context, since nothing else in the tree needs to inject a
 * different implementation of it.
 */
export function useCheckoutShipping() {
  const selection = useSyncExternalStore(
    checkoutShippingStore.subscribe,
    checkoutShippingStore.getSnapshot,
    checkoutShippingStore.getServerSnapshot,
  );

  const update = useCallback((patch: Partial<ShippingSelection>) => {
    checkoutShippingStore.setValue((prev) => ({ ...prev, ...patch, confirmedAt: null }));
  }, []);

  const confirm = useCallback(() => {
    checkoutShippingStore.setValue((prev) => ({ ...prev, confirmedAt: new Date().toISOString() }));
  }, []);

  return { selection, update, confirm };
}
