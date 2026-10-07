"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { resolveMediaUrl } from "@/lib/apiClient";
import { getAdminCustomers, type AdminCustomer } from "@/lib/adminCustomers";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

/**
 * Avatar circular e sutil na listagem - pedido do Alfredo (2026-10-07).
 * Mesmo padrão de fallback do `<UserAvatar/>` do header (`@/components/
 * layout/UserAvatar.tsx`): iniciais quando não há `avatarUrl`, ou quando a
 * imagem falha ao carregar (`onError`). Só vira botão/abre o lightbox
 * (`onOpen`) quando existe foto de verdade - sem foto não tem o que "ver em
 * destaque", então o círculo de iniciais fica só decorativo, sem
 * `cursor-pointer` nem handler.
 */
function CustomerAvatar({
  customer,
  onOpen,
}: {
  customer: AdminCustomer;
  onOpen: (customer: AdminCustomer) => void;
}) {
  const avatarSrc = resolveMediaUrl(customer.avatarUrl);
  const [imageFailed, setImageFailed] = useState(false);
  const initial = customer.name.charAt(0).toUpperCase();

  if (!avatarSrc || imageFailed) {
    return (
      <span
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-xs font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
      >
        {initial}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onOpen(customer)}
      aria-label={`Ver foto de ${customer.name} em destaque`}
      className="group shrink-0 rounded-full ring-1 ring-neutral-200 transition-all hover:ring-2 hover:ring-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 dark:ring-neutral-800 dark:hover:ring-neutral-600"
    >
      <Image
        src={avatarSrc}
        alt={customer.name}
        width={36}
        height={36}
        unoptimized
        onError={() => setImageFailed(true)}
        className="h-9 w-9 rounded-full object-cover transition-transform duration-200 group-hover:scale-105"
      />
    </button>
  );
}

/**
 * Lightbox - foto do cliente em destaque, fundo com opacidade
 * (`bg-neutral-950/80` + leve blur). Um modal fixo em tela cheia já é, por
 * natureza, a solução mobile aqui (não tem layout de tabela/coluna pra
 * adaptar) - os únicos cuidados extras pra toque são: botão de fechar com
 * alvo de ≥44px (`h-11 w-11`, recomendação de acessibilidade pra toque), e a
 * imagem sempre limitada a `vw`/`vh` (nunca vaza da tela, celular ou
 * desktop). Fecha ao clicar fora, no X, ou com Esc; trava o scroll do body
 * enquanto aberto pra não "vazar" o fundo rolando atrás no celular.
 */
function CustomerAvatarLightbox({
  customer,
  onClose,
}: {
  customer: AdminCustomer;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const avatarSrc = resolveMediaUrl(customer.avatarUrl);
  if (!avatarSrc) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Foto de ${customer.name}`}
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-neutral-950/80 p-4 backdrop-blur-sm"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-6 sm:top-6"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      </button>

      {/* `stopPropagation` aqui - senão clicar na própria foto "vaza" pro
          backdrop e fecha o lightbox junto, já que os dois são o mesmo
          elemento clicável em cascata. */}
      <figure onClick={(event) => event.stopPropagation()} className="flex flex-col items-center gap-3">
        <Image
          src={avatarSrc}
          alt={customer.name}
          width={480}
          height={480}
          unoptimized
          className="max-h-[75vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl sm:max-h-[80vh] sm:max-w-[70vw]"
        />
        <figcaption className="text-sm font-medium text-white/90">{customer.name}</figcaption>
      </figure>
    </div>
  );
}

/**
 * "Clientes" tab: clientes reais cadastrados (`GET /api/v1/admin/customers`
 * - ver `@/lib/adminCustomers`), com `ordersCount`/`totalSpent` já
 * agregados pelo backend.
 */
export function AdminCustomersTab() {
  const { token } = useAuth();
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lightboxCustomer, setLightboxCustomer] = useState<AdminCustomer | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      setCustomers(await getAdminCustomers(token));
    } catch {
      setErrorMessage("Não foi possível carregar os clientes agora.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    Promise.resolve().then(() => load());
  }, [load]);

  const sortedCustomers = useMemo(() => [...customers].sort((a, b) => b.totalSpent - a.totalSpent), [customers]);

  if (isLoading) {
    return <p className="text-sm text-neutral-500 dark:text-neutral-400">Carregando clientes…</p>;
  }

  if (errorMessage) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
        <button
          type="button"
          onClick={load}
          className="text-xs font-semibold uppercase tracking-widest text-neutral-900 underline underline-offset-4 dark:text-neutral-100"
        >
          Tentar de novo
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-app border border-neutral-200 dark:border-neutral-800">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-[10px] font-semibold uppercase tracking-widest text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Contato</th>
              <th className="px-4 py-3">Localização</th>
              <th className="px-4 py-3">Cliente desde</th>
              <th className="px-4 py-3 text-right">Pedidos</th>
              <th className="px-4 py-3 text-right">Total gasto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
            {sortedCustomers.map((customer) => (
              <tr key={customer.email}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <CustomerAvatar customer={customer} onOpen={setLightboxCustomer} />
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">{customer.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                  <p>{customer.email}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-500">{customer.phone ?? "—"}</p>
                </td>
                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                  {customer.city ? `${customer.city}/${customer.state}` : "—"}
                </td>
                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                  {dateFormatter.format(new Date(customer.joinedAt))}
                </td>
                <td className="px-4 py-3 text-right text-neutral-900 dark:text-neutral-100">{customer.ordersCount}</td>
                <td className="px-4 py-3 text-right font-medium text-neutral-900 dark:text-neutral-100">
                  {currencyFormatter.format(customer.totalSpent)}
                </td>
              </tr>
            ))}
            {sortedCustomers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
                  Nenhum cliente cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {lightboxCustomer && (
        <CustomerAvatarLightbox customer={lightboxCustomer} onClose={() => setLightboxCustomer(null)} />
      )}
    </>
  );
}
