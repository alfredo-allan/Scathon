"use client";

import Image from "next/image";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useInventory } from "@/hooks/useInventory";
import { adjustStockFor, setStockFor, type InventoryItem } from "@/lib/inventory";
import { LOW_STOCK_THRESHOLD } from "./adminShared";

/**
 * "Estoque" tab: saldo real de cada produto (`GET /api/v1/admin/inventory` -
 * ver `@/lib/inventory`/`useInventory`). Editável inline (+/- steppers, ou
 * digitar um recontagem exata), igual antes - só que agora toda edição
 * grava de verdade (`PATCH /admin/products/{id}/inventory`) e recarrega a
 * lista, em vez de escrever num objeto em `localStorage`.
 */
export function AdminInventoryTab() {
  const { token } = useAuth();
  const { items, isLoading, reload } = useInventory();
  const lowStockCount = items.filter((item) => item.lowStock).length;

  if (isLoading) {
    return <p className="text-sm text-neutral-500 dark:text-neutral-400">Carregando estoque…</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {lowStockCount > 0 && (
        <p className="rounded-app border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
          {lowStockCount} {lowStockCount === 1 ? "produto está" : "produtos estão"} com estoque em {LOW_STOCK_THRESHOLD} unidades ou menos.
        </p>
      )}

      <div className="flex flex-col divide-y divide-neutral-100 rounded-app border border-neutral-200 dark:divide-neutral-900 dark:border-neutral-800">
        {items.map((item) => (
          <InventoryRow key={item.productId} item={item} token={token} onChanged={reload} />
        ))}
        {items.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
            Nenhum produto no catálogo ainda.
          </p>
        )}
      </div>
    </div>
  );
}

function InventoryRow({
  item,
  token,
  onChanged,
}: {
  item: InventoryItem;
  token: string | null;
  onChanged: () => void;
}) {
  const [draft, setDraft] = useState(String(item.quantity));
  const [isSaving, setIsSaving] = useState(false);
  // Keeps the typed field in sync whenever the fetched value changes (after
  // a +/- stepper, or a manual recount committed elsewhere) - React's
  // "adjust state during render" pattern rather than an Effect.
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevQuantity, setPrevQuantity] = useState(item.quantity);
  if (item.quantity !== prevQuantity) {
    setPrevQuantity(item.quantity);
    setDraft(String(item.quantity));
  }

  const isLow = item.lowStock;

  async function commitDraft() {
    const parsed = Number(draft);
    if (!token || !Number.isFinite(parsed)) {
      setDraft(String(item.quantity));
      return;
    }
    setIsSaving(true);
    try {
      await setStockFor(token, item.productId, parsed);
      onChanged();
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAdjust(delta: number) {
    if (!token) return;
    setIsSaving(true);
    try {
      await adjustStockFor(token, item.productId, delta);
      onChanged();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3">
      <span className="relative block h-14 w-11 shrink-0 overflow-hidden rounded-app bg-neutral-200 dark:bg-neutral-800">
        {item.imageUrl && (
          <Image src={item.imageUrl} alt={item.title} fill unoptimized sizes="44px" className="object-cover" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-neutral-900 dark:text-neutral-100">{item.title}</p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">{item.slug}</p>
      </div>

      {isLow && (
        <span className="shrink-0 rounded-app border border-amber-300 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-amber-700 dark:border-amber-900 dark:text-amber-400 md:text-xs">
          {item.quantity === 0 ? "Esgotado" : "Estoque baixo"}
        </span>
      )}

      <div className="flex shrink-0 items-center gap-2 md:gap-3">
        {/* Spinner inline (não troca a lista inteira por um "Carregando…" -
            ver o doc comment de `reload()` em `useInventory`) - some sozinho
            assim que `onChanged()` (o `reload()` em segundo plano) termina. */}
        {isSaving && (
          <span
            aria-hidden
            className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-700 dark:border-neutral-700 dark:border-t-neutral-300"
          />
        )}
        <button
          type="button"
          onClick={() => handleAdjust(-1)}
          disabled={item.quantity === 0 || isSaving}
          aria-label="Remover uma unidade"
          className="flex h-7 w-7 items-center justify-center rounded-app border border-neutral-300 text-neutral-700 transition-colors hover:border-neutral-500 disabled:opacity-30 dark:border-neutral-700 dark:text-neutral-300 md:h-9 md:w-9 md:text-lg"
        >
          −
        </button>
        <input
          type="text"
          inputMode="numeric"
          value={draft}
          disabled={isSaving}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commitDraft}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
          className="w-14 rounded-app border border-neutral-300 bg-transparent px-2 py-1 text-center text-sm outline-none focus:border-neutral-900 disabled:opacity-50 dark:border-neutral-700 dark:focus:border-neutral-100 md:w-16 md:py-1.5 md:text-base"
        />
        <button
          type="button"
          onClick={() => handleAdjust(1)}
          disabled={isSaving}
          aria-label="Adicionar uma unidade"
          className="flex h-7 w-7 items-center justify-center rounded-app border border-neutral-300 text-neutral-700 transition-colors hover:border-neutral-500 disabled:opacity-30 dark:border-neutral-700 dark:text-neutral-300 md:h-9 md:w-9 md:text-lg"
        >
          +
        </button>
      </div>
    </div>
  );
}
