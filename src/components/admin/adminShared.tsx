import type { OrderStatus, PaymentStatus } from "@/lib/adminOrders";

/** Below this stock count, `<AdminInventoryTab/>`/`<AdminOverviewTab/>` flag a product as "estoque baixo" instead of waiting for it to hit zero. */
export const LOW_STOCK_THRESHOLD = 5;

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  processando: "Processando",
  "a caminho": "A caminho",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

// Same monochrome border/pill treatment `<AccountOrdersView/>` already uses
// for a customer's own order status - kept consistent rather than
// reinventing a second visual language for the same states in the admin
// view.
export const ORDER_STATUS_STYLE: Record<OrderStatus, string> = {
  processando: "border-neutral-300 text-neutral-600 dark:border-neutral-700 dark:text-neutral-400",
  "a caminho": "border-neutral-900 text-neutral-900 dark:border-neutral-100 dark:text-neutral-100",
  entregue:
    "border-neutral-300 bg-neutral-900 text-neutral-50 dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950",
  cancelado: "border-red-300 text-red-600 dark:border-red-900 dark:text-red-400",
};

const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { dot: string; label: string }> = {
  approved: { dot: "bg-emerald-500", label: "Aprovado" },
  pending: { dot: "bg-amber-500", label: "Pendente" },
  refunded: { dot: "bg-neutral-400", label: "Reembolsado" },
  rejected: { dot: "bg-red-500", label: "Rejeitado" },
};

/**
 * A colored dot plus a text label - never color alone - for a payment
 * receipt's Mercado-Pago-style status. Shared between `<AdminOverviewTab/>`
 * and `<AdminOrdersTab/>` so the same status always reads the same way
 * wherever it shows up in the panel.
 */
export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const config = PAYMENT_STATUS_CONFIG[status];
  return (
    <span className="flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300">
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${config.dot}`} aria-hidden />
      {config.label}
    </span>
  );
}
