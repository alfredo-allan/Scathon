"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { getInventory, type InventoryItem } from "@/lib/inventory";

/**
 * Estoque real do catálogo (ver `@/lib/inventory`'s doc comment) - usado
 * por `<AdminInventoryTab/>` e `<AdminOverviewTab/>` (pro total de "estoque
 * baixo"), ambos admin-only. `reload()` é exposto pra quem muda um saldo
 * (`setStockFor`/`adjustStockFor`) atualizar a lista depois.
 *
 * O `catch` abaixo evita o mesmo bug corrigido em `useSavedAddresses`: sem
 * ele, qualquer falha (token expirado, rede fora do ar) virava uma promise
 * rejeitada sem tratamento (`unhandledRejection` no console).
 */
export function useInventory() {
  const { token, isAdmin } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!token || !isAdmin) {
      setItems([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      setItems(await getInventory(token));
    } catch {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [token, isAdmin]);

  useEffect(() => {
    Promise.resolve().then(() => reload());
  }, [reload]);

  return { items, isLoading, reload };
}
