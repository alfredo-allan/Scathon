"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { resolveMediaUrl } from "@/lib/apiClient";
import { getAdminCustomers, getCustomerOrders, type AdminCustomer } from "@/lib/adminCustomers";
import type { AdminOrder } from "@/lib/adminOrders";
import { ImageLightbox, ORDER_STATUS_LABEL, ORDER_STATUS_STYLE } from "./adminShared";

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
 *
 * `stopPropagation` no clique - a partir de 2026-10-08 a LINHA inteira
 * também é clicável (abre o painel de detalhes do cliente), então sem isso
 * clicar no avatar abriria os dois ao mesmo tempo (o clique "vaza" pro `tr`
 * por baixo).
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
      onClick={(event) => {
        event.stopPropagation();
        onOpen(customer);
      }}
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
 * Painel de detalhes do cliente - pedido do Alfredo (2026-10-08): clicar num
 * cliente pra "examinar os últimos pedidos e todos os dados dele", sem
 * precisar ir pra aba "Pedidos" caçar por nome.
 *
 * Solução mobile/desktop num componente só: em telas pequenas sobe como uma
 * folha no rodapé (`items-end` + `rounded-t-2xl`, `max-h-[85vh]` com scroll
 * interno - o padrão mais comum de "ver detalhes" em app mobile, não exige
 * gesto nenhum além de tocar fora/no X pra fechar); a partir de `sm` vira um
 * painel lateral fixo (`sm:inset-y-0 sm:w-full sm:max-w-md`), mais
 * apropriado pra tela larga do que ocupar o centro inteiro. Mesmo
 * fundo-com-opacidade + trava de scroll do `<ImageLightbox/>` (`adminShared`).
 */
function CustomerDetailDrawer({
  customer,
  token,
  onClose,
  onOpenPhoto,
}: {
  customer: AdminCustomer;
  token: string | null;
  onClose: () => void;
  onOpenPhoto: (customer: AdminCustomer) => void;
}) {
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    getCustomerOrders(token, customer.email)
      .then((items) => {
        if (!cancelled) setOrders(items);
      })
      .catch(() => {
        if (!cancelled) setErrorMessage("Não foi possível carregar os pedidos desse cliente agora.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, customer.email]);

  const avatarSrc = resolveMediaUrl(customer.avatarUrl);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Detalhes de ${customer.name}`}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-neutral-950/60 sm:items-stretch sm:justify-end"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white dark:bg-neutral-950 sm:h-full sm:max-h-none sm:w-full sm:max-w-md sm:rounded-none sm:rounded-l-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-neutral-200 p-5 dark:border-neutral-800">
          <div className="flex min-w-0 items-center gap-3">
            {avatarSrc ? (
              <button
                type="button"
                onClick={() => onOpenPhoto(customer)}
                aria-label={`Ver foto de ${customer.name} em destaque`}
                className="shrink-0 rounded-full ring-1 ring-neutral-200 transition-all hover:ring-2 hover:ring-neutral-400 dark:ring-neutral-800"
              >
                <Image
                  src={avatarSrc}
                  alt={customer.name}
                  width={56}
                  height={56}
                  unoptimized
                  className="h-14 w-14 rounded-full object-cover"
                />
              </button>
            ) : (
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-lg font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                {customer.name.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-neutral-900 dark:text-neutral-100">
                {customer.name}
              </p>
              <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">{customer.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-900"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-app border border-neutral-200 p-3 dark:border-neutral-800">
              <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{customer.ordersCount}</p>
              <p className="text-[10px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Pedidos</p>
            </div>
            <div className="rounded-app border border-neutral-200 p-3 dark:border-neutral-800">
              <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {currencyFormatter.format(customer.totalSpent)}
              </p>
              <p className="text-[10px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                Total gasto
              </p>
            </div>
            <div className="rounded-app border border-neutral-200 p-3 dark:border-neutral-800">
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {dateFormatter.format(new Date(customer.joinedAt))}
              </p>
              <p className="text-[10px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                Cliente desde
              </p>
            </div>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-[10px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                Telefone
              </dt>
              <dd className="text-neutral-900 dark:text-neutral-100">{customer.phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                Localização
              </dt>
              <dd className="text-neutral-900 dark:text-neutral-100">
                {customer.city ? `${customer.city}/${customer.state}` : "—"}
              </dd>
            </div>
          </dl>

          <div className="mt-6">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
              Últimos pedidos
            </p>

            {isLoading && <p className="text-sm text-neutral-500 dark:text-neutral-400">Carregando pedidos…</p>}
            {errorMessage && <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>}
            {!isLoading && !errorMessage && orders?.length === 0 && (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Esse cliente ainda não fez nenhum pedido.
              </p>
            )}

            <div className="flex flex-col gap-3">
              {orders?.map((order) => (
                <div key={order.id} className="rounded-app border border-neutral-200 p-3 dark:border-neutral-800">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
                      {order.id}
                    </p>
                    <span
                      className={`rounded-app border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${ORDER_STATUS_STYLE[order.status]}`}
                    >
                      {ORDER_STATUS_LABEL[order.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    {dateFormatter.format(new Date(order.placedAt))} · {order.items.length} item(ns)
                  </p>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-neutral-600 dark:text-neutral-400">
                      {order.trackingCode ? `Rastreio: ${order.trackingCode}` : "Sem rastreio"}
                    </span>
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {currencyFormatter.format((order.payment?.grossAmount ?? 0) + order.shippingCost)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
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
  const [detailCustomer, setDetailCustomer] = useState<AdminCustomer | null>(null);

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
              <tr
                key={customer.email}
                onClick={() => setDetailCustomer(customer)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setDetailCustomer(customer);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Ver detalhes de ${customer.name}`}
                className="cursor-pointer transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:bg-neutral-50 dark:hover:bg-neutral-900/60 dark:focus-visible:bg-neutral-900/60"
              >
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

      {detailCustomer && (
        <CustomerDetailDrawer
          customer={detailCustomer}
          token={token}
          onClose={() => setDetailCustomer(null)}
          onOpenPhoto={setLightboxCustomer}
        />
      )}

      {lightboxCustomer && resolveMediaUrl(lightboxCustomer.avatarUrl) && (
        <ImageLightbox
          src={resolveMediaUrl(lightboxCustomer.avatarUrl)!}
          alt={`Foto de ${lightboxCustomer.name}`}
          caption={lightboxCustomer.name}
          onClose={() => setLightboxCustomer(null)}
        />
      )}
    </>
  );
}
