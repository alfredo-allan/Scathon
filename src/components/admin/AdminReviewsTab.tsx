"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getAdminOrders, type AdminOrder, type AdminOrderItem } from "@/lib/adminOrders";
import {
  createReviewInvite,
  deleteReview,
  getAdminReviews,
  getReviewInvites,
  setReviewHidden,
  type AdminReview,
  type AdminReviewInvite,
  type ReviewInviteStatus,
} from "@/lib/adminReviews";
import { ApiError } from "@/lib/apiClient";
import { listProducts } from "@/lib/products";
import type { Product } from "@/types";
import { ImageLightbox, normalizeSearchText } from "./adminShared";

/**
 * Aba "Avaliações" do painel admin - pedido do Alfredo, 2026-10-11: "no
 * painel de admin eu quero uma parte para administrar os comentários, e
 * uma parte mais especifica aonde manda link [...] para o admin enviar
 * para o cliente o link para ele somente postar o comentário". Duas
 * seções: gerar/acompanhar convites (sem login) e administrar (apagar)
 * avaliações existentes.
 *
 * O formulário de avaliação de dentro da conta (login + compra verificada,
 * `<OrderReviewForm/>`) não muda em nada - esta aba é só o painel de
 * administração do que já existe + o caminho novo, adicional.
 */

const INVITE_STATUS_LABEL: Record<ReviewInviteStatus, string> = {
  pending: "Pendente",
  used: "Usado",
  expired: "Expirado",
};

const INVITE_STATUS_STYLE: Record<ReviewInviteStatus, string> = {
  pending: "border-neutral-900 text-neutral-900 dark:border-neutral-100 dark:text-neutral-100",
  used: "border-neutral-300 bg-neutral-900 text-neutral-50 dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950",
  expired: "border-red-300 text-red-600 dark:border-red-900 dark:text-red-400",
};

function Stars({ rating }: { rating: number }) {
  return (
    <span aria-hidden className="flex text-sm text-neutral-900 dark:text-neutral-100">
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index}>{index < rating ? "★" : "☆"}</span>
      ))}
    </span>
  );
}

type InviteMode = "order" | "product";

/**
 * Seção "Gerar link de avaliação" - dois modos (pedido do Alfredo,
 * 2026-10-11, segunda rodada da mesma conversa: "tem clientes que ainda não
 * tem cadastro no site"):
 *
 * - "Por pedido" (o original): o admin busca o pedido (mesmo padrão de
 *   busca por cliente/nº do pedido de `<AdminOrdersTab/>`) e escolhe o item
 *   exato dentro dele - link específico daquele pedido+produto.
 * - "Por produto": pra cliente sem conta/pedido no site - o admin escolhe
 *   só o produto (busca no catálogo inteiro, igual `<AdminProductsTab/>`);
 *   quem recebe o link digita o próprio nome além de avaliar.
 */
function GenerateInviteSection({ token }: { token: string }) {
  const [mode, setMode] = useState<InviteMode>("order");

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [generatingItemId, setGeneratingItemId] = useState<number | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [generatingProductId, setGeneratingProductId] = useState<string | null>(null);

  const [generateError, setGenerateError] = useState<string | null>(null);
  const [lastGeneratedLink, setLastGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [invites, setInvites] = useState<AdminReviewInvite[]>([]);
  const [isLoadingInvites, setIsLoadingInvites] = useState(true);

  useEffect(() => {
    getAdminOrders(token)
      .then(setOrders)
      .catch(() => {})
      .finally(() => setIsLoadingOrders(false));
  }, [token]);

  useEffect(() => {
    listProducts({ perPage: 100 })
      .then(setProducts)
      .catch(() => {})
      .finally(() => setIsLoadingProducts(false));
  }, []);

  const loadInvites = useCallback(() => {
    setIsLoadingInvites(true);
    getReviewInvites(token)
      .then(setInvites)
      .catch(() => {})
      .finally(() => setIsLoadingInvites(false));
  }, [token]);

  useEffect(() => {
    loadInvites();
  }, [loadInvites]);

  const filteredOrders = useMemo(() => {
    const query = normalizeSearchText(orderSearchQuery.trim());
    if (!query) return [];
    return orders
      .filter((order) =>
        [order.id, order.customerName, order.customerEmail].some((field) => normalizeSearchText(field).includes(query)),
      )
      .slice(0, 8);
  }, [orders, orderSearchQuery]);

  const filteredProducts = useMemo(() => {
    const query = normalizeSearchText(productSearchQuery.trim());
    if (!query) return [];
    return products.filter((product) => normalizeSearchText(product.title).includes(query)).slice(0, 8);
  }, [products, productSearchQuery]);

  function resolveLink(link: string | null, inviteToken: string): string {
    return link ?? `${typeof window !== "undefined" ? window.location.origin : ""}/avaliar/${inviteToken}`;
  }

  async function handleGenerateByOrderItem(item: AdminOrderItem) {
    setGeneratingItemId(item.id);
    setGenerateError(null);
    setLastGeneratedLink(null);
    try {
      const { link, token: inviteToken } = await createReviewInvite(token, { orderItemId: item.id });
      setLastGeneratedLink(resolveLink(link, inviteToken));
      loadInvites();
    } catch (err) {
      setGenerateError(
        err instanceof ApiError ? err.message : "Não foi possível gerar o link agora - tenta de novo em instantes.",
      );
    } finally {
      setGeneratingItemId(null);
    }
  }

  async function handleGenerateByProduct(product: Product) {
    setGeneratingProductId(product.id);
    setGenerateError(null);
    setLastGeneratedLink(null);
    try {
      const { link, token: inviteToken } = await createReviewInvite(token, { productId: product.id });
      setLastGeneratedLink(resolveLink(link, inviteToken));
      loadInvites();
    } catch (err) {
      setGenerateError(
        err instanceof ApiError ? err.message : "Não foi possível gerar o link agora - tenta de novo em instantes.",
      );
    } finally {
      setGeneratingProductId(null);
    }
  }

  async function handleCopy(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard sem permissão/API indisponível - o link já está visível
      // na tela pra selecionar/copiar manualmente, então não é um erro
      // fatal, só perde a conveniência do botão.
    }
  }

  function switchMode(next: InviteMode) {
    setMode(next);
    setGenerateError(null);
    setLastGeneratedLink(null);
  }

  return (
    <div className="flex flex-col gap-4 rounded-app border border-neutral-200 p-4 dark:border-neutral-800">
      <p className="text-xs font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
        Gerar link de avaliação
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => switchMode("order")}
          className={`rounded-app border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest ${
            mode === "order"
              ? "border-neutral-950 bg-neutral-950 text-neutral-50 dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950"
              : "border-neutral-300 text-neutral-600 dark:border-neutral-700 dark:text-neutral-400"
          }`}
        >
          Por pedido
        </button>
        <button
          type="button"
          onClick={() => switchMode("product")}
          className={`rounded-app border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest ${
            mode === "product"
              ? "border-neutral-950 bg-neutral-950 text-neutral-50 dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950"
              : "border-neutral-300 text-neutral-600 dark:border-neutral-700 dark:text-neutral-400"
          }`}
        >
          Por produto
        </button>
      </div>

      {mode === "order" ? (
        <>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Busque o pedido do cliente, escolha o produto e gere um link - o cliente abre e posta a avaliação sem
            precisar logar.
          </p>

          <div className="relative w-full sm:w-96">
            <input
              type="search"
              value={orderSearchQuery}
              onChange={(event) => setOrderSearchQuery(event.target.value)}
              placeholder="Buscar por cliente ou nº do pedido"
              disabled={isLoadingOrders}
              className="w-full rounded-app border border-neutral-300 bg-transparent px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-100 dark:focus:border-neutral-100"
            />
          </div>

          {isLoadingOrders && <p className="text-xs text-neutral-500 dark:text-neutral-400">Carregando pedidos…</p>}

          {!isLoadingOrders && orderSearchQuery.trim() && filteredOrders.length === 0 && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Nenhum pedido encontrado para essa busca.</p>
          )}

          <div className="flex flex-col gap-2">
            {filteredOrders.map((order) => (
              <div key={order.id} className="overflow-hidden rounded-app border border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setExpandedOrderId((current) => (current === order.id ? null : order.id))}
                  className="flex w-full flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-left"
                >
                  <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                    Pedido {order.id} · {order.customerName}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                    {order.items.length} {order.items.length === 1 ? "item" : "itens"}
                  </span>
                </button>

                {expandedOrderId === order.id && (
                  <div className="flex flex-col gap-2 border-t border-neutral-200 p-3 dark:border-neutral-800">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-app border border-neutral-100 px-3 py-2 dark:border-neutral-800"
                      >
                        <span className="text-xs text-neutral-700 dark:text-neutral-300">
                          {item.title} · qtd {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleGenerateByOrderItem(item)}
                          disabled={generatingItemId === item.id}
                          className="rounded-app bg-neutral-950 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-50 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-950"
                        >
                          {generatingItemId === item.id ? "Gerando…" : "Gerar link"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Pra cliente que ainda não tem cadastro/pedido no site - escolha o produto, gere o link, e quem receber
            avalia (nota, comentário, Instagram opcional) e digita o próprio nome.
          </p>

          <div className="relative w-full sm:w-96">
            <input
              type="search"
              value={productSearchQuery}
              onChange={(event) => setProductSearchQuery(event.target.value)}
              placeholder="Buscar produto pelo nome"
              disabled={isLoadingProducts}
              className="w-full rounded-app border border-neutral-300 bg-transparent px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-100 dark:focus:border-neutral-100"
            />
          </div>

          {isLoadingProducts && <p className="text-xs text-neutral-500 dark:text-neutral-400">Carregando produtos…</p>}

          {!isLoadingProducts && productSearchQuery.trim() && filteredProducts.length === 0 && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Nenhum produto encontrado para essa busca.</p>
          )}

          <div className="flex flex-col gap-2">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-app border border-neutral-200 px-3 py-2.5 dark:border-neutral-800"
              >
                <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">{product.title}</span>
                <button
                  type="button"
                  onClick={() => handleGenerateByProduct(product)}
                  disabled={generatingProductId === product.id}
                  className="rounded-app bg-neutral-950 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-50 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-950"
                >
                  {generatingProductId === product.id ? "Gerando…" : "Gerar link"}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {generateError && <p className="text-xs text-red-600 dark:text-red-400">{generateError}</p>}

      {lastGeneratedLink && (
        <div className="flex flex-col gap-2 rounded-app border border-neutral-900 p-3 dark:border-neutral-100">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
            Link gerado - envie pro cliente
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 break-all rounded-app bg-neutral-100 px-2 py-1.5 text-[11px] text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100">
              {lastGeneratedLink}
            </code>
            <button
              type="button"
              onClick={() => handleCopy(lastGeneratedLink)}
              className="shrink-0 rounded-app border border-neutral-300 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-900 dark:border-neutral-700 dark:text-neutral-100"
            >
              {copied ? "Copiado!" : "Copiar"}
            </button>
          </div>
        </div>
      )}

      <div className="mt-2 border-t border-neutral-200 pt-3 dark:border-neutral-800">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
          Convites já gerados
        </p>
        {isLoadingInvites ? (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Carregando…</p>
        ) : invites.length === 0 ? (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Nenhum convite gerado ainda.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-app border border-neutral-100 px-3 py-2 text-xs dark:border-neutral-800"
              >
                <span className="text-neutral-700 dark:text-neutral-300">
                  {invite.kind === "order" ? (
                    <>Pedido {invite.orderId ?? "—"} · {invite.productTitle ?? "Produto removido"}</>
                  ) : (
                    <>Convite por produto · {invite.productTitle ?? "Produto removido"}</>
                  )}
                </span>
                <span
                  className={`rounded-app border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${INVITE_STATUS_STYLE[invite.status]}`}
                >
                  {INVITE_STATUS_LABEL[invite.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Seção "Avaliações" - lista toda avaliação real da loja, com duas ações de
 * moderação (pedido do Alfredo, 2026-10-11: "temos que ter no painel de
 * admin o potencial de ocultar ou apagar um comentário"): "Ocultar"
 * (reversível - some das listagens públicas, mas continua aqui) e "Apagar"
 * (definitivo).
 */
function ReviewListSection({ token }: { token: string }) {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingHiddenId, setTogglingHiddenId] = useState<number | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      setReviews(await getAdminReviews(token));
    } catch {
      setErrorMessage("Não foi possível carregar as avaliações agora.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(reviewId: number) {
    setDeletingId(reviewId);
    try {
      await deleteReview(token, reviewId);
      setReviews((current) => current.filter((review) => review.id !== reviewId));
    } catch {
      setErrorMessage("Não foi possível apagar essa avaliação agora.");
    } finally {
      setDeletingId(null);
      setConfirmingDeleteId(null);
    }
  }

  async function handleToggleHidden(review: AdminReview) {
    setTogglingHiddenId(review.id);
    try {
      const updated = await setReviewHidden(token, review.id, !review.isHidden);
      setReviews((current) => current.map((item) => (item.id === review.id ? updated : item)));
    } catch {
      setErrorMessage(
        review.isHidden ? "Não foi possível reexibir essa avaliação agora." : "Não foi possível ocultar essa avaliação agora.",
      );
    } finally {
      setTogglingHiddenId(null);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-neutral-500 dark:text-neutral-400">Carregando avaliações…</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
        Avaliações ({reviews.length})
      </p>
      {errorMessage && <p className="text-xs text-red-600 dark:text-red-400">{errorMessage}</p>}

      {reviews.length === 0 ? (
        <p className="text-xs text-neutral-500 dark:text-neutral-400">Nenhuma avaliação ainda.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {reviews.map((review) => (
            <div
              key={review.id}
              className={`flex flex-col gap-2 rounded-app border p-3 dark:border-neutral-800 sm:flex-row sm:items-start sm:justify-between ${
                review.isHidden
                  ? "border-neutral-300 bg-neutral-50 opacity-70 dark:bg-neutral-900/40"
                  : "border-neutral-200"
              }`}
            >
              <div className="flex gap-3">
                {review.photoUrl && (
                  <button type="button" onClick={() => setLightboxSrc(review.photoUrl)} className="shrink-0">
                    <Image
                      src={review.photoUrl}
                      alt={`Foto enviada por ${review.author}`}
                      width={56}
                      height={56}
                      unoptimized
                      className="h-14 w-14 rounded-app object-cover"
                    />
                  </button>
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Stars rating={review.rating} />
                    <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100">{review.author}</span>
                    {review.isGuest ? (
                      <span className="rounded-app border border-neutral-300 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
                        Convidado
                      </span>
                    ) : (
                      review.authorEmail && (
                        <span className="text-[11px] text-neutral-500 dark:text-neutral-400">{review.authorEmail}</span>
                      )
                    )}
                    {review.isHidden && (
                      <span className="rounded-app border border-amber-400 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-amber-600 dark:border-amber-500 dark:text-amber-400">
                        Oculta
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                    {review.productTitle ?? review.productId}
                    {review.instagramHandle && <> · {review.instagramHandle}</>}
                  </p>
                  {review.comment && (
                    <p className="mt-1 text-xs text-neutral-700 dark:text-neutral-300">{review.comment}</p>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3 self-start">
                <button
                  type="button"
                  onClick={() => handleToggleHidden(review)}
                  disabled={togglingHiddenId === review.id}
                  className="text-[10px] font-semibold uppercase tracking-widest text-neutral-600 underline underline-offset-4 disabled:opacity-50 dark:text-neutral-400"
                >
                  {togglingHiddenId === review.id ? "Aguarde…" : review.isHidden ? "Reexibir" : "Ocultar"}
                </button>

                {confirmingDeleteId === review.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-neutral-600 dark:text-neutral-400">Apagar?</span>
                    <button
                      type="button"
                      onClick={() => handleDelete(review.id)}
                      disabled={deletingId === review.id}
                      className="rounded-app border border-red-600 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-red-600 disabled:opacity-50 dark:border-red-400 dark:text-red-400"
                    >
                      Confirmar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDeleteId(null)}
                      disabled={deletingId === review.id}
                      className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingDeleteId(review.id)}
                    className="text-[10px] font-semibold uppercase tracking-widest text-red-600 underline underline-offset-4 dark:text-red-400"
                  >
                    Apagar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {lightboxSrc && (
        <ImageLightbox src={lightboxSrc} alt="Foto da avaliação" onClose={() => setLightboxSrc(null)} />
      )}
    </div>
  );
}

export function AdminReviewsTab() {
  const { token } = useAuth();

  if (!token) {
    return <p className="text-sm text-neutral-500 dark:text-neutral-400">Carregando…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <GenerateInviteSection token={token} />
      <ReviewListSection token={token} />
    </div>
  );
}
