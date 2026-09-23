"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { useCheckoutShipping } from "@/hooks/useCheckoutShipping";
import { resetShippingSelection } from "@/lib/checkoutShipping";
import { submitCheckout, type PlacedOrder } from "@/lib/mercadoPago";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

/**
 * `/checkout` page body: the last stop before payment - total, shipping
 * cost, the address (or pickup arrangement) chosen back in `<CartView/>`,
 * every product being bought, and the exchange/return policy spelled out
 * plainly, all on one screen so nothing is a surprise. Refuses to render
 * any of that until `<CartView/>`'s "Confirmar envio" step has actually run
 * (`selection.confirmedAt`), since there's nothing honest to summarize
 * before that.
 *
 * "Finalizar compra" has no real payment gateway to call yet (see
 * `@/lib/mercadoPago`'s doc comment for the Mercado Pago Checkout Pro call
 * this becomes) - it mocks placing the order, then clears the cart and the
 * shipping selection, matching what a real successful checkout would do.
 */
export function CheckoutView() {
  const { items, totalAmount, clearCart } = useCart();
  const { selection } = useCheckoutShipping();
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const shippingCost = selection.method === "melhor_envio" ? selection.quote?.price ?? 0 : 0;
  const total = totalAmount + shippingCost;

  async function handleFinalize() {
    setIsSubmitting(true);
    const order = await submitCheckout(items, { subtotal: totalAmount, shipping: shippingCost, total });
    setPlacedOrder(order);
    clearCart();
    resetShippingSelection();
    setIsSubmitting(false);
  }

  if (placedOrder) {
    return (
      <div className="px-4 md:px-8 py-6">
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-950 text-neutral-50 dark:bg-neutral-100 dark:text-neutral-950">
            ✓
          </span>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50">
            Pedido recebido!
          </h1>
          <p className="max-w-sm text-sm text-neutral-600 dark:text-neutral-400">
            Pedido <span className="font-medium text-neutral-900 dark:text-neutral-100">{placedOrder.id}</span> em{" "}
            {dateFormatter.format(new Date(placedOrder.placedAt))}. Em breve você poderá concluir o pagamento pelo
            Mercado Pago diretamente por aqui - por enquanto, entraremos em contato para combinar os próximos passos.
          </p>
          <Link
            href="/"
            className="mt-2 bg-neutral-950 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-neutral-50 transition-opacity hover:opacity-85 dark:bg-neutral-100 dark:text-neutral-950"
          >
            Voltar para a loja
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="px-4 md:px-8 py-6">
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Seu carrinho está vazio.</p>
          <Link
            href="/"
            className="bg-neutral-950 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-neutral-50 transition-opacity hover:opacity-85 dark:bg-neutral-100 dark:text-neutral-950"
          >
            Ver produtos
          </Link>
        </div>
      </div>
    );
  }

  if (!selection.confirmedAt) {
    return (
      <div className="px-4 md:px-8 py-6">
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Confirme o envio no carrinho antes de continuar para o checkout.
          </p>
          <Link
            href="/cart"
            className="bg-neutral-950 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-neutral-50 transition-opacity hover:opacity-85 dark:bg-neutral-100 dark:text-neutral-950"
          >
            Voltar ao carrinho
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
            <Link href="/cart" className="hover:text-neutral-900 dark:hover:text-neutral-100">
              Carrinho
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-neutral-900 dark:text-neutral-100">Checkout</li>
        </ol>
      </nav>

      <h1 className="text-xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50 md:text-2xl">
        Checkout
      </h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
        <div className="flex flex-col gap-6">
          <div className="border border-neutral-200 p-4 dark:border-neutral-800">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
              Entrega
            </h2>
            {selection.method === "melhor_envio" ? (
              <div className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
                <p>
                  {selection.address
                    ? [selection.address.street, selection.address.neighborhood].filter(Boolean).join(", ")
                    : "Endereço informado"}
                </p>
                {selection.address?.city && (
                  <p className="text-neutral-500 dark:text-neutral-400">
                    {selection.address.city}/{selection.address.state} · CEP {selection.cep}
                  </p>
                )}
                {selection.quote && (
                  <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
                    {selection.quote.carrier} {selection.quote.service} · até {selection.quote.estimatedDays} dias
                    úteis
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
                <p>Retirada/entrega combinada diretamente com o vendedor.</p>
                {selection.customNote && (
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    &ldquo;{selection.customNote}&rdquo;
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="border border-neutral-200 p-4 dark:border-neutral-800">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
              Produtos
            </h2>
            <div className="mt-3 flex flex-col divide-y divide-neutral-100 dark:divide-neutral-900">
              {items.map((item) => (
                <div key={`${item.productId}-${item.color}-${item.size}`} className="flex gap-3 py-3">
                  <div className="relative h-16 w-[52px] shrink-0 overflow-hidden bg-neutral-200 dark:bg-neutral-800">
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

          <div className="border border-neutral-200 p-4 dark:border-neutral-800">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
              Trocas e devoluções
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
              Você pode solicitar troca ou devolução em até 14 dias corridos após o recebimento, desde que o produto
              esteja sem uso e na embalagem original. O frete de devolução por arrependimento é por conta do
              cliente; em caso de defeito, a Scathon cobre o custo. O reembolso ou a troca são processados em até 7
              dias úteis após recebermos o produto.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
          <div className="border border-neutral-200 p-4 dark:border-neutral-800">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
              Total
            </h2>
            <dl className="mt-3 flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-neutral-600 dark:text-neutral-400">Subtotal</dt>
                <dd className="text-neutral-900 dark:text-neutral-100">{currencyFormatter.format(totalAmount)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-600 dark:text-neutral-400">Frete</dt>
                <dd className="text-neutral-900 dark:text-neutral-100">
                  {selection.method === "combinar_com_vendedor" ? "A combinar" : currencyFormatter.format(shippingCost)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-semibold dark:border-neutral-800">
                <dt className="text-neutral-950 dark:text-neutral-50">Total</dt>
                <dd className="text-neutral-950 dark:text-neutral-50">{currencyFormatter.format(total)}</dd>
              </div>
            </dl>
          </div>

          <button
            type="button"
            onClick={handleFinalize}
            disabled={isSubmitting}
            className="w-full bg-neutral-950 py-3.5 text-xs font-semibold uppercase tracking-widest text-neutral-50 transition-opacity hover:opacity-85 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-950"
          >
            {isSubmitting ? "Finalizando..." : "Finalizar compra"}
          </button>
          <p className="text-center text-[11px] text-neutral-500 dark:text-neutral-400">
            Pagamento processado com segurança pelo Mercado Pago (em breve).
          </p>
        </div>
      </div>
    </div>
  );
}
