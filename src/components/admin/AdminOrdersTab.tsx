"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { getAdminOrders, type OrderStatus } from "@/lib/adminOrders";
import { ORDER_STATUS_LABEL, ORDER_STATUS_STYLE, PaymentStatusBadge } from "./adminShared";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

const METHOD_LABEL: Record<"pix" | "credito" | "boleto", string> = {
  pix: "Pix",
  credito: "Crédito",
  boleto: "Boleto",
};

const FILTERS: Array<{ id: OrderStatus | "todos"; label: string }> = [
  { id: "todos", label: "Todos" },
  { id: "processando", label: "Processando" },
  { id: "a caminho", label: "A caminho" },
  { id: "entregue", label: "Entregue" },
  { id: "cancelado", label: "Cancelado" },
];

/**
 * "Pedidos" tab: every order across every customer (`getAdminOrders`,
 * unlike `@/lib/orders`'s customer-scoped list), with its shipping method
 * and payment receipt inline - "listagem de compras" and "lista de pedidos
 * realizados" from the brief are the same table here, since a completed
 * purchase *is* an order in this mock data model.
 */
export function AdminOrdersTab() {
  const orders = useMemo(() => [...getAdminOrders()].sort((a, b) => (a.placedAt < b.placedAt ? 1 : -1)), []);
  const [filter, setFilter] = useState<OrderStatus | "todos">("todos");

  const filteredOrders = useMemo(
    () => (filter === "todos" ? orders : orders.filter((order) => order.status === filter)),
    [orders, filter],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setFilter(option.id)}
            className={`rounded-app border px-3 py-1.5 text-xs font-semibold uppercase tracking-widest transition-colors ${
              filter === option.id
                ? "border-neutral-950 bg-neutral-950 text-neutral-50 dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950"
                : "border-neutral-300 text-neutral-600 hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-400"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {filteredOrders.map((order) => (
          <div key={order.id} className="overflow-hidden rounded-app border border-neutral-200 dark:border-neutral-800">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
                  Pedido {order.id}
                </p>
                <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                  {order.customerName} · {order.customerEmail} · {dateFormatter.format(new Date(order.placedAt))}
                </p>
              </div>
              <span
                className={`rounded-app border px-2 py-1 text-[10px] font-semibold uppercase tracking-widest ${ORDER_STATUS_STYLE[order.status]}`}
              >
                {ORDER_STATUS_LABEL[order.status]}
              </span>
            </div>

            <div className="flex flex-col divide-y divide-neutral-100 dark:divide-neutral-900">
              {order.items.map((item, index) => (
                <div key={`${order.id}-${index}`} className="flex items-center gap-3 px-4 py-3">
                  <span className="relative block h-14 w-11 shrink-0 overflow-hidden rounded-app bg-neutral-200 dark:bg-neutral-800">
                    <Image src={item.imageUrl} alt={item.title} fill unoptimized sizes="44px" className="object-cover" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-neutral-900 dark:text-neutral-100">{item.title}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Qtd: {item.quantity}</p>
                  </div>
                  <p className="shrink-0 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {currencyFormatter.format(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 bg-neutral-50 px-4 py-3 text-xs dark:border-neutral-800 dark:bg-neutral-900/40">
              <div className="flex flex-wrap items-center gap-4 text-neutral-600 dark:text-neutral-400">
                <span>
                  Envio: {order.shippingMethod === "melhor_envio" ? order.shippingCarrier ?? "Melhor Envio" : "Combinado com o vendedor"}
                  {order.shippingCost > 0 ? ` · ${currencyFormatter.format(order.shippingCost)}` : ""}
                </span>
                <span className="flex items-center gap-1.5">
                  {order.payment.paymentId} · {METHOD_LABEL[order.payment.method]} ·{" "}
                  <PaymentStatusBadge status={order.payment.status} />
                </span>
              </div>
              <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                Total: {currencyFormatter.format(order.payment.grossAmount + order.shippingCost)}
              </p>
            </div>
          </div>
        ))}

        {filteredOrders.length === 0 && (
          <p className="py-12 text-center text-sm text-neutral-500 dark:text-neutral-400">
            Nenhum pedido com esse status.
          </p>
        )}
      </div>
    </div>
  );
}
