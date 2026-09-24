"use client";

import Image from "next/image";
import type { CartItem } from "@/types";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

interface CartLineItemProps {
  item: CartItem;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
  /**
   * Slightly smaller thumbnail/spacing for tighter spaces like
   * `<CartDrawer/>`'s narrower pane. Defaults to false, matching
   * `<CartView/>`'s original (roomier) sizing on the full `/cart` page.
   */
  compact?: boolean;
}

/**
 * One cart line - thumbnail, title, color/size, price, quantity stepper,
 * remove - shared between the full `/cart` page (`<CartView/>`) and the
 * mini-cart `<CartDrawer/>` so both always render a product line
 * identically instead of two hand-kept-in-sync copies of the same markup.
 */
export function CartLineItem({ item, onIncrease, onDecrease, onRemove, compact = false }: CartLineItemProps) {
  return (
    <div className={`flex gap-4 ${compact ? "py-4" : "py-5"}`}>
      <div
        className={`relative shrink-0 overflow-hidden bg-neutral-200 dark:bg-neutral-800 ${
          compact ? "h-24 w-[72px]" : "h-28 w-[88px]"
        }`}
      >
        <Image
          src={item.imageUrl}
          alt={item.title}
          fill
          unoptimized
          sizes={compact ? "72px" : "88px"}
          className="object-cover"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{item.title}</p>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            Cor: {item.color} · Tam: {item.size}
          </p>
          <p className="mt-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {currencyFormatter.format(item.price)}
          </p>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center border border-neutral-300 dark:border-neutral-700">
            <button
              type="button"
              aria-label={`Diminuir quantidade de ${item.title}`}
              onClick={onDecrease}
              className="flex h-8 w-8 items-center justify-center text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900"
            >
              −
            </button>
            <span className="w-8 text-center text-sm text-neutral-900 dark:text-neutral-100">{item.quantity}</span>
            <button
              type="button"
              aria-label={`Aumentar quantidade de ${item.title}`}
              onClick={onIncrease}
              className="flex h-8 w-8 items-center justify-center text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-neutral-500 underline underline-offset-2 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            Remover
          </button>
        </div>
      </div>
    </div>
  );
}
