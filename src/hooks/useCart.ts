"use client";

import { useContext } from "react";
import { CartContext } from "@/context/CartContext";

/**
 * Access cart state and actions (add/remove items, quantities, totals).
 * Must be used within a <CartProvider>.
 */
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
