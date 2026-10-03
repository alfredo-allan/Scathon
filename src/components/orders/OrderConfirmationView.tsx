"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/lib/apiClient";
import { getOrderById, type OrderDetail } from "@/lib/orders";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const ORDER_STATUS_LABEL: Record<OrderDetail["status"], string> = {
  processando: "Processando",
  "a caminho": "A caminho",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

const PAYMENT_METHOD_LABEL: Record<NonNullable<OrderDetail["payment"]>["method"], string> = {
  pix: "Pix",
  credito: "Cartão de crédito",
  boleto: "Boleto",
};

const PAYMENT_STATUS_LABEL: Record<NonNullable<OrderDetail["payment"]>["status"], string> = {
  pending: "Aguardando pagamento",
  approved: "Pagamento aprovado",
  rejected: "Pagamento recusado",
  refunded: "Reembolsado",
};

const PAYMENT_STATUS_STYLE: Record<NonNullable<OrderDetail["payment"]>["status"], string> = {
  pending: "border-amber-300 text-amber-700 dark:border-amber-900 dark:text-amber-400",
  approved: "border-neutral-900 bg-neutral-900 text-neutral-50 dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950",
  rejected: "border-red-300 text-red-600 dark:border-red-900 dark:text-red-400",
  refunded: "border-neutral-300 text-neutral-600 dark:border-neutral-700 dark:text-neutral-400",
};

/**
 * `/pedido/[id]` page body: pra onde `checkout.initPoint` manda o navegador
 * depois de um `POST /checkout` bem-sucedido (ver `@/lib/mercadoPago`'s doc
 * comment) - em modo mock, isso acontece na hora; com o Mercado Pago de
 * verdade, é pra cá que ele redireciona de volta depois do pagamento, com
 * `?status=success|failure|pending` na URL conforme o resultado.
 *
 * Busca o pedido completo (`getOrderById` - `GET /api/v1/orders/{id}`, dono
 * ou admin, 404 genérico pra qualquer outro id) e mostra pagamento, frete e
 * itens. Não depende de nenhum estado local do checkout (`checkoutShipping`,
 * carrinho) - tudo que aparece aqui já está gravado no pedido no servidor,
 * então um refresh da página, ou voltar aqui dias depois pelo histórico de
 * pedidos, mostra exatamente a mesma coisa.
 */
export function OrderConfirmationView({ orderId }: { orderId: string }) {
  const { token, isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  const paymentStatusParam = searchParams.get("status");
  const isMock = searchParams.get("mock") === "true";

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      setOrder(await getOrderById(token, orderId));
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError && error.status === 404
          ? "Não encontramos esse pedido - confira o link ou veja seu histórico em Meus Pedidos."
          : "Não foi possível carregar esse pedido agora. Tente novamente em instantes.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [token, orderId]);

  useEffect(() => {
    Promise.resolve().then(() => load());
  }, [load]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">Entre na sua conta para ver esse pedido.</p>
        <Link
          href="/login"
          className="rounded-app bg-neutral-950 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-neutral-50 transition-opacity hover:opacity-85 dark:bg-neutral-100 dark:text-neutral-950"
        >
          Entrar
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="px-4 md:px-8 py-6">
        <p className="mt-8 text-sm text-neutral-500 dark:text-neutral-400">Carregando pedido…</p>
      </div>
    );
  }

  if (errorMessage || !order) {
    return (
      <div className="px-4 md:px-8 py-6">
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">
            {errorMessage ?? "Não foi possível carregar esse pedido agora."}
          </p>
          <Link
            href="/account/orders"
            className="rounded-app bg-neutral-950 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-neutral-50 transition-opacity hover:opacity-85 dark:bg-neutral-100 dark:text-neutral-950"
          >
            Ver meus pedidos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 py-6">
      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-neutral-900 dark:hover:text-neutral-100">
              Página Inicial
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/account/orders" className="hover:text-neutral-900 dark:hover:text-neutral-100">
              Meus Pedidos
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-neutral-900 dark:text-neutral-100">Pedido {order.id}</li>
        </ol>
      </nav>

      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-950 text-neutral-50 dark:bg-neutral-100 dark:text-neutral-950">
          {order.payment?.status === "rejected" || paymentStatusParam === "failure" ? "!" : "✓"}
        </span>
        <h1 className="text-xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50">
          {order.payment?.status === "rejected" || paymentStatusParam === "failure"
            ? "Pagamento não aprovado"
            : order.payment?.status === "pending" || paymentStatusParam === "pending"
              ? "Pedido recebido - pagamento pendente"
              : "Pedido confirmado!"}
        </h1>
        <p className="max-w-md text-sm text-neutral-600 dark:text-neutral-400">
          Pedido <span className="font-medium text-neutral-900 dark:text-neutral-100">{order.id}</span> em{" "}
          {dateFormatter.format(new Date(order.placedAt))}.
        </p>
        {isMock && (
          <p className="mt-1 max-w-md text-xs text-neutral-500 dark:text-neutral-400">
            Modo de teste: as credenciais reais do Mercado Pago ainda não estão ativas na loja, então esse pagamento
            foi simulado.
          </p>
        )}
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
        <div className="flex flex-col gap-6">
          <div className="rounded-app border border-neutral-200 p-4 dark:border-neutral-800">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
              Produtos
            </h2>
            <div className="mt-3 flex flex-col divide-y divide-neutral-100 dark:divide-neutral-900">
              {order.items.map((item, index) => (
                <div key={`${order.id}-${index}`} className="flex gap-3 py-3">
                  <div className="relative h-16 w-[52px] shrink-0 overflow-hidden rounded-app bg-neutral-200 dark:bg-neutral-800">
                    <Image src={item.imageUrl} alt={item.title} fill unoptimized sizes="52px" className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-neutral-900 dark:text-neutral-100">{item.title}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Cor: {item.color} · Tam: {item.size} · Qtd: {item.quantity}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {currencyFormatter.format(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-app border border-neutral-200 p-4 dark:border-neutral-800">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
              Entrega
            </h2>
            <div className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
              <p>
                {order.shipping.address.recipientName} · {order.shipping.address.street},{" "}
                {order.shipping.address.number}
                {order.shipping.address.complement ? ` - ${order.shipping.address.complement}` : ""}
              </p>
              <p className="text-neutral-500 dark:text-neutral-400">
                {order.shipping.address.neighborhood} - {order.shipping.address.city}/{order.shipping.address.state} ·
                CEP {order.shipping.address.cep}
              </p>
              {order.shipping.method === "melhor_envio" ? (
                <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
                  {order.shipping.carrier ?? "Transportadora"} ·{" "}
                  {order.shipping.cost > 0 ? currencyFormatter.format(order.shipping.cost) : "Frete grátis"}
                </p>
              ) : (
                <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
                  Retirada/entrega combinada diretamente com o vendedor.
                  {order.shipping.note ? ` "${order.shipping.note}"` : ""}
                </p>
              )}
              {order.shipping.trackingCode && (
                <p className="mt-2 text-xs font-medium text-neutral-900 dark:text-neutral-100">
                  Código de rastreio: {order.shipping.trackingCode}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-app border border-neutral-200 p-4 dark:border-neutral-800">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
                Status do pedido
              </h2>
              <span className="border border-neutral-300 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">
                {ORDER_STATUS_LABEL[order.status]}
              </span>
            </div>

            {order.payment && (
              <div className="mt-3 border-t border-neutral-100 pt-3 dark:border-neutral-900">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    Pagamento · {PAYMENT_METHOD_LABEL[order.payment.method]}
                  </p>
                  <span
                    className={`border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${PAYMENT_STATUS_STYLE[order.payment.status]}`}
                  >
                    {PAYMENT_STATUS_LABEL[order.payment.status]}
                  </span>
                </div>
              </div>
            )}

            <dl className="mt-3 flex flex-col gap-2 border-t border-neutral-100 pt-3 text-sm dark:border-neutral-900">
              <div className="flex justify-between">
                <dt className="text-neutral-600 dark:text-neutral-400">Subtotal</dt>
                <dd className="text-neutral-900 dark:text-neutral-100">{currencyFormatter.format(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-600 dark:text-neutral-400">Frete</dt>
                <dd className="text-neutral-900 dark:text-neutral-100">
                  {order.shipping.method === "combinar_com_vendedor"
                    ? "A combinar"
                    : currencyFormatter.format(order.shipping.cost)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-semibold dark:border-neutral-800">
                <dt className="text-neutral-950 dark:text-neutral-50">Total</dt>
                <dd className="text-neutral-950 dark:text-neutral-50">
                  {currencyFormatter.format(order.payment?.grossAmount ?? order.subtotal + order.shipping.cost)}
                </dd>
              </div>
            </dl>
          </div>

          <Link
            href="/account/orders"
            className="w-full rounded-app bg-neutral-950 py-3.5 text-center text-xs font-semibold uppercase tracking-widest text-neutral-50 transition-opacity hover:opacity-85 dark:bg-neutral-100 dark:text-neutral-950"
          >
            Ver meus pedidos
          </Link>
          <Link
            href="/"
            className="w-full rounded-app border border-neutral-300 py-3.5 text-center text-xs font-semibold uppercase tracking-widest text-neutral-900 transition-colors hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-100"
          >
            Voltar para a loja
          </Link>
        </div>
      </div>
    </div>
  );
}
