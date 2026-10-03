"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  // Só a PRIMEIRA carga passa por `isLoading=true` (que troca a lista
  // inteira por "Carregando estoque…" em `<AdminInventoryTab/>`). Sem isso,
  // cada `reload()` chamado depois de um +/- ou recontagem (ver
  // `InventoryRow`) reacionava o mesmo "Carregando…" por uma fração de
  // segundo - a lista inteira desmontava e remontava a cada clique, dando a
  // impressão de a tela "recarregar" sozinha (bug relatado pelo Alfredo). Um
  // `reload()` em segundo plano agora mantém a lista atual na tela até os
  // dados novos chegarem; quem clicou já vê o próprio feedback de "salvando"
  // na linha (`isSaving` em `InventoryRow`), não precisa do spinner global.
  const hasLoadedOnce = useRef(false);

  const reload = useCallback(async () => {
    if (!token || !isAdmin) {
      setItems([]);
      setIsLoading(false);
      return;
    }
    if (!hasLoadedOnce.current) setIsLoading(true);
    try {
      setItems(await getInventory(token));
    } catch {
      setItems([]);
    } finally {
      setIsLoading(false);
      hasLoadedOnce.current = true;
    }
  }, [token, isAdmin]);

  useEffect(() => {
    Promise.resolve().then(() => reload());
  }, [reload]);

  return { items, isLoading, reload };
}
