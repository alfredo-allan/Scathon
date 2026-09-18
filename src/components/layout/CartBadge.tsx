"use client";

import Link from "next/link";
import { useCart } from "@/hooks/useCart";

/**
 * Cart trigger showing the total item count as an active counter badge.
 */
export function CartBadge() {
  const { cartCount } = useCart();

  return (
    <Link href="/cart" aria-label={`Cart, ${cartCount} items`} className="relative flex items-center justify-center">
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
        <path
          d="M6 8h12l-1 12H7L6 8Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M9 8V6a3 3 0 0 1 6 0v2"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
      {cartCount > 0 && (
        <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-neutral-900 dark:bg-neutral-100 px-1 text-[10px] font-semibold leading-none text-neutral-100 dark:text-neutral-900">
          {cartCount > 99 ? "99+" : cartCount}
        </span>
      )}
    </Link>
  );
}
