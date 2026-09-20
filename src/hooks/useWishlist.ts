"use client";

import { useContext } from "react";
import { WishlistContext } from "@/context/WishlistContext";

/**
 * Access saved/favorited product ids and the toggle to save or unsave one.
 * Must be used within a <WishlistProvider>.
 */
export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
