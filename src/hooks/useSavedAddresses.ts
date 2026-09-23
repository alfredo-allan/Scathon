"use client";

import { useSyncExternalStore } from "react";
import { savedAddressesStore } from "@/lib/addresses";

/**
 * Reads the customer's saved delivery addresses. Plain read hook (no
 * Context, mirroring how `<OrderReviewForm/>` reads `orderReviewsStore`
 * directly) since nothing besides the list itself needs to be shared -
 * writes go through `saveAddress`/`removeAddress` in `@/lib/addresses`.
 */
export function useSavedAddresses() {
  return useSyncExternalStore(
    savedAddressesStore.subscribe,
    savedAddressesStore.getSnapshot,
    savedAddressesStore.getServerSnapshot,
  );
}
