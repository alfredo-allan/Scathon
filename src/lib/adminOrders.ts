import { apiFetch, resolveMediaUrl } from "./apiClient";

export type PaymentMethod = "pix" | "credito" | "boleto";
export type PaymentStatus = "approved" | "pending" | "refunded" | "rejected";
export type OrderStatus = "processando" | "a caminho" | "entregue" | "cancelado";

export interface AdminOrderItem {
  slug: string;
  title: string;
  imageUrl: string;
  price: number;
  quantity: number;
}

export interface PaymentReceipt {
  paymentId: string | null;
  method: PaymentMethod;
  status: PaymentStatus;
  grossAmount: number;
  feeAmount: number;
  netAmount: number;
}

export interface AdminOrder {
  id: string;
  placedAt: string;
  customerEmail: string;
  customerName: string;
  status: OrderStatus;
  shippingMethod: "melhor_envio" | "combinar_com_vendedor";
  shippingCarrier?: string | null;
  shippingCost: number;
  /**
   * Preenchido manualmente pelo admin (`<AdminOrdersTab/>`, junto da troca
   * de status) ou automaticamente pelo webhook da Melhor Envio (`POST /
   * webhooks/melhor-envio`, evento "shipped") quando a integração real
   * estiver ligada - `null` enquanto ninguém despachou ainda.
   */
  trackingCode?: string | null;
  /**
   * Foto da nota fiscal/comprovante anexada pelo admin (`POST /admin/orders/
   * {id}/invoice` - ver `<AdminOrdersTab/>`) e encaminhada ao cliente por
   * e-mail na hora do upload - `null` enquanto nada foi anexado ainda.
   */
  invoiceUrl?: string | null;
  items: AdminOrderItem[];
  payment: PaymentReceipt | null;
}

interface AdminOrdersResponse {
  items: AdminOrder[];
  page: number;
  perPage: number;
  total: number;
}

const MAX_PAGE_SIZE = 100;

/**
 * `item.imageUrl`/`invoiceUrl` são caminhos relativos quando apontam pro
 * backend (`/media/products/...`, `/media/invoices/...`) - sempre passam por
 * `resolveMediaUrl` antes de virar `src` de `<img>`/link, senão quebram (ver
 * doc comment dela em `@/lib/apiClient`). Compartilhado entre `getAdminOrders`
 * e `getCustomerOrders` (`@/lib/adminCustomers`) pra nunca divergir - os dois
 * devolvem o mesmo formato `AdminOrder`, só filtrado por pedido diferente.
 */
export function normalizeAdminOrder(order: AdminOrder): AdminOrder {
  return {
    ...order,
    invoiceUrl: resolveMediaUrl(order.invoiceUrl) ?? order.invoiceUrl,
    items: order.items.map((item) => ({ ...item, imageUrl: resolveMediaUrl(item.imageUrl) ?? item.imageUrl })),
  };
}

/**
 * Pedidos de toda a loja (`GET /api/v1/admin/orders` - ver `app/admin/
 * __init__.py`), fase 4 do roadmap. Substitui `getAdminOrders()`, que
 * devolvia um array mockado fixo - agora é a tabela `orders`/`payments`
 * real. Exige token de admin.
 */
export async function getAdminOrders(token: string, status?: OrderStatus): Promise<AdminOrder[]> {
  const query = new URLSearchParams({ perPage: String(MAX_PAGE_SIZE) });
  if (status) query.set("status", status);
  const data = await apiFetch<AdminOrdersResponse>(`/admin/orders?${query.toString()}`, { token });
  return data.items.map(normalizeAdminOrder);
}

/**
 * Anexa a foto da nota fiscal/comprovante a um pedido - o backend processa,
 * salva e já encaminha a foto pro cliente por e-mail na mesma chamada (ver
 * `POST /admin/orders/{id}/invoice` em `app/admin/__init__.py`); aqui só
 * devolve o pedido atualizado (`invoiceUrl` novo) pra `<AdminOrdersTab/>`
 * atualizar a lista sem precisar recarregar tudo de novo.
 */
export async function uploadOrderInvoice(token: string, orderId: string, file: File): Promise<AdminOrder> {
  const form = new FormData();
  form.append("file", file);
  const data = await apiFetch<{ order: AdminOrder }>(`/admin/orders/${encodeURIComponent(orderId)}/invoice`, {
    method: "POST",
    token,
    body: form,
  });
  return normalizeAdminOrder(data.order);
}

/**
 * `trackingCode` é opcional de propósito (ver doc comment de
 * `OrderStatusUpdateSchema` no backend): omitido (chamada só com `status`),
 * o código de rastreio já salvo não é mexido - só entra no corpo quando
 * `<AdminOrdersTab/>` está especificamente salvando um código novo (string)
 * ou limpando um existente (`null`).
 */
export async function updateOrderStatus(
  token: string,
  orderId: string,
  status: OrderStatus,
  trackingCode?: string | null,
): Promise<void> {
  const body: { status: OrderStatus; trackingCode?: string | null } = { status };
  if (trackingCode !== undefined) body.trackingCode = trackingCode;
  await apiFetch(`/admin/orders/${encodeURIComponent(orderId)}/status`, {
    method: "PATCH",
    token,
    body,
  });
}

export interface AdminOverviewStats {
  totalOrders: number;
  approvedRevenueGross: number;
  approvedRevenueNet: number;
  pendingPayments: number;
  refundedOrRejected: number;
  averageTicket: number;
  ordersByStatus: Record<OrderStatus, number>;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Agregados pra `<AdminOverviewTab/>`, calculados aqui em cima da MESMA
 * lista que `<AdminOrdersTab/>` busca (`getAdminOrders`) - igual o mock
 * antigo fazia (ambas as abas nunca podem divergir porque derivam do mesmo
 * array), só que agora `orders` é real. `GET /api/v1/admin/overview`
 * existe no backend com um resumo mais simples (sem a quebra bruta/líquida
 * nem ticket médio) - esta função fica com a versão mais rica que o painel
 * já mostrava, já que dá pra computá-la inteira a partir de `AdminOrder[]`
 * sem precisar de um segundo formato de resposta.
 */
export function computeOverviewStats(orders: AdminOrder[]): AdminOverviewStats {
  const approved = orders.filter((order) => order.payment?.status === "approved");
  const pending = orders.filter((order) => order.payment?.status === "pending");
  const refundedOrRejected = orders.filter(
    (order) => order.payment?.status === "refunded" || order.payment?.status === "rejected",
  );
  const approvedRevenueGross = round2(approved.reduce((sum, order) => sum + (order.payment?.grossAmount ?? 0), 0));
  const approvedRevenueNet = round2(approved.reduce((sum, order) => sum + (order.payment?.netAmount ?? 0), 0));

  const ordersByStatus: Record<OrderStatus, number> = {
    processando: 0,
    "a caminho": 0,
    entregue: 0,
    cancelado: 0,
  };
  for (const order of orders) {
    ordersByStatus[order.status] += 1;
  }

  return {
    totalOrders: orders.length,
    approvedRevenueGross,
    approvedRevenueNet,
    pendingPayments: pending.length,
    refundedOrRejected: refundedOrRejected.length,
    averageTicket: approved.length ? round2(approvedRevenueGross / approved.length) : 0,
    ordersByStatus,
  };
}
