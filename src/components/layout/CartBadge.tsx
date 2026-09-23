"use client";

import Link from "next/link";
import { useCart } from "@/hooks/useCart";

/**
 * Cart trigger showing the total item count as an active counter badge.
 * Links to `/cart`, now that a real cart page exists (see `<CartView/>`).
 */
export function CartBadge() {
  const { cartCount } = useCart();

  return (
    <Link href="/cart" aria-label={`Carrinho, ${cartCount} ${cartCount === 1 ? "item" : "itens"}`} className="relative flex items-center justify-center">
      {/* Shopping cart (not a bag) - same path as <FloatingDock/>'s cart
          icon, so the two read as the same symbol everywhere it shows up. */}
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121 0 2.085-.758 2.348-1.85l1.3-5.419A1.125 1.125 0 0 0 20.316 5.75H5.106M7.5 14.25l-1.002-4.008" />
        <circle cx="7.5" cy="19.5" r="1.15" fill="currentColor" />
        <circle cx="18" cy="19.5" r="1.15" fill="currentColor" />
      </svg>
      {cartCount > 0 && (
        <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-neutral-900 dark:bg-neutral-100 px-1 text-[10px] font-semibold leading-none text-neutral-100 dark:text-neutral-900">
          {cartCount > 99 ? "99+" : cartCount}
        </span>
      )}
    </Link>
  );
}
