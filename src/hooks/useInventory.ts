"use client";

import { useSyncExternalStore } from "react";
import { inventoryStore } from "@/lib/inventory";

/** Live stock levels keyed by product slug - see `@/lib/inventory`. */
export function useInventory() {
  return useSyncExternalStore(inventoryStore.subscribe, inventoryStore.getSnapshot, inventoryStore.getServerSnapshot);
}
