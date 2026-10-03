"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { searchableCatalog } from "@/lib/products";
import { getRecentOrders, type Order } from "@/lib/orders";
import { getMyReviews, type OwnReview } from "@/lib/reviews";
import { ApiError } from "@/lib/apiClient";
import { ProductCard } from "@/components/product/ProductCard";
import { OrderReviewForm } from "./OrderReviewForm";
import type { Product } from "@/types";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const STATUS_LABEL: Record<Order["status"], string> = {
  processando: "Processando",
  "a caminho": "A caminho",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

const STATUS_STYLE: Record<Order["status"], string> = {
  processando: "border-neutral-300 text-neutral-600 dark:border-neutral-700 dark:text-neutral-400",
  "a caminho": "border-neutral-900 text-neutral-900 dark:border-neutral-100 dark:text-neutral-100",
  entregue: "border-neutral-300 bg-neutral-900 text-neutral-50 dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950",
  cancelado: "border-red-300 text-red-600 dark:border-red-900 dark:text-red-400",
};

/**
 * `/account/orders` page body: o histórico de pedidos REAL do cliente
 * logado (`GET /api/v1/me/orders` - ver `@/lib/orders`, que já era o
 * substituto planejado desde a Fase 5 do backend), um espaço pra avaliar um
 * produto direto do pedido que o comprou (`<OrderReviewForm/>`, também real
 * agora - `@/lib/reviews`), e um carrossel leve de produtos novos pra voltar
 * depois. Antes disso, tanto os pedidos quanto as avaliações eram mock
 * (`localStorage`) e idênticos pra qualquer sessão - agora que o login é
 * real (`@/lib/auth`), cada cliente vê só os próprios pedidos e só pode
 * avaliar o que realmente comprou e recebeu.
 */
export function AccountOrdersView() {
  const { token, isAuthenticated } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [myReviews, setMyReviews] = useState<Record<string, OwnReview>>({});
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    if (!token) {
      setOrders([]);
      setMyReviews({});
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [fetchedOrders, fetchedReviews, fetchedCatalog] = await Promise.all([
        getRecentOrders(token),
        getMyReviews(token),
        searchableCatalog(),
      ]);
      setOrders(fetchedOrders);
      setMyReviews(Object.fromEntries(fetchedReviews.map((review) => [review.productId, review])));
      setCatalog(fetchedCatalog);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : "Não foi possível carregar seus pedidos agora. Tente novamente em instantes.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    // `loadOrders` sets state (`setIsLoading`, etc.) synchronously before its
    // first `await` - calling it directly here would run that first inside
    // the effect's own render pass (`react-hooks/set-state-in-effect`).
    // Deferring the call itself to a microtask, same idiom as
    // `<ProductDetail/>`'s own review fetch (`.then()`, never a bare
    // top-level `await`), keeps every state update safely outside the
    // effect's synchronous execution.
    Promise.resolve().then(() => loadOrders());
  }, [loadOrders]);

  function handleReviewSubmitted(review: OwnReview) {
    setMyReviews((current) => ({ ...current, [review.productId]: review }));
  }

  // "Novos produtos" here means "stuff this customer hasn't bought yet"
  // rather than the catalog's `isNew` flag. `catalog` vem de
  // `searchableCatalog()` (`@/lib/products`, o mesmo cache de 60s do
  // cliente usado por `<SearchOverlay/>`) - busca junto com os pedidos em
  // `loadOrders`, não mais o array estático em `@/data/products`.
  const suggestions = useMemo(() => {
    const orderedSlugs = new Set(orders.flatMap((order) => order.items.map((item) => item.slug)));
    return catalog.filter((product) => !orderedSlugs.has(product.slug));
  }, [orders, catalog]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Você precisa entrar pra ver seus pedidos.
        </p>
        <Link
          href="/login"
          className="rounded-app bg-neutral-950 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-neutral-50 transition-opacity hover:opacity-85 dark:bg-neutral-100 dark:text-neutral-950"
        >
          Entrar
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 py-6">
      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-neutral-900 dark:hover:text-neutral-100">
              Página Inicial
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-neutral-900 dark:text-neutral-100">Meus Pedidos</li>
        </ol>
      </nav>

      <h1 className="text-xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50 md:text-2xl">
        Meus Pedidos
      </h1>

      {isLoading ? (
        <p className="mt-8 text-sm text-neutral-500 dark:text-neutral-400">Carregando seus pedidos…</p>
      ) : errorMessage ? (
        <div className="mt-8 flex flex-col items-start gap-3">
          <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
          <button
            type="button"
            onClick={loadOrders}
            className="text-xs font-semibold uppercase tracking-widest text-neutral-900 underline underline-offset-4 dark:text-neutral-100"
          >
            Tentar de novo
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Você ainda não fez nenhum pedido.
          </p>
          <Link
            href="/"
            className="text-xs font-semibold uppercase tracking-widest text-neutral-900 underline underline-offset-4 dark:text-neutral-100"
          >
            Ver produtos
          </Link>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          {orders.map((order) => (
            <div key={order.id} className="border border-neutral-200 dark:border-neutral-800">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
                    Pedido {order.id}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                    {dateFormatter.format(new Date(order.placedAt))}
                  </p>
                </div>
                <span
                  className={`border px-2 py-1 text-[10px] font-semibold uppercase tracking-widest ${STATUS_STYLE[order.status]}`}
                >
                  {STATUS_LABEL[order.status]}
                </span>
              </div>

              <div className="flex flex-col divide-y divide-neutral-100 dark:divide-neutral-900">
                {order.items.map((item, index) => (
                  <div key={`${order.id}-${index}`} className="flex gap-3 px-4 py-4">
                    <Link
                      href={`/shop/${item.category}/${item.slug}`}
                      className="relative block h-20 w-16 shrink-0 overflow-hidden bg-neutral-200 dark:bg-neutral-800"
                    >
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        unoptimized
                        sizes="64px"
                        className="object-cover"
                      />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/shop/${item.category}/${item.slug}`}
                        className="text-sm font-medium text-neutral-900 hover:underline dark:text-neutral-100"
                      >
                        {item.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                        Cor: {item.color} · Tam: {item.size}
                        {item.quantity > 1 ? ` · Qtd: ${item.quantity}` : ""}
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-neutral-900 dark:text-neutral-100">
                        {currencyFormatter.format(item.price * item.quantity)}
                      </p>

                      {order.status === "entregue" && (
                        <OrderReviewForm
                          slug={item.slug}
                          title={item.title}
                          existingReview={myReviews[item.productId] ?? null}
                          onSubmitted={handleReviewSubmitted}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="mt-12">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
            Novidades pra você
          </h2>
          <div className="mt-4 flex snap-x gap-3 overflow-x-auto pb-2">
            {suggestions.map((product) => (
              <div key={product.id} className="w-40 shrink-0 snap-start sm:w-48">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
