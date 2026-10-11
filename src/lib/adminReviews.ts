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
  rating: number;
  comment: string | null;
  photoUrl: string | null;
  instagramHandle: string | null;
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

/** `DELETE /api/v1/admin/reviews/{id}` - moderação (spam, ofensa, pedido do próprio cliente). */
export async function deleteReview(token: string, reviewId: number): Promise<void> {
  await apiFetch<void>(`/admin/reviews/${reviewId}`, { method: "DELETE", token });
}

export type ReviewInviteStatus = "pending" | "used" | "expired";

export interface AdminReviewInvite {
  id: number;
  token: string;
  orderItemId: number;
  orderId: string | null;
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
 * Gera o link de avaliação sem login pra um item de pedido específico
 * (`POST /api/v1/admin/review-invites`, body `{orderItemId}`) - o item vem
 * de `AdminOrder.items[].id` (ver `@/lib/adminOrders`), escolhido na tela de
 * "Gerar link" de `<AdminReviewsTab/>`. `link` já vem pronto pra copiar/
 * enviar (monta a URL completa com a origem do frontend - ver doc comment
 * de `create_review_invite` no backend); pode vir `null` se
 * `FRONTEND_ORIGIN` não estiver configurado no servidor, caso em que
 * `<AdminReviewsTab/>` monta a URL na hora com `window.location.origin`.
 */
export async function createReviewInvite(
  token: string,
  orderItemId: number,
): Promise<{ token: string; link: string | null; invite: AdminReviewInvite }> {
  return apiFetch<{ token: string; link: string | null; invite: AdminReviewInvite }>("/admin/review-invites", {
    method: "POST",
    token,
    body: { orderItemId },
  });
}

/** `GET /api/v1/admin/review-invites` - convites já gerados, mais recente primeiro. */
export async function getReviewInvites(token: string): Promise<AdminReviewInvite[]> {
  const query = new URLSearchParams({ perPage: String(MAX_PAGE_SIZE) });
  const data = await apiFetch<AdminReviewInvitesResponse>(`/admin/review-invites?${query.toString()}`, { token });
  return data.items;
}
