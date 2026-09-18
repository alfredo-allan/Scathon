"use client";

import {
  createContext,
  useCallback,
  useMemo,
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
    }),
    [items, cartCount, totalAmount, addItem, removeItem, updateQuantity, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
