"use client";

import {
  createContext,
  useCallback,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { CartItem } from "@/types";
import { createPersistedStore } from "@/lib/createPersistedStore";

interface CartContextValue {
  items: CartItem[];
  cartCount: number;
  totalAmount: number;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string, color: string, size: string) => void;
  updateQuantity: (
    productId: string,
    color: string,
    size: string,
    quantity: number,
  ) => void;
  clearCart: () => void;
  /**
   * Mini-cart drawer visibility (see `<CartDrawer/>`). Lives here, not in
   * its own context, specifically so `addItem` can flip it on directly
   * below - every call site that adds a product gets the "here's what
   * just happened" drawer for free, structurally, instead of each one
   * having to remember to open it itself.
   */
  isDrawerOpen: boolean;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
}

const cartStore = createPersistedStore<CartItem[]>("scathon:cart", []);

export const CartContext = createContext<CartContextValue | undefined>(
  undefined,
);

function sameLine(a: CartItem, productId: string, color: string, size: string) {
  return a.productId === productId && a.color === color && a.size === size;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getSnapshot,
    cartStore.getServerSnapshot,
  );

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const openCartDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeCartDrawer = useCallback(() => setIsDrawerOpen(false), []);

  const addItem = useCallback<CartContextValue["addItem"]>(
    (item, quantity = 1) => {
      cartStore.setValue((prev) => {
        const existingIndex = prev.findIndex((line) =>
          sameLine(line, item.productId, item.color, item.size),
        );
        if (existingIndex >= 0) {
          const next = [...prev];
          next[existingIndex] = {
            ...next[existingIndex],
            quantity: next[existingIndex].quantity + quantity,
          };
          return next;
        }
        return [...prev, { ...item, quantity }];
      });
      // Every add-to-cart opens the mini-cart drawer - the whole point of
      // it (see `<CartDrawer/>`'s doc comment) is instant "here's what you
      // just added" feedback, so this isn't optional per call site.
      setIsDrawerOpen(true);
    },
    [],
  );

  const removeItem = useCallback<CartContextValue["removeItem"]>(
    (productId, color, size) => {
      cartStore.setValue((prev) =>
        prev.filter((line) => !sameLine(line, productId, color, size)),
      );
    },
    [],
  );

  const updateQuantity = useCallback<CartContextValue["updateQuantity"]>(
    (productId, color, size, quantity) => {
      cartStore.setValue((prev) => {
        if (quantity <= 0) {
          return prev.filter((line) => !sameLine(line, productId, color, size));
        }
        return prev.map((line) =>
          sameLine(line, productId, color, size) ? { ...line, quantity } : line,
        );
      });
    },
    [],
  );

  const clearCart = useCallback(() => cartStore.setValue([]), []);

  const cartCount = useMemo(
    () => items.reduce((sum, line) => sum + line.quantity, 0),
    [items],
  );

  const totalAmount = useMemo(
    () => items.reduce((sum, line) => sum + line.quantity * line.price, 0),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      cartCount,
      totalAmount,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      isDrawerOpen,
      openCartDrawer,
      closeCartDrawer,
    }),
    [
      items,
      cartCount,
      totalAmount,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      isDrawerOpen,
      openCartDrawer,
      closeCartDrawer,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
