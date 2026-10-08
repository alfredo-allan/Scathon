"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  getAdminOrders,
  updateOrderStatus,
  uploadOrderInvoice,
  type AdminOrder,
  type OrderStatus,
} from "@/lib/adminOrders";
import { ImageLightbox, ORDER_STATUS_LABEL, ORDER_STATUS_STYLE, PaymentStatusBadge } from "./adminShared";

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

const STATUS_OPTIONS: OrderStatus[] = ["processando", "a caminho", "entregue", "cancelado"];

/**
 * Remove acento/maiúscula pra busca - "joão" encontra "João", "SCT-100482"
 * encontra "sct-100482". Pedido do Alfredo (2026-10-08): filtrar pedido por
 * nome do cliente ou número do pedido.
 */
function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * "Pedidos" tab: todo pedido de toda a loja (`GET /api/v1/admin/orders` -
 * ver `@/lib/adminOrders`), com o status editável inline
 * (`PATCH /admin/orders/{id}/status`) - o painel mockado original só exibia
 * o status, nunca deixava mudar; como o backend já suporta isso desde a
 * fase 6, faz sentido o painel usar de verdade.
 */
export function AdminOrdersTab() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<OrderStatus | "todos">("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  // Rascunho do campo "código de rastreio" por pedido - separado de
  // `orders` pra digitar sem re-renderizar a lista inteira a cada tecla;
  // inicializado com o valor já salvo (`order.trackingCode`) assim que a
  // lista carrega.
  const [trackingDrafts, setTrackingDrafts] = useState<Record<string, string>>({});
  const [savingTrackingId, setSavingTrackingId] = useState<string | null>(null);
  const [uploadingInvoiceId, setUploadingInvoiceId] = useState<string | null>(null);
  const [invoiceLightboxOrder, setInvoiceLightboxOrder] = useState<AdminOrder | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const fetched = await getAdminOrders(token);
      setOrders(fetched);
      setTrackingDrafts(Object.fromEntries(fetched.map((order) => [order.id, order.trackingCode ?? ""])));
    } catch {
      setErrorMessage("Não foi possível carregar os pedidos agora.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    Promise.resolve().then(() => load());
  }, [load]);

  const filteredOrders = useMemo(() => {
    const sorted = [...orders].sort((a, b) => (a.placedAt < b.placedAt ? 1 : -1));
    const byStatus = filter === "todos" ? sorted : sorted.filter((order) => order.status === filter);
    const query = normalizeSearchText(searchQuery.trim());
    if (!query) return byStatus;
    return byStatus.filter((order) =>
      [order.id, order.customerName, order.customerEmail].some((field) =>
        normalizeSearchText(field).includes(query),
      ),
    );
  }, [orders, filter, searchQuery]);

  async function handleStatusChange(orderId: string, status: OrderStatus) {
    if (!token) return;
    setUpdatingId(orderId);
    try {
      // Sem `trackingCode` aqui de propósito - só o status muda, o código de
      // rastreio já salvo (se houver) fica como está (ver doc comment de
      // `updateOrderStatus` em `@/lib/adminOrders`).
      await updateOrderStatus(token, orderId, status);
      setOrders((current) => current.map((order) => (order.id === orderId ? { ...order, status } : order)));
    } catch {
      setErrorMessage("Não foi possível atualizar o status desse pedido agora.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleSaveTracking(order: AdminOrder) {
    if (!token) return;
    const trimmed = (trackingDrafts[order.id] ?? "").trim();
    setSavingTrackingId(order.id);
    setErrorMessage(null);
    try {
      await updateOrderStatus(token, order.id, order.status, trimmed || null);
      setOrders((current) =>
        current.map((item) => (item.id === order.id ? { ...item, trackingCode: trimmed || null } : item)),
      );
      setTrackingDrafts((current) => ({ ...current, [order.id]: trimmed }));
    } catch {
      setErrorMessage("Não foi possível salvar o código de rastreio agora.");
    } finally {
      setSavingTrackingId(null);
    }
  }

  async function handleUploadInvoice(order: AdminOrder, file: File) {
    if (!token) return;
    setUploadingInvoiceId(order.id);
    setErrorMessage(null);
    try {
      const updated = await uploadOrderInvoice(token, order.id, file);
      setOrders((current) =>
        current.map((item) => (item.id === order.id ? { ...item, invoiceUrl: updated.invoiceUrl } : item)),
      );
    } catch {
      setErrorMessage("Não foi possível anexar a nota fiscal agora.");
    } finally {
      setUploadingInvoiceId(null);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-neutral-500 dark:text-neutral-400">Carregando pedidos…</p>;
  }

  if (errorMessage && orders.length === 0) {
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
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setFilter(option.id)}
              className={`rounded-app border px-3 py-1.5 text-xs font-semibold uppercase tracking-widest transition-colors md:px-4 md:py-2 md:text-sm ${
                filter === option.id
                  ? "border-neutral-950 bg-neutral-950 text-neutral-50 dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950"
                  : "border-neutral-300 text-neutral-600 hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-400"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* `type="search"` dá um "x" nativo pra limpar no desktop; full-width
            no celular (empilha abaixo dos filtros de status via `flex-col`
            acima) em vez de espremer ao lado deles numa linha só. */}
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
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Buscar por cliente ou nº do pedido"
            className="w-full rounded-app border border-neutral-300 bg-transparent py-2 pl-9 pr-3 text-sm text-neutral-900 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:text-neutral-100 dark:focus:border-neutral-100"
          />
        </div>
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
              <select
                value={order.status}
                disabled={updatingId === order.id}
                onChange={(event) => handleStatusChange(order.id, event.target.value as OrderStatus)}
                className={`rounded-app border bg-transparent px-2 py-1 text-[10px] font-semibold uppercase tracking-widest outline-none disabled:opacity-50 md:px-3 md:py-2 md:text-xs ${ORDER_STATUS_STYLE[order.status]}`}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status} className="bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100">
                    {ORDER_STATUS_LABEL[status]}
                  </option>
                ))}
              </select>
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

            <div className="flex flex-wrap items-center gap-2 border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
              <label
                htmlFor={`tracking-${order.id}`}
                className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400"
              >
                Código de rastreio
              </label>
              <input
                id={`tracking-${order.id}`}
                type="text"
                value={trackingDrafts[order.id] ?? ""}
                onChange={(event) =>
                  setTrackingDrafts((current) => ({ ...current, [order.id]: event.target.value }))
                }
                placeholder="Ex.: BR1234567890BR"
                className="min-w-[160px] flex-1 rounded-app border border-neutral-300 bg-transparent px-2 py-1.5 text-xs text-neutral-900 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:text-neutral-100 dark:focus:border-neutral-100"
              />
              <button
                type="button"
                onClick={() => handleSaveTracking(order)}
                disabled={
                  savingTrackingId === order.id ||
                  (trackingDrafts[order.id] ?? "").trim() === (order.trackingCode ?? "")
                }
                className="rounded-app border border-neutral-300 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-900 transition-colors hover:border-neutral-500 disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-100 dark:hover:border-neutral-500"
              >
                {savingTrackingId === order.id ? "Salvando…" : "Salvar"}
              </button>
              {order.trackingCode && (trackingDrafts[order.id] ?? "").trim() === order.trackingCode && (
                <span className="text-[10px] text-green-700 dark:text-green-500">Salvo</span>
              )}
              <span className="basis-full text-[10px] text-neutral-500 dark:text-neutral-400">
                Salvar avisa o cliente por e-mail, com o código incluído.
              </span>
            </div>

            {/* Nota fiscal/comprovante - pedido do Alfredo (2026-10-08),
                mesmo espírito do rastreio acima: anexar já encaminha a foto
                pro cliente por e-mail (ver `POST /admin/orders/{id}/invoice`).
                O `<label>` em volta do `<input type="file">` (escondido via
                `sr-only`, não `display:none` - precisa continuar focável/
                acessível) vira um botão grande e estilizado - bem mais fácil
                de tocar no celular do que o input de arquivo nativo, que
                varia de tamanho/aparência por navegador. */}
            <div className="flex flex-wrap items-center gap-2 border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                Nota fiscal
              </span>

              {order.invoiceUrl && (
                <button
                  type="button"
                  onClick={() => setInvoiceLightboxOrder(order)}
                  aria-label={`Ver nota fiscal do pedido ${order.id} em destaque`}
                  className="group relative h-11 w-11 shrink-0 overflow-hidden rounded-app ring-1 ring-neutral-200 transition-all hover:ring-2 hover:ring-neutral-400 dark:ring-neutral-800 dark:hover:ring-neutral-600"
                >
                  <Image
                    src={order.invoiceUrl}
                    alt={`Nota fiscal do pedido ${order.id}`}
                    fill
                    unoptimized
                    sizes="44px"
                    className="object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                </button>
              )}

              <label
                htmlFor={`invoice-${order.id}`}
                className={`rounded-app border border-neutral-300 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-900 transition-colors hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-100 dark:hover:border-neutral-500 ${
                  uploadingInvoiceId === order.id ? "pointer-events-none opacity-40" : "cursor-pointer"
                }`}
              >
                {uploadingInvoiceId === order.id ? "Enviando…" : order.invoiceUrl ? "Trocar foto" : "Anexar foto"}
              </label>
              <input
                id={`invoice-${order.id}`}
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={uploadingInvoiceId === order.id}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  // Zera o valor - sem isso, escolher o MESMO arquivo de novo
                  // (ex.: depois de uma falha) não dispara `onChange` de novo.
                  event.target.value = "";
                  if (file) handleUploadInvoice(order, file);
                }}
              />

              <span className="basis-full text-[10px] text-neutral-500 dark:text-neutral-400">
                Anexar envia a nota por e-mail pro cliente na hora.
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 bg-neutral-50 px-4 py-3 text-xs dark:border-neutral-800 dark:bg-neutral-900/40">
              <div className="flex flex-wrap items-center gap-4 text-neutral-600 dark:text-neutral-400">
                <span>
                  Envio: {order.shippingMethod === "melhor_envio" ? order.shippingCarrier ?? "Melhor Envio" : "Combinado com o vendedor"}
                  {order.shippingCost > 0 ? ` · ${currencyFormatter.format(order.shippingCost)}` : ""}
                </span>
                {order.payment && (
                  <span className="flex items-center gap-1.5">
                    {order.payment.paymentId ?? "—"} · {METHOD_LABEL[order.payment.method]} ·{" "}
                    <PaymentStatusBadge status={order.payment.status} />
                  </span>
                )}
              </div>
              <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                Total: {currencyFormatter.format((order.payment?.grossAmount ?? 0) + order.shippingCost)}
              </p>
            </div>
          </div>
        ))}

        {filteredOrders.length === 0 && (
          <p className="py-12 text-center text-sm text-neutral-500 dark:text-neutral-400">
            {searchQuery.trim() ? "Nenhum pedido encontrado para essa busca." : "Nenhum pedido com esse status."}
          </p>
        )}
      </div>

      {invoiceLightboxOrder?.invoiceUrl && (
        <ImageLightbox
          src={invoiceLightboxOrder.invoiceUrl}
          alt={`Nota fiscal do pedido ${invoiceLightboxOrder.id}`}
          caption={`Pedido ${invoiceLightboxOrder.id}`}
          onClose={() => setInvoiceLightboxOrder(null)}
        />
      )}
    </div>
  );
}
