"use client";

import {
  createContext,
  useCallback,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPersistedStore } from "@/lib/createPersistedStore";

interface WishlistContextValue {
  /** Product ids the customer has saved as favorites. */
  savedIds: string[];
  isSaved: (productId: string) => boolean;
  toggleSaved: (productId: string) => void;
}

const wishlistStore = createPersistedStore<string[]>("scathon:wishlist", []);

export const WishlistContext = createContext<WishlistContextValue | undefined>(
  undefined,
);

/**
 * Backs the "Salvar como favoritos" button on the product detail page (and
 * anywhere else a heart/favorite toggle shows up later, e.g. a future
 * `<ProductCard/>` heart icon or the `/wishlist` link already sitting in
 * `<FloatingDock/>`) - same persisted-external-store shape as
 * `CartContext`/`AuthContext`, just storing a plain list of product ids
 * since there's nothing else to remember about a saved item.
 */
export function WishlistProvider({ children }: { children: ReactNode }) {
  const savedIds = useSyncExternalStore(
    wishlistStore.subscribe,
    wishlistStore.getSnapshot,
    wishlistStore.getServerSnapshot,
  );

  const toggleSaved = useCallback((productId: string) => {
    wishlistStore.setValue((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  }, []);

  const isSaved = useCallback(
    (productId: string) => savedIds.includes(productId),
    [savedIds],
  );

  const value = useMemo(
    () => ({ savedIds, isSaved, toggleSaved }),
    [savedIds, isSaved, toggleSaved],
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}
