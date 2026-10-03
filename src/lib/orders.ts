import { apiFetch, resolveMediaUrl } from "./apiClient";

export interface OrderItem {
  /** Id real do produto no backend - usado por `<OrderReviewForm/>` pra
   * chamar `POST /api/v1/products/{slug}/reviews` (a rota em si é por
   * `slug`, mas o id é o que liga este item à avaliação que o cliente já
   * tenha escrito, vinda de `GET /me/reviews` - ver `@/lib/reviews`). */
  productId: string;
  slug: string;
  category: string;
  title: string;
  price: number;
  imageUrl: string;
  color: string;
  size: string;
  quantity: number;
}

export interface Order {
  id: string;
  placedAt: string; // ISO date
  status: "processando" | "a caminho" | "entregue" | "cancelado";
  items: OrderItem[];
}

interface OrdersResponse {
  items: Order[];
  page: number;
  perPage: number;
  total: number;
}

export interface OrderDetail extends Order {
  userId: number;
  subtotal: number;
  shipping: {
    method: "melhor_envio" | "combinar_com_vendedor";
    carrier: string | null;
    cost: number;
    note: string | null;
    trackingCode: string | null;
    address: {
      recipientName: string;
      cep: string;
      street: string;
      number: string;
      complement: string | null;
      neighborhood: string;
      city: string;
      state: string;
    };
  };
  payment: {
    paymentId: string | null;
    method: "pix" | "credito" | "boleto";
    status: "pending" | "approved" | "rejected" | "refunded";
    grossAmount: number;
    feeAmount: number;
    netAmount: number;
  } | null;
}

/**
 * Histórico de pedidos do cliente logado - `GET /api/v1/me/orders` no
 * backend real (`scathon-api`), que já foi desenhado desde a Fase 5 pra ser
 * um substituto direto desta função (ver o doc comment de `Order.
 * to_summary_dict()` lá: "é isso que `<AccountOrdersView/>` já espera pra
 * renderizar cada pedido"). Sem `token` (visitante não logado), devolve uma
 * lista vazia em vez de chamar a API - `<AccountOrdersView/>` já mostra sua
 * própria tela de "você precisa entrar" nesse caso, então não há pedido
 * nenhum pra buscar.
 *
 * Antes disso, esta função devolvia uma lista mockada fixa (três pedidos
 * fictícios com os dois produtos realmente compráveis do catálogo) - a
 * mesma pra QUALQUER sessão, mesmo visitantes diferentes. Isso nunca foi um
 * problema visível porque o login também era mock (todo mundo "era" o
 * mesmo cliente) - agora que o login é real (ver `@/lib/auth`), cada
 * cliente vê só os próprios pedidos de verdade.
 */
function resolveOrderItemImages<T extends { items: { imageUrl: string }[] }>(order: T): T {
  // `item.imageUrl` é um retrato ("snapshot") do `Product.image_url` no
  // momento da compra - pode ser `/media/products/...` pra um produto com
  // foto enviada pelo painel admin, que precisa da origem do backend pra
  // não quebrar (ver `resolveMediaUrl` em `@/lib/apiClient`).
  return { ...order, items: order.items.map((item) => ({ ...item, imageUrl: resolveMediaUrl(item.imageUrl) ?? item.imageUrl })) };
}

export async function getRecentOrders(token: string | null): Promise<Order[]> {
  if (!token) return [];
  const data = await apiFetch<OrdersResponse>("/me/orders", { token });
  return data.items.map(resolveOrderItemImages);
}

/**
 * Um pedido específico por completo (`GET /api/v1/orders/{id}` - ver
 * `app/checkout/__init__.py`) - alimenta `/pedido/[id]`, a página pra onde
 * `checkout.initPoint` redireciona depois de `POST /checkout` (ver
 * `@/lib/mercadoPago`'s doc comment). O backend já garante que só o dono do
 * pedido (ou um admin) consegue ver - um id alheio vira 404 genérico, nunca
 * 403, pra não confirmar que aquele id existe.
 */
export async function getOrderById(token: string, orderId: string): Promise<OrderDetail> {
  const data = await apiFetch<{ order: OrderDetail }>(`/orders/${encodeURIComponent(orderId)}`, { token });
  return resolveOrderItemImages(data.order);
}
