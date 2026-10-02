import { apiFetch } from "./apiClient";

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
export async function getRecentOrders(token: string | null): Promise<Order[]> {
  if (!token) return [];
  const data = await apiFetch<OrdersResponse>("/me/orders", { token });
  return data.items;
}
