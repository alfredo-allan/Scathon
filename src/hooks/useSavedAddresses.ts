"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { getSavedAddresses, type SavedAddress } from "@/lib/addresses";

/**
 * Endereços salvos do cliente logado - real contra o backend agora (ver
 * `@/lib/addresses`'s doc comment), por isso virou um fetch assíncrono em
 * vez de um `useSyncExternalStore` sobre `localStorage`. `reload()` é
 * exposto pra quem chama `saveAddress`/`removeAddress`/`updateAddress`
 * atualizar a lista depois de uma mutação bem-sucedida - não há mais um
 * store compartilhado que se atualiza sozinho.
 *
 * O `catch` abaixo (sem ele antes, era um bug real: uma falha aqui -
 * incluindo um token expirado/inválido, 401 que `@/lib/apiClient` já trata
 * em separado disparando `SESSION_EXPIRED_EVENT` - virava uma promise
 * rejeitada sem ninguém pra pegar, estourando como `unhandledRejection` no
 * console do navegador) deixa a lista simplesmente vazia em vez de travar -
 * consistente com o resto do app (ex.: `<AccountOrdersView/>`'s `loadOrders`),
 * que sempre trata falha de fetch sem deixar escapar uma rejeição solta.
 */
export function useSavedAddresses() {
  const { token } = useAuth();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      setAddresses(await getSavedAddresses(token));
    } catch {
      setAddresses([]);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    // Mesmo idioma de `<AccountOrdersView/>`'s `loadOrders` - adia a
    // primeira chamada pra fora da passada síncrona do efeito
    // (`react-hooks/set-state-in-effect`).
    Promise.resolve().then(() => reload());
  }, [reload]);

  return { addresses, isLoading, reload };
}
