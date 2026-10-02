import { apiFetch, ApiError } from "./apiClient";

/**
 * Avaliações de produto reais (seção 2 do briefing: "rotas de comentários e
 * avaliação do usuário para o produto") - fala direto com `scathon-api`
 * (`GET/POST /api/v1/products/{slug}/reviews`, `GET /api/v1/me/reviews`).
 * Substitui `@/lib/orderReviews` (cache só em `localStorage`, apagado): a
 * fonte de verdade agora é sempre o backend, que também é quem decide se o
 * cliente pode avaliar - só quem tem um pedido `entregue` com aquele
 * produto, nunca uma alegação do cliente.
 */

export interface ProductReview {
  id: number;
  productId: string;
  /** Só o primeiro nome do autor - o backend nunca expõe mais que isso
   * (ver `Review.to_public_dict` em `app/models/review.py`). */
  author: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface ProductReviewsPage {
  items: ProductReview[];
  total: number;
  /** Agregado atual do produto (já recalculado pelo backend a cada
   * avaliação nova/editada) - substitui `Product.rating`/`reviewCount`
   * estáticos de `src/data/products.ts` quando disponível. */
  rating: number;
  reviewCount: number;
}

/** `GET /api/v1/products/{slug}/reviews` - público, sem autenticação. */
export async function getProductReviews(slug: string): Promise<ProductReviewsPage> {
  return apiFetch<ProductReviewsPage>(`/products/${encodeURIComponent(slug)}/reviews`);
}

export interface OwnReview {
  productId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

/**
 * `GET /api/v1/me/reviews` - avaliações que o PRÓPRIO cliente logado já
 * escreveu, por `productId`. `<AccountOrdersView/>` usa isto pra saber quais
 * itens de pedidos entregues já foram avaliados (e com que nota/comentário,
 * pra reabrir o formulário já preenchido) sem depender de `localStorage`.
 */
export async function getMyReviews(token: string): Promise<OwnReview[]> {
  const data = await apiFetch<{ items: OwnReview[] }>("/me/reviews", { token });
  return data.items;
}

interface SubmitReviewResponse {
  review: OwnReview;
  productRating: number;
  productReviewCount: number;
}

/**
 * Cria ou atualiza a avaliação do cliente logado pra um produto
 * (`POST /api/v1/products/{slug}/reviews`) - o backend rejeita com 403
 * (`code: "purchase_not_verified"`) se o cliente não tiver um pedido
 * `entregue` com este produto; `<OrderReviewForm/>` só mostra o formulário a
 * partir de um item de pedido já entregue, então esse 403 não deveria
 * acontecer no uso normal, mas o erro ainda chega como `ApiError` pra
 * qualquer chamador tratar com uma mensagem real em vez de falhar
 * silenciosamente.
 */
export async function submitReview(
  slug: string,
  rating: number,
  comment: string,
  token: string,
): Promise<SubmitReviewResponse> {
  return apiFetch<SubmitReviewResponse>(`/products/${encodeURIComponent(slug)}/reviews`, {
    method: "POST",
    token,
    body: { rating, comment: comment.trim() || undefined },
  });
}

export { ApiError };
