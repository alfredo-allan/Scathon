"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useCheckoutShipping } from "@/hooks/useCheckoutShipping";
import { resetShippingSelection } from "@/lib/checkoutShipping";
import { submitCheckout, type PaymentMethod } from "@/lib/mercadoPago";
import { PixPaymentModal } from "./PixPaymentModal";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const PAYMENT_METHODS: { value: PaymentMethod; label: string; hint: string }[] = [
  { value: "pix", label: "Pix", hint: "Aprovação imediata" },
  { value: "credito", label: "Cartão de crédito", hint: "Em até 12x" },
  { value: "boleto", label: "Boleto", hint: "Compensa em até 3 dias úteis" },
];

/**
 * `/checkout` page body: a última parada antes do pagamento - total, custo
 * de frete, o endereço (ou combinação com o vendedor) escolhido lá no
 * `<CartView/>`, cada produto da compra, a forma de pagamento, e a política
 * de troca/devolução bem explícita, tudo numa tela só. Só renderiza isso
 * depois que o "Confirmar envio" do `<CartView/>` já rodou
 * (`selection.confirmedAt`) e o cliente está logado - sem as duas coisas
 * não há `addressId` nenhum pra mandar pro backend.
 *
 * "Finalizar compra" agora fecha o pedido de verdade (`POST /api/v1/checkout`
 * via `@/lib/mercadoPago`'s `submitCheckout` - fase 4 do roadmap). A resposta
 * já vem com o frete re-cotado e o estoque validado no servidor (nunca
 * confia no que o carrinho local mostra). O que acontece depois depende do
 * `checkout.method` (ampliação da Fase 6, parte 2): Pix abre
 * `<PixPaymentModal/>` com o QR Code/copia-e-cola, sem sair daqui; cartão/
 * boleto redirecionam pro Checkout Pro via `checkout.initPoint` (em modo
 * mock, sem credenciais do Mercado Pago na VPS, isso já aponta pra própria
 * `/pedido/{id}` com `?mock=true`).
 */
export function CheckoutView() {
  const { token, isAuthenticated } = useAuth();
  const { items, totalAmount, clearCart } = useCart();
  const { selection } = useCheckoutShipping();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Só preenchido quando o checkout volta com `method: "pix"` (ver
  // `<PixPaymentModal/>`) - crédito/boleto continuam redirecionando direto
  // pro Checkout Pro, sem passar por aqui.
  const [pixPayment, setPixPayment] = useState<{
    orderId: string;
    qrCode: string;
    qrCodeBase64: string;
  } | null>(null);

  const shippingCost = selection.method === "melhor_envio" ? selection.quote?.price ?? 0 : 0;
  const total = totalAmount + shippingCost;

  async function handleFinalize() {
    if (!token || !selection.addressId || !selection.method) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const result = await submitCheckout(token, {
        addressId: selection.addressId,
        items: items.map((item) => ({
          productId: item.productId,
          color: item.color,
          size: item.size,
          quantity: item.quantity,
        })),
        deliveryMethod: selection.method,
        shippingQuoteId: selection.method === "melhor_envio" ? selection.quote?.id ?? null : null,
        shippingNote: selection.method === "combinar_com_vendedor" ? selection.customNote : null,
        paymentMethod,
      });
      clearCart();
      resetShippingSelection();
      // O pedido já existe no banco (estoque reservado) a essa altura,
      // então a sacola é limpa de qualquer forma - só o jeito de CONCLUIR o
      // pagamento muda conforme `checkout.method` (ver doc comment de
      // `SubmitCheckoutResult` em `@/lib/mercadoPago`).
      if (result.checkout.method === "pix" && result.checkout.pix) {
        setPixPayment({
          orderId: result.order.id,
          qrCode: result.checkout.pix.qrCode,
          qrCodeBase64: result.checkout.pix.qrCodeBase64,
        });
        setIsSubmitting(false);
      } else if (result.checkout.initPoint) {
        window.location.href = result.checkout.initPoint;
      }
    } catch {
      setErrorMessage(
        "Não foi possível fechar o pedido agora - o estoque ou o frete pode ter mudado. Volte ao carrinho e tente de novo.",
      );
      setIsSubmitting(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="px-4 md:px-8 py-6">
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Entre na sua conta para finalizar a compra.</p>
          <Link
            href="/login"
            className="rounded-app bg-neutral-950 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-neutral-50 transition-opacity hover:opacity-85 dark:bg-neutral-100 dark:text-neutral-950"
          >
            Entrar
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
            className="rounded-app bg-neutral-950 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-neutral-50 transition-opacity hover:opacity-85 dark:bg-neutral-100 dark:text-neutral-950"
          >
            Ver produtos
          </Link>
        </div>
      </div>
    );
  }

  if (!selection.confirmedAt || !selection.addressId || !selection.method) {
    return (
      <div className="px-4 md:px-8 py-6">
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Confirme o envio no carrinho antes de continuar para o checkout.
          </p>
          <Link
            href="/cart"
            className="rounded-app bg-neutral-950 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-neutral-50 transition-opacity hover:opacity-85 dark:bg-neutral-100 dark:text-neutral-950"
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
          <div className="rounded-app border border-neutral-200 p-4 dark:border-neutral-800">
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

          <div className="rounded-app border border-neutral-200 p-4 dark:border-neutral-800">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
              Produtos
            </h2>
            <div className="mt-3 flex flex-col divide-y divide-neutral-100 dark:divide-neutral-900">
              {items.map((item) => (
                <div key={`${item.productId}-${item.color}-${item.size}`} className="flex gap-3 py-3">
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
              Pagamento
            </h2>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              {PAYMENT_METHODS.map((option) => {
                const isActive = paymentMethod === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setPaymentMethod(option.value)}
                    className={`flex-1 rounded-app border px-3 py-2.5 text-left text-xs transition-colors ${
                      isActive
                        ? "border-neutral-950 bg-neutral-950 text-neutral-50 dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950"
                        : "border-neutral-300 text-neutral-800 hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-100"
                    }`}
                  >
                    <span className="block font-semibold uppercase tracking-widest">{option.label}</span>
                    <span className={`mt-0.5 block ${isActive ? "opacity-80" : "text-neutral-500 dark:text-neutral-400"}`}>
                      {option.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-app border border-neutral-200 p-4 dark:border-neutral-800">
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
          <div className="rounded-app border border-neutral-200 p-4 dark:border-neutral-800">
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

          {errorMessage && <p className="text-xs text-red-600 dark:text-red-400">{errorMessage}</p>}

          <button
            type="button"
            onClick={handleFinalize}
            disabled={isSubmitting}
            className="w-full rounded-app bg-neutral-950 py-3.5 text-xs font-semibold uppercase tracking-widest text-neutral-50 transition-opacity hover:opacity-85 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-950"
          >
            {isSubmitting ? "Finalizando..." : "Finalizar compra"}
          </button>
          <p className="text-center text-[11px] text-neutral-500 dark:text-neutral-400">
            Pagamento processado com segurança pelo Mercado Pago.
          </p>
        </div>
      </div>

      {pixPayment && token && (
        <PixPaymentModal
          token={token}
          orderId={pixPayment.orderId}
          qrCode={pixPayment.qrCode}
          qrCodeBase64={pixPayment.qrCodeBase64}
          onClose={() => setPixPayment(null)}
        />
      )}
    </div>
  );
}
