"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useInventory } from "@/hooks/useInventory";
import { computeOverviewStats, getAdminOrders, type AdminOrder, type OrderStatus } from "@/lib/adminOrders";
import { getAdminCustomers, type AdminCustomer } from "@/lib/adminCustomers";
import { LOW_STOCK_THRESHOLD, normalizeSearchText, ORDER_STATUS_LABEL, PaymentStatusBadge } from "./adminShared";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

// Pedido do Alfredo (2026-10-08): "Últimos comprovantes" não tinha busca nem
// limite - crescia pra sempre, virando uma lista sem fim pra rolar. Mesmo
// teto usado como "últimos N" em outros lugares do painel; acima disso,
// a lista é ocultada (não removida) e um aviso avisa quantos ficaram de fora.
const RECEIPTS_LIMIT = 55;

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
 * "Visão Geral" tab: os números reais da loja agora - pedidos e pagamentos
 * vêm de `GET /api/v1/admin/orders`, clientes de `GET /api/v1/admin/
 * customers`, estoque baixo de `GET /api/v1/admin/inventory` (via
 * `useInventory`). Os agregados (receita aprovada bruta/líquida, ticket
 * médio, ...) continuam calculados no cliente por `computeOverviewStats`,
 * em cima da mesma lista de pedidos que `<AdminOrdersTab/>` busca - nunca
 * diverge do que aquela aba mostra em detalhe.
 */
export function AdminOverviewTab() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [receiptSearch, setReceiptSearch] = useState("");
  const { items: inventoryItems } = useInventory();

  const load = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [fetchedOrders, fetchedCustomers] = await Promise.all([
        getAdminOrders(token),
        getAdminCustomers(token),
      ]);
      setOrders(fetchedOrders);
      setCustomers(fetchedCustomers);
    } catch {
      setErrorMessage("Não foi possível carregar o resumo agora.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    Promise.resolve().then(() => load());
  }, [load]);

  const stats = useMemo(() => computeOverviewStats(orders), [orders]);
  const lowStockCount = useMemo(() => inventoryItems.filter((item) => item.lowStock).length, [inventoryItems]);
  const receiptsWithPayment = useMemo(
    () =>
      [...orders]
        .filter((order) => order.payment)
        .sort((a, b) => (a.placedAt < b.placedAt ? 1 : -1)),
    [orders],
  );
  const filteredReceipts = useMemo(() => {
    const query = normalizeSearchText(receiptSearch.trim());
    if (!query) return receiptsWithPayment;
    return receiptsWithPayment.filter((order) =>
      [order.id, order.customerName, order.customerEmail, order.payment?.paymentId ?? ""].some((field) =>
        normalizeSearchText(field).includes(query),
      ),
    );
  }, [receiptsWithPayment, receiptSearch]);
  const visibleReceipts = useMemo(() => filteredReceipts.slice(0, RECEIPTS_LIMIT), [filteredReceipts]);
  const hiddenReceiptsCount = filteredReceipts.length - visibleReceipts.length;

  const maxStatusCount = Math.max(1, ...STATUS_ORDER.map((status) => stats.ordersByStatus[status]));

  if (isLoading) {
    return <p className="text-sm text-neutral-500 dark:text-neutral-400">Carregando resumo…</p>;
  }

  if (errorMessage) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
        <button
          type="button"
          onClick={load}
          className="text-xs font-semibold uppercase tracking-widest text-neutral-900 underline underline-offset-4 dark:text-neutral-100"
        >
          Tentar de novo
        </button>
      </div>
    );
  }

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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
            Últimos comprovantes
          </h2>

          {/* Mesmo padrão de busca de `<AdminOrdersTab/>` - `type="search"`
              pelo "x" nativo de limpar, full-width no celular. */}
          <div className="relative w-full sm:w-72">
            <svg
              viewBox="0 0 24 24"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
              fill="none"
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.75" />
              <path d="m20 20-3-3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              value={receiptSearch}
              onChange={(event) => setReceiptSearch(event.target.value)}
              placeholder="Buscar por cliente"
              className="w-full rounded-app border border-neutral-300 bg-transparent py-2 pl-9 pr-3 text-sm text-neutral-900 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:text-neutral-100 dark:focus:border-neutral-100"
            />
          </div>
        </div>

        <div className="mt-3 flex flex-col divide-y divide-neutral-100 rounded-app border border-neutral-200 dark:divide-neutral-900 dark:border-neutral-800">
          {visibleReceipts.map((order) =>
            order.payment ? (
              <div key={order.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-neutral-900 dark:text-neutral-100">{order.payment.paymentId ?? order.id}</p>
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
            ) : null,
          )}
          {visibleReceipts.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
              {receiptSearch.trim() ? "Nenhum comprovante encontrado para essa busca." : "Nenhum pedido ainda."}
            </p>
          )}
        </div>

        {hiddenReceiptsCount > 0 && (
          <p className="mt-2 text-[11px] text-neutral-500 dark:text-neutral-400">
            Mostrando os {RECEIPTS_LIMIT} mais recentes · {hiddenReceiptsCount} oculto
            {hiddenReceiptsCount === 1 ? "" : "s"}. Use a busca para encontrar um comprovante específico.
          </p>
        )}
      </div>
    </div>
  );
}

function StatTile({ label, value, hint, warn }: { label: string; value: string; hint?: string; warn?: boolean }) {
  return (
    <div className="rounded-app border border-neutral-200 p-4 dark:border-neutral-800">
      <p className="text-[11px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400">{label}</p>
      <p className={`mt-1.5 text-xl font-semibold tracking-tight ${warn ? "text-amber-600 dark:text-amber-400" : "text-neutral-950 dark:text-neutral-50"}`}>
        {value}
      </p>
      {hint && <p className="mt-0.5 text-[11px] text-neutral-400 dark:text-neutral-600">{hint}</p>}
    </div>
  );
}
