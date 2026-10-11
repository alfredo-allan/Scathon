import { apiFetch, resolveMediaUrl } from "./apiClient";

/**
 * Administração de avaliações pelo painel admin (pedido do Alfredo,
 * 2026-10-11: "no painel de admin eu quero uma parte para administrar os
 * comentários, e uma parte mais especifica aonde manda link [...] para o
 * admin enviar para o cliente"). Fala com `GET/DELETE /api/v1/admin/reviews`
 * e `POST/GET /api/v1/admin/review-invites` (ver `app/admin/__init__.py`).
 */

export interface AdminReview {
  id: number;
  productId: string;
  productTitle: string | null;
  productSlug: string | null;
  /** Nome completo + e-mail (não só o primeiro nome que a listagem pública
   * mostra) - só o admin vê isso, precisa pra moderar de verdade. */
  author: string;
  authorEmail: string | null;
  /** `true` pra avaliação de convite "por produto" (2026-10-11, sem conta
   * nenhuma por trás - ver `@/lib/reviews`'s `ReviewInviteInfo`) - o painel
   * mostra "Convidado" em vez de um e-mail que não existe. */
  isGuest: boolean;
  rating: number;
  comment: string | null;
  photoUrl: string | null;
  instagramHandle: string | null;
  /** Oculta das listagens/destaques PÚBLICOS (não apagada) - ver
   * `setReviewHidden` abaixo. */
  isHidden: boolean;
  createdAt: string;
}

interface AdminReviewsResponse {
  items: AdminReview[];
  page: number;
  perPage: number;
  total: number;
}

const MAX_PAGE_SIZE = 100;

function normalizeAdminReview(review: AdminReview): AdminReview {
  return { ...review, photoUrl: resolveMediaUrl(review.photoUrl) };
}

/** `GET /api/v1/admin/reviews` - toda avaliação da loja, mais recente primeiro. */
export async function getAdminReviews(token: string, productId?: string): Promise<AdminReview[]> {
  const query = new URLSearchParams({ perPage: String(MAX_PAGE_SIZE) });
  if (productId) query.set("productId", productId);
  const data = await apiFetch<AdminReviewsResponse>(`/admin/reviews?${query.toString()}`, { token });
  return data.items.map(normalizeAdminReview);
}

/** `DELETE /api/v1/admin/reviews/{id}` - moderação (spam, ofensa, pedido do próprio cliente), PRA SEMPRE. */
export async function deleteReview(token: string, reviewId: number): Promise<void> {
  await apiFetch<void>(`/admin/reviews/${reviewId}`, { method: "DELETE", token });
}

/**
 * `PATCH /api/v1/admin/reviews/{id}` - oculta ou reexibe SEM apagar (pedido
 * do Alfredo, 2026-10-11: "temos que ter no painel de admin o potencial de
 * ocultar ou apagar um comentário" - as duas opções, cada uma pro seu caso).
 * Devolve a avaliação atualizada pra `<AdminReviewsTab/>` atualizar a linha
 * na tela sem precisar recarregar a lista inteira.
 */
export async function setReviewHidden(token: string, reviewId: number, isHidden: boolean): Promise<AdminReview> {
  const data = await apiFetch<{ review: AdminReview }>(`/admin/reviews/${reviewId}`, {
    method: "PATCH",
    token,
    body: { isHidden },
  });
  return normalizeAdminReview(data.review);
}

export type ReviewInviteStatus = "pending" | "used" | "expired";
export type ReviewInviteKind = "order" | "product";

export interface AdminReviewInvite {
  id: number;
  token: string;
  kind: ReviewInviteKind;
  orderItemId: number | null;
  orderId: string | null;
  productId: string | null;
  productTitle: string | null;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
  status: ReviewInviteStatus;
}

interface AdminReviewInvitesResponse {
  items: AdminReviewInvite[];
  page: number;
  perPage: number;
  total: number;
}

/**
 * Gera o link de avaliação sem login - EXATAMENTE um entre os dois modos
 * (`POST /api/v1/admin/review-invites`, body `{orderItemId}` OU
 * `{productId}`, nunca os dois):
 *
 * - "por pedido" (o original): `orderItemId` vem de `AdminOrder.items[].id`
 *   (ver `@/lib/adminOrders`), escolhido na busca por pedido/cliente.
 * - "por produto" (2026-10-11, pedido do Alfredo: "tem clientes que ainda
 *   não tem cadastro no site"): `productId` vem do catálogo (`@/lib/
 *   products`'s `listProducts`), sem precisar de nenhum pedido existente.
 *
 * `link` já vem pronto pra copiar/enviar (monta a URL completa com a
 * origem do frontend - ver doc comment de `create_review_invite` no
 * backend); pode vir `null` se `FRONTEND_ORIGIN` não estiver configurado no
 * servidor, caso em que `<AdminReviewsTab/>` monta a URL na hora com
 * `window.location.origin`.
 */
export async function createReviewInvite(
  token: string,
  target: { orderItemId: number } | { productId: string },
): Promise<{ token: string; link: string | null; invite: AdminReviewInvite }> {
  return apiFetch<{ token: string; link: string | null; invite: AdminReviewInvite }>("/admin/review-invites", {
    method: "POST",
    token,
    body: target,
  });
}

/** `GET /api/v1/admin/review-invites` - convites já gerados, mais recente primeiro. */
export async function getReviewInvites(token: string): Promise<AdminReviewInvite[]> {
  const query = new URLSearchParams({ perPage: String(MAX_PAGE_SIZE) });
  const data = await apiFetch<AdminReviewInvitesResponse>(`/admin/review-invites?${query.toString()}`, { token });
  return data.items;
}
