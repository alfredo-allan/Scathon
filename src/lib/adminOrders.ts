import { getProductBySlug } from "@/data/products";
import { daysAgo } from "./adminCustomerProfiles";

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

/**
 * A payment receipt shaped after Mercado Pago's own API fields
 * (`id`/payment method/`status`/transaction amount/fee), on purpose: once
 * the real Checkout Pro integration exists (see `@/lib/mercadoPago`'s doc
 * comment), this list should be a column-for-column match against what the
 * Mercado Pago dashboard reports for the same period, so an admin can
 * reconcile "o que o painel mostra" against "o que bateu no Mercado Pago"
 * at a glance instead of two systems that quietly drift apart.
 */
export interface PaymentReceipt {
  paymentId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  /** What the customer paid for the items (excludes frete, which is tracked separately on the order). */
  grossAmount: number;
  /** Mercado Pago's processing fee - 0 for a payment that never actually settled (pending/rejected). */
  feeAmount: number;
  /** `grossAmount - feeAmount` - what actually lands in the seller's account for this order. */
  netAmount: number;
}

export interface AdminOrder {
  id: string;
  placedAt: string;
  customerEmail: string;
  customerName: string;
  status: OrderStatus;
  shippingMethod: "melhor_envio" | "combinar_com_vendedor";
  shippingCarrier?: string;
  shippingCost: number;
  items: AdminOrderItem[];
  payment: PaymentReceipt;
}

// Mercado Pago's standard Checkout Pro rate as of writing - swap for the
// real negotiated rate (it varies by payment method/volume) once there's an
// account; every payment below runs through this same constant so the
// "líquido" figures stay internally consistent.
const MP_FEE_RATE = 0.0499;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function buildItem(slug: string, quantity: number): AdminOrderItem {
  const product = getProductBySlug(slug);
  if (!product) {
    throw new Error(`buildItem: unknown product slug "${slug}"`);
  }
  return {
    slug: product.slug,
    title: product.title,
    imageUrl: product.coverImage ?? product.imageUrl,
    price: product.price,
    quantity,
  };
}

function buildPayment(paymentId: string, method: PaymentMethod, status: PaymentStatus, grossAmount: number): PaymentReceipt {
  const settled = status === "approved" || status === "refunded";
  const feeAmount = settled ? round2(grossAmount * MP_FEE_RATE) : 0;
  return {
    paymentId,
    method,
    status,
    grossAmount,
    feeAmount,
    netAmount: round2(grossAmount - feeAmount),
  };
}

function buildOrder(
  id: string,
  placedDaysAgo: number,
  customerEmail: string,
  customerName: string,
  status: OrderStatus,
  shippingMethod: AdminOrder["shippingMethod"],
  shippingCarrier: string | undefined,
  shippingCost: number,
  itemDefs: Array<[slug: string, quantity: number]>,
  paymentId: string,
  method: PaymentMethod,
  paymentStatus: PaymentStatus,
): AdminOrder {
  const items = itemDefs.map(([slug, quantity]) => buildItem(slug, quantity));
  const grossAmount = round2(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
  return {
    id,
    placedAt: daysAgo(placedDaysAgo),
    customerEmail,
    customerName,
    status,
    shippingMethod,
    shippingCarrier,
    shippingCost,
    items,
    payment: buildPayment(paymentId, method, paymentStatus, grossAmount),
  };
}

// Mock order history across every customer in `CUSTOMER_PROFILES` - only
// the two catalog products that are actually purchasable today
// (`cathedral-t-shirt-preta`/`-branca`; everything else is
// `availability: "coming_soon"`), same restriction `@/lib/orders` follows,
// so a past order never contradicts an "Em breve" badge shown elsewhere.
// A mix of statuses/methods/payment outcomes on purpose, so the admin
// panel's aggregate numbers (Visão Geral) and per-tab lists (Pedidos,
// Clientes) have something real to add up instead of a single happy path.
function buildMockAdminOrders(): AdminOrder[] {
  return [
    buildOrder(
      "SCT-100482",
      3,
      "cliente@scathon.com",
      "Cliente Scathon",
      "a caminho",
      "melhor_envio",
      "Correios · SEDEX",
      34.9,
      [["cathedral-t-shirt-preta", 1]],
      "mp-9F31A2",
      "pix",
      "approved",
    ),
    buildOrder(
      "SCT-100471",
      5,
      "mariana.silva@example.com",
      "Mariana Silva",
      "entregue",
      "melhor_envio",
      "Correios · PAC",
      22.4,
      [["cathedral-t-shirt-branca", 2]],
      "mp-7B02C9",
      "credito",
      "approved",
    ),
    buildOrder(
      "SCT-100459",
      8,
      "joao.pereira@example.com",
      "João Pereira",
      "entregue",
      "combinar_com_vendedor",
      undefined,
      0,
      [
        ["cathedral-t-shirt-preta", 1],
        ["cathedral-t-shirt-branca", 1],
      ],
      "mp-4D88E1",
      "pix",
      "approved",
    ),
    buildOrder(
      "SCT-100438",
      11,
      "ana.souza@example.com",
      "Ana Souza",
      "cancelado",
      "melhor_envio",
      "Jadlog · .Package",
      18.6,
      [["cathedral-t-shirt-branca", 1]],
      "mp-2A55F7",
      "boleto",
      "refunded",
    ),
    buildOrder(
      "SCT-100402",
      15,
      "carlos.lima@example.com",
      "Carlos Lima",
      "processando",
      "melhor_envio",
      "Correios · SEDEX",
      29.9,
      [["cathedral-t-shirt-preta", 3]],
      "mp-6C77B3",
      "credito",
      "pending",
    ),
    buildOrder(
      "SCT-100317",
      19,
      "cliente@scathon.com",
      "Cliente Scathon",
      "entregue",
      "melhor_envio",
      "Correios · PAC",
      24.9,
      [["cathedral-t-shirt-branca", 1]],
      "mp-1E44A8",
      "pix",
      "approved",
    ),
    buildOrder(
      "SCT-100288",
      24,
      "beatriz.santos@example.com",
      "Beatriz Santos",
      "entregue",
      "melhor_envio",
      "Correios · SEDEX",
      31.2,
      [["cathedral-t-shirt-preta", 1]],
      "mp-8F19D2",
      "credito",
      "approved",
    ),
    buildOrder(
      "SCT-100251",
      33,
      "mariana.silva@example.com",
      "Mariana Silva",
      "entregue",
      "combinar_com_vendedor",
      undefined,
      0,
      [["cathedral-t-shirt-preta", 2]],
      "mp-3B60C4",
      "pix",
      "approved",
    ),
    buildOrder(
      "SCT-100205",
      41,
      "cliente@scathon.com",
      "Cliente Scathon",
      "entregue",
      "melhor_envio",
      "Correios · PAC",
      26.4,
      [
        ["cathedral-t-shirt-preta", 1],
        ["cathedral-t-shirt-branca", 2],
      ],
      "mp-5A93E6",
      "boleto",
      "approved",
    ),
    buildOrder(
      "SCT-100177",
      52,
      "carlos.lima@example.com",
      "Carlos Lima",
      "cancelado",
      "melhor_envio",
      undefined,
      0,
      [["cathedral-t-shirt-branca", 1]],
      "mp-0F22B5",
      "credito",
      "rejected",
    ),
  ];
}

/**
 * Full order history across every customer - the admin-panel equivalent of
 * `@/lib/orders`'s `getRecentOrders()`, which only ever returns the signed-in
 * customer's own orders. Kept as a plain synchronous function for the same
 * reason: this only *reads* a list that becomes a `fetch("/api/admin/orders")`
 * call later, and `<AdminOrdersTab/>`/`<AdminOverviewTab/>`, its only callers,
 * wouldn't need to change either way.
 */
export function getAdminOrders(): AdminOrder[] {
  return buildMockAdminOrders();
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

/** Aggregate numbers for `<AdminOverviewTab/>` - always derived from `getAdminOrders()` so the two tabs can never disagree. */
export function getAdminOverviewStats(): AdminOverviewStats {
  const orders = getAdminOrders();
  const approved = orders.filter((order) => order.payment.status === "approved");
  const pending = orders.filter((order) => order.payment.status === "pending");
  const refundedOrRejected = orders.filter(
    (order) => order.payment.status === "refunded" || order.payment.status === "rejected",
  );
  const approvedRevenueGross = round2(approved.reduce((sum, order) => sum + order.payment.grossAmount, 0));
  const approvedRevenueNet = round2(approved.reduce((sum, order) => sum + order.payment.netAmount, 0));

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
