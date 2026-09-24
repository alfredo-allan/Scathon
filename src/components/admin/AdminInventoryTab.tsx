"use client";

import Image from "next/image";
import { useState } from "react";
import { products } from "@/data/products";
import { useInventory } from "@/hooks/useInventory";
import { adjustStockFor, setStockFor } from "@/lib/inventory";
import { LOW_STOCK_THRESHOLD } from "./adminShared";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/**
 * "Estoque" tab: every catalog product with its current quantity
 * (`@/lib/inventory`, a small persisted mock - no warehouse backend yet).
 * Editable inline (+/- steppers, or type an exact recount) so the panel
 * demonstrates the real interaction, not just a read-only number.
 */
export function AdminInventoryTab() {
  const stock = useInventory();
  const lowStockCount = products.filter((product) => (stock[product.slug] ?? 0) <= LOW_STOCK_THRESHOLD).length;

  return (
    <div className="flex flex-col gap-4">
      {lowStockCount > 0 && (
        <p className="rounded-app border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
          {lowStockCount} {lowStockCount === 1 ? "produto está" : "produtos estão"} com estoque em {LOW_STOCK_THRESHOLD} unidades ou menos.
        </p>
      )}

      <div className="flex flex-col divide-y divide-neutral-100 rounded-app border border-neutral-200 dark:divide-neutral-900 dark:border-neutral-800">
        {products.map((product) => (
          <InventoryRow key={product.id} slug={product.slug} title={product.title} imageUrl={product.coverImage ?? product.imageUrl} price={product.price} quantity={stock[product.slug] ?? 0} />
        ))}
      </div>
    </div>
  );
}

function InventoryRow({
  slug,
  title,
  imageUrl,
  price,
  quantity,
}: {
  slug: string;
  title: string;
  imageUrl: string;
  price: number;
  quantity: number;
}) {
  const [draft, setDraft] = useState(String(quantity));
  // Keeps the typed field in sync whenever the store's real value changes -
  // from the +/- steppers below, or this same slug being edited elsewhere
  // (another open tab sharing the same localStorage) - using React's
  // "adjust state during render" pattern rather than an Effect (which
  // would commit the old value for a frame before correcting itself).
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevQuantity, setPrevQuantity] = useState(quantity);
  if (quantity !== prevQuantity) {
    setPrevQuantity(quantity);
    setDraft(String(quantity));
  }

  const isLow = quantity <= LOW_STOCK_THRESHOLD;

  function commitDraft() {
    const parsed = Number(draft);
    if (Number.isFinite(parsed)) {
      setStockFor(slug, parsed);
    } else {
      setDraft(String(quantity));
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3">
      <span className="relative block h-14 w-11 shrink-0 overflow-hidden rounded-app bg-neutral-200 dark:bg-neutral-800">
        <Image src={imageUrl} alt={title} fill unoptimized sizes="44px" className="object-cover" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-neutral-900 dark:text-neutral-100">{title}</p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">{currencyFormatter.format(price)}</p>
      </div>

      {isLow && (
        <span className="shrink-0 rounded-app border border-amber-300 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-amber-700 dark:border-amber-900 dark:text-amber-400">
          {quantity === 0 ? "Esgotado" : "Estoque baixo"}
        </span>
      )}

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => adjustStockFor(slug, -1)}
          disabled={quantity === 0}
          aria-label="Remover uma unidade"
          className="flex h-7 w-7 items-center justify-center rounded-app border border-neutral-300 text-neutral-700 transition-colors hover:border-neutral-500 disabled:opacity-30 dark:border-neutral-700 dark:text-neutral-300"
        >
          −
        </button>
        <input
          type="text"
          inputMode="numeric"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commitDraft}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
          className="w-14 rounded-app border border-neutral-300 bg-transparent px-2 py-1 text-center text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:focus:border-neutral-100"
        />
        <button
          type="button"
          onClick={() => adjustStockFor(slug, 1)}
          aria-label="Adicionar uma unidade"
          className="flex h-7 w-7 items-center justify-center rounded-app border border-neutral-300 text-neutral-700 transition-colors hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-300"
        >
          +
        </button>
      </div>
    </div>
  );
}
