"use client";

import { useMemo } from "react";
import { getAdminOrders, getAdminOverviewStats, type OrderStatus } from "@/lib/adminOrders";
import { getAdminCustomers } from "@/lib/adminCustomers";
import { useInventory } from "@/hooks/useInventory";
import { products } from "@/data/products";
import { LOW_STOCK_THRESHOLD, ORDER_STATUS_LABEL, PaymentStatusBadge } from "./adminShared";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

const STATUS_ORDER: OrderStatus[] = ["processando", "a caminho", "entregue", "cancelado"];
// Reserved status colors (never reused for anything else) - paired with a
// text label right next to each bar, never color alone, per the dataviz
// skill's guidance on status encodings.
const STATUS_BAR_COLOR: Record<OrderStatus, string> = {
  processando: "bg-amber-500",
  "a caminho": "bg-neutral-500",
  entregue: "bg-emerald-500",
  cancelado: "bg-red-500",
};

/**
 * "Visão Geral" tab: the numbers a store owner checks first - receita
 * aprovada (bruta/líquida, líquida já descontando a taxa do Mercado Pago,
 * ver `@/lib/adminOrders`'s doc comment on por que esses números devem
 * bater com o próprio painel do Mercado Pago), pedidos por status, e alertas
 * rápidos de estoque baixo/clientes cadastrados - tudo derivado das mesmas
 * fontes que as outras abas (`getAdminOrders`, `getAdminCustomers`,
 * `useInventory`) então nunca diverge do que elas mostram em detalhe.
 */
export function AdminOverviewTab() {
  const stats = useMemo(() => getAdminOverviewStats(), []);
  const orders = useMemo(() => getAdminOrders(), []);
  const customers = useMemo(() => getAdminCustomers(), []);
  const stock = useInventory();

  const lowStockCount = useMemo(
    () => products.filter((product) => (stock[product.slug] ?? 0) <= LOW_STOCK_THRESHOLD).length,
    [stock],
  );

  const recentReceipts = useMemo(
    () => [...orders].sort((a, b) => (a.placedAt < b.placedAt ? 1 : -1)).slice(0, 5),
    [orders],
  );

  const maxStatusCount = Math.max(1, ...STATUS_ORDER.map((status) => stats.ordersByStatus[status]));

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Receita aprovada (bruta)" value={currencyFormatter.format(stats.approvedRevenueGross)} />
        <StatTile label="Receita aprovada (líquida)" value={currencyFormatter.format(stats.approvedRevenueNet)} hint="Após taxa do Mercado Pago" />
        <StatTile label="Ticket médio" value={currencyFormatter.format(stats.averageTicket)} />
        <StatTile label="Pedidos no total" value={String(stats.totalOrders)} />
        <StatTile label="Pagamentos pendentes" value={String(stats.pendingPayments)} />
        <StatTile label="Cancelados / reembolsados" value={String(stats.refundedOrRejected)} />
        <StatTile label="Clientes cadastrados" value={String(customers.length)} />
        <StatTile
          label="Produtos com estoque baixo"
          value={String(lowStockCount)}
          hint={`≤ ${LOW_STOCK_THRESHOLD} unidades`}
          warn={lowStockCount > 0}
        />
      </div>

      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
          Pedidos por status
        </h2>
        <div className="mt-3 flex flex-col gap-2">
          {STATUS_ORDER.map((status) => {
            const count = stats.ordersByStatus[status];
            return (
              <div key={status} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-xs text-neutral-600 dark:text-neutral-400">{ORDER_STATUS_LABEL[status]}</span>
                <div className="h-2 flex-1 bg-neutral-100 dark:bg-neutral-900">
                  <div
                    className={`h-2 ${STATUS_BAR_COLOR[status]}`}
                    style={{ width: `${(count / maxStatusCount) * 100}%` }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right text-xs font-medium text-neutral-900 dark:text-neutral-100">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
          Últimos comprovantes
        </h2>
        <div className="mt-3 flex flex-col divide-y divide-neutral-100 border border-neutral-200 dark:divide-neutral-900 dark:border-neutral-800">
          {recentReceipts.map((order) => (
            <div key={order.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
              <div className="min-w-0">
                <p className="font-medium text-neutral-900 dark:text-neutral-100">{order.payment.paymentId}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {order.customerName} · Pedido {order.id} · {dateFormatter.format(new Date(order.placedAt))}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <PaymentStatusBadge status={order.payment.status} />
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {currencyFormatter.format(order.payment.grossAmount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value, hint, warn }: { label: string; value: string; hint?: string; warn?: boolean }) {
  return (
    <div className="border border-neutral-200 p-4 dark:border-neutral-800">
      <p className="text-[11px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400">{label}</p>
      <p className={`mt-1.5 text-xl font-semibold tracking-tight ${warn ? "text-amber-600 dark:text-amber-400" : "text-neutral-950 dark:text-neutral-50"}`}>
        {value}
      </p>
      {hint && <p className="mt-0.5 text-[11px] text-neutral-400 dark:text-neutral-600">{hint}</p>}
    </div>
  );
}
