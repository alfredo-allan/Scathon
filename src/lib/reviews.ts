import { apiFetch, ApiError, resolveMediaUrl } from "./apiClient";

/**
 * Avaliações de produto reais (seção 2 do briefing: "rotas de comentários e
 * avaliação do usuário para o produto") - fala direto com `scathon-api`
 * (`GET/POST /api/v1/products/{slug}/reviews`, `GET /api/v1/me/reviews`).
 * Substitui `@/lib/orderReviews` (cache só em `localStorage`, apagado): a
 * fonte de verdade agora é sempre o backend, que também é quem decide se o
 * cliente pode avaliar - só quem tem um pedido `entregue` com aquele
 * produto, nunca uma alegação do cliente.
 *
 * `getFeaturedReviews`/`getReviewInvite`/`submitReviewInvite` abaixo (pedido
 * do Alfredo, 2026-10-11) são o segundo caminho, SEM login, pra chegar
 * nessa mesma tabela `reviews` - ver `app/models/review_invite.py` no
 * backend. O formulário de dentro da conta (`submitReview` abaixo) continua
 * exatamente como estava.
 */

export interface ProductReview {
  id: number;
  productId: string;
  /** Só o primeiro nome do autor - o backend nunca expõe mais que isso
   * (ver `Review.to_public_dict` em `app/models/review.py`). */
  author: string;
  rating: number;
  comment: string | null;
  /** Foto opcional anexada via convite sem login (ver doc comment do
   * módulo) - `null` pra qualquer avaliação sem foto, inclusive toda
   * avaliação feita pelo formulário normal de dentro da conta (que nunca
   * manda este campo). Caminho relativo (`/media/reviews/...`) já resolvido
   * contra a origem do backend antes de chegar aqui - ver `normalizeReview`. */
  photoUrl: string | null;
  /** Perfil do Instagram mencionado na avaliação (sem validar contra o
   * Instagram de verdade - é só o que o cliente digitou), opcional. */
  instagramHandle: string | null;
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

/**
 * `photoUrl` chega do backend como caminho relativo (`/media/reviews/...`)
 * - mesmo motivo/padrão de `normalizeAdminOrder` em `@/lib/adminOrders`:
 * sem isso, `<Image src={review.photoUrl}>` resolveria contra a origem do
 * FRONTEND (onde essa rota não existe) em vez do backend, e a foto
 * quebraria.
 */
function normalizeReview(review: ProductReview): ProductReview {
  return { ...review, photoUrl: resolveMediaUrl(review.photoUrl) };
}

/** `GET /api/v1/products/{slug}/reviews` - público, sem autenticação. */
export async function getProductReviews(slug: string): Promise<ProductReviewsPage> {
  const data = await apiFetch<ProductReviewsPage>(`/products/${encodeURIComponent(slug)}/reviews`);
  return { ...data, items: data.items.map(normalizeReview) };
}

/**
 * Avaliações reais em destaque (nota alta + com comentário de verdade) -
 * alimenta `<TestimonialsCarousel/>` na home, no lugar dos depoimentos
 * fabricados que viviam em `src/data/testimonials.ts` (apagado - pedido do
 * Alfredo: "apagar os comentários que são fakes do site"). Público, sem
 * autenticação - `GET /api/v1/reviews/featured`.
 */
export async function getFeaturedReviews(limit = 8): Promise<ProductReview[]> {
  const data = await apiFetch<{ items: ProductReview[] }>(`/reviews/featured?limit=${limit}`);
  return data.items.map(normalizeReview);
}

export interface OwnReview {
  productId: string;
  rating: number;
  comment: string | null;
  photoUrl: string | null;
  instagramHandle: string | null;
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

// ---------------------------------------------------------------------------
// Convite de avaliação sem login - pedido do Alfredo, 2026-10-11: o admin
// manda um link (gerado em `<AdminReviewsTab/>`, ver `@/lib/adminReviews`)
// pro cliente simplesmente postar o comentário, sem precisar logar nem ter
// o pedido verificado de novo (o admin já escolheu o pedido/produto na hora
// de gerar o link - ver `app/models/review_invite.py` no backend). As duas
// funções abaixo são o que a página pública `/avaliar/[token]` usa; nenhuma
// das duas manda `token` de sessão pra `apiFetch` - o token do LINK (no
// próprio caminho da URL) é a única autorização.
// ---------------------------------------------------------------------------

export interface ReviewInviteInfo {
  /** `null` pra convite "por produto" (2026-10-11, pedido do Alfredo: "tem
   * clientes que ainda não tem cadastro no site") - sem pedido nenhum por
   * trás. `requiresName` abaixo é o que diferencia os dois modos pra
   * `<ReviewInviteView/>` decidir se mostra o campo "Seu nome". */
  orderId: string | null;
  productTitle: string;
  productSlug: string;
  productImageUrl: string | null;
  /** `true` só no convite "por produto" - sem conta/pedido, não tem de
   * onde tirar o nome automaticamente, então o formulário público PRECISA
   * perguntar. */
  requiresName: boolean;
  expiresAt: string;
}

/**
 * `GET /api/v1/review-invites/{token}` - dados do produto/pedido pra
 * pré-carregar a página antes do cliente preencher qualquer coisa. Lança
 * `ApiError` com `code: "not_found"`/`"invite_used"`/`"invite_expired"` -
 * `<ReviewInviteView/>` mostra uma mensagem diferente pra cada um (link
 * errado vs. já usado vs. expirado), em vez de um "algo deu errado" genérico.
 */
export async function getReviewInvite(token: string): Promise<ReviewInviteInfo> {
  const info = await apiFetch<ReviewInviteInfo>(`/review-invites/${encodeURIComponent(token)}`);
  return { ...info, productImageUrl: resolveMediaUrl(info.productImageUrl) };
}

export interface SubmitReviewInviteInput {
  rating: number;
  /** Obrigatório aqui (diferente do formulário de dentro da conta) - pedido
   * explícito do Alfredo: "pelo menos a nota e comentário é exigido para
   * publicar". */
  comment: string;
  /** Sem o "@" ou com - o backend só guarda o que foi digitado, nunca
   * valida contra o Instagram de verdade. */
  instagramHandle?: string;
  /** Arquivo original do `<input type="file">` - o backend processa/
   * redimensiona do zero (ver `app/catalog/review_photos.py`), então não
   * precisa de nenhum tratamento client-side antes de anexar aqui. */
  photo?: File | null;
  /** Só pra convite "por produto" (`invite.requiresName === true`) - o
   * nome que a própria pessoa digitou, já que não há conta pra tirar o
   * nome de outro jeito. O backend rejeita com `code: "name_required"` se
   * faltar num convite desse tipo (ver `submit_review_invite`). */
  name?: string;
}

/**
 * `POST /api/v1/review-invites/{token}` - sempre `multipart/form-data`
 * (mesmo sem foto, pra ter um único contrato) - ver doc comment de
 * `submit_review_invite` no backend. Um convite só aceita UM envio (ver
 * `code: "invite_used"` acima) - `<ReviewInviteView/>` troca pra uma tela
 * de "obrigado" depois desta chamada, nunca deixa reenviar.
 */
export async function submitReviewInvite(
  token: string,
  input: SubmitReviewInviteInput,
): Promise<{ review: ProductReview }> {
  const form = new FormData();
  form.set("rating", String(input.rating));
  form.set("comment", input.comment);
  if (input.instagramHandle?.trim()) form.set("instagramHandle", input.instagramHandle.trim());
  if (input.photo) form.set("photo", input.photo);
  if (input.name?.trim()) form.set("name", input.name.trim());

  const data = await apiFetch<{ review: ProductReview }>(`/review-invites/${encodeURIComponent(token)}`, {
    method: "POST",
    body: form,
  });
  return { review: normalizeReview(data.review) };
}

export { ApiError };
