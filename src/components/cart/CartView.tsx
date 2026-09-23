"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { useCheckoutShipping } from "@/hooks/useCheckoutShipping";
import { useSavedAddresses } from "@/hooks/useSavedAddresses";
import { saveAddress } from "@/lib/addresses";
import { formatCep, isCompleteCep, lookupAddressByCep, type ViaCepAddress } from "@/lib/viaCep";
import { getShippingQuotes, type ShippingQuote } from "@/lib/melhorEnvio";
import { SELLER_WHATSAPP_NUMBER } from "@/lib/layoutConstants";
import type { DeliveryMethod } from "@/lib/checkoutShipping";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/**
 * `/cart` page body: line items with quantity controls, then a "confirmar
 * o envio" step that decides how the order ships before the customer can
 * move on to `/checkout` - either a Melhor Envio quote (CEP → resolved
 * address via ViaCEP → carrier options, same building blocks as
 * `<ShippingEstimator/>`) or "combinar com o vendedor" for a pickup/custom
 * arrangement made directly over WhatsApp. The choice is written to
 * `checkoutShippingStore` (`useCheckoutShipping`) so `<CheckoutView/>` can
 * read it back without redoing any of this work.
 */
export function CartView() {
  const { items, updateQuantity, removeItem, totalAmount } = useCart();
  const { selection, update, confirm } = useCheckoutShipping();
  const savedAddresses = useSavedAddresses();

  const [cepInput, setCepInput] = useState(selection.cep);
  const [lookupStatus, setLookupStatus] = useState<"idle" | "loading" | "done" | "invalid">(
    selection.address ? "done" : "idle",
  );
  const [resolvedAddress, setResolvedAddress] = useState<ViaCepAddress | null>(selection.address);
  const [quotes, setQuotes] = useState<ShippingQuote[]>(selection.quote ? [selection.quote] : []);
  const [addressLabel, setAddressLabel] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [addressComplement, setAddressComplement] = useState("");
  const [saveFeedback, setSaveFeedback] = useState(false);

  const method: DeliveryMethod = selection.method ?? "melhor_envio";
  const isConfirmed = Boolean(selection.confirmedAt);

  async function runLookup(rawCep: string) {
    if (!isCompleteCep(rawCep)) {
      setLookupStatus("invalid");
      setResolvedAddress(null);
      setQuotes([]);
      return;
    }
    setLookupStatus("loading");
    const [address, shippingQuotes] = await Promise.all([
      lookupAddressByCep(rawCep),
      getShippingQuotes(rawCep),
    ]);
    setResolvedAddress(address);
    setQuotes(shippingQuotes);
    setLookupStatus("done");
    update({ cep: formatCep(rawCep), address, quote: null });
  }

  function handleUseSavedAddress(cep: string) {
    const formatted = formatCep(cep);
    setCepInput(formatted);
    runLookup(formatted);
  }

  function handleSelectQuote(quote: ShippingQuote) {
    update({ quote, method: "melhor_envio" });
  }

  function handleSelectMethod(nextMethod: DeliveryMethod) {
    update({ method: nextMethod });
  }

  async function handleSaveAddress() {
    if (!resolvedAddress || !addressLabel.trim() || !addressNumber.trim()) return;
    await saveAddress({
      label: addressLabel.trim(),
      cep: cepInput,
      street: resolvedAddress.street,
      number: addressNumber.trim(),
      complement: addressComplement.trim() || undefined,
      neighborhood: resolvedAddress.neighborhood,
      city: resolvedAddress.city,
      state: resolvedAddress.state,
    });
    setAddressLabel("");
    setAddressNumber("");
    setAddressComplement("");
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2000);
  }

  function handleConfirmShipping() {
    const canConfirm =
      method === "melhor_envio" ? Boolean(selection.quote) : selection.customNote.trim().length > 0;
    if (!canConfirm) return;
    confirm();
  }

  const shippingCost = method === "melhor_envio" ? selection.quote?.price ?? 0 : 0;
  const total = totalAmount + shippingCost;

  const whatsappHref = (() => {
    const lines = items.map((item) => `- ${item.title} (${item.color}, ${item.size}) x${item.quantity}`);
    const message = [
      "Olá! Gostaria de combinar a entrega/retirada do meu pedido na Scathon:",
      ...lines,
      `Total dos produtos: ${currencyFormatter.format(totalAmount)}`,
      selection.customNote.trim() ? `Observação: ${selection.customNote.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    return `https://wa.me/${SELLER_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  })();

  if (items.length === 0) {
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
            <li className="text-neutral-900 dark:text-neutral-100">Carrinho</li>
          </ol>
        </nav>

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
          <li className="text-neutral-900 dark:text-neutral-100">Carrinho</li>
        </ol>
      </nav>

      <h1 className="text-xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50 md:text-2xl">
        Carrinho
      </h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
        {/* Line items */}
        <div className="flex flex-col divide-y divide-neutral-100 border-t border-neutral-200 dark:divide-neutral-900 dark:border-neutral-800">
          {items.map((item) => (
            <div key={`${item.productId}-${item.color}-${item.size}`} className="flex gap-4 py-5">
              <div className="relative h-28 w-[88px] shrink-0 overflow-hidden bg-neutral-200 dark:bg-neutral-800">
                <Image src={item.imageUrl} alt={item.title} fill unoptimized sizes="88px" className="object-cover" />
              </div>

              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{item.title}</p>
                  <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                    Cor: {item.color} · Tam: {item.size}
                  </p>
                  <p className="mt-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {currencyFormatter.format(item.price)}
                  </p>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center border border-neutral-300 dark:border-neutral-700">
                    <button
                      type="button"
                      aria-label={`Diminuir quantidade de ${item.title}`}
                      onClick={() => updateQuantity(item.productId, item.color, item.size, item.quantity - 1)}
                      className="flex h-8 w-8 items-center justify-center text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm text-neutral-900 dark:text-neutral-100">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label={`Aumentar quantidade de ${item.title}`}
                      onClick={() => updateQuantity(item.productId, item.color, item.size, item.quantity + 1)}
                      className="flex h-8 w-8 items-center justify-center text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.productId, item.color, item.size)}
                    className="text-xs text-neutral-500 underline underline-offset-2 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                  >
                    Remover
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary + shipping */}
        <div className="flex flex-col gap-6 lg:sticky lg:top-6 lg:self-start">
          <div className="border border-neutral-200 p-4 dark:border-neutral-800">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
              Resumo
            </h2>
            <dl className="mt-3 flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-neutral-600 dark:text-neutral-400">Subtotal</dt>
                <dd className="text-neutral-900 dark:text-neutral-100">{currencyFormatter.format(totalAmount)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-600 dark:text-neutral-400">Frete</dt>
                <dd className="text-neutral-900 dark:text-neutral-100">
                  {method === "melhor_envio" && selection.quote
                    ? currencyFormatter.format(selection.quote.price)
                    : method === "combinar_com_vendedor"
                      ? "A combinar"
                      : "—"}
                </dd>
              </div>
              <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-semibold dark:border-neutral-800">
                <dt className="text-neutral-950 dark:text-neutral-50">Total</dt>
                <dd className="text-neutral-950 dark:text-neutral-50">{currencyFormatter.format(total)}</dd>
              </div>
            </dl>
          </div>

          <div className="border border-neutral-200 p-4 dark:border-neutral-800">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
              Confirmar envio
            </h2>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => handleSelectMethod("melhor_envio")}
                aria-pressed={method === "melhor_envio"}
                className={`flex-1 border px-3 py-2 text-[11px] font-semibold uppercase tracking-widest transition-colors ${
                  method === "melhor_envio"
                    ? "border-neutral-950 bg-neutral-950 text-neutral-50 dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950"
                    : "border-neutral-300 text-neutral-800 hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-100"
                }`}
              >
                Transportadora
              </button>
              <button
                type="button"
                onClick={() => handleSelectMethod("combinar_com_vendedor")}
                aria-pressed={method === "combinar_com_vendedor"}
                className={`flex-1 border px-3 py-2 text-[11px] font-semibold uppercase tracking-widest transition-colors ${
                  method === "combinar_com_vendedor"
                    ? "border-neutral-950 bg-neutral-950 text-neutral-50 dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950"
                    : "border-neutral-300 text-neutral-800 hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-100"
                }`}
              >
                Combinar com o vendedor
              </button>
            </div>

            {method === "melhor_envio" ? (
              <div className="mt-4">
                {savedAddresses.length > 0 && cepInput.length === 0 && (
                  <div className="mb-3 flex flex-wrap items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                    <span>Entregar em um endereço salvo?</span>
                    {savedAddresses.map((saved) => (
                      <button
                        key={saved.id}
                        type="button"
                        onClick={() => handleUseSavedAddress(saved.cep)}
                        className="border border-neutral-300 px-2 py-1 text-[11px] font-medium text-neutral-800 transition-colors hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-100 dark:hover:border-neutral-500"
                      >
                        {saved.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cepInput}
                    onChange={(event) => {
                      const formatted = formatCep(event.target.value);
                      setCepInput(formatted);
                      if (!isCompleteCep(formatted)) {
                        setLookupStatus("idle");
                        setResolvedAddress(null);
                        setQuotes([]);
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") runLookup(cepInput);
                    }}
                    placeholder="00000-000"
                    maxLength={9}
                    className="w-full max-w-[160px] border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-500"
                  />
                  <button
                    type="button"
                    onClick={() => runLookup(cepInput)}
                    disabled={lookupStatus === "loading"}
                    className="border border-neutral-950 dark:border-neutral-100 bg-neutral-950 dark:bg-neutral-100 px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-neutral-50 dark:text-neutral-950 transition-opacity hover:opacity-80 disabled:opacity-50"
                  >
                    {lookupStatus === "loading" ? "..." : "Calcular"}
                  </button>
                </div>

                {lookupStatus === "invalid" && (
                  <p className="mt-2 text-xs text-red-600 dark:text-red-400">Digite um CEP válido com 8 dígitos.</p>
                )}

                {resolvedAddress && (resolvedAddress.street || resolvedAddress.city) && (
                  <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                    {[resolvedAddress.street, resolvedAddress.neighborhood].filter(Boolean).join(", ")}
                    {resolvedAddress.city ? ` — ${resolvedAddress.city}/${resolvedAddress.state}` : ""}
                  </p>
                )}

                {quotes.length > 0 && (
                  <div className="mt-3 flex flex-col gap-2">
                    {quotes.map((quote) => {
                      const isActive = selection.quote?.id === quote.id;
                      return (
                        <button
                          key={quote.id}
                          type="button"
                          aria-pressed={isActive}
                          onClick={() => handleSelectQuote(quote)}
                          className={`flex items-center justify-between border px-3 py-2 text-left text-xs transition-colors ${
                            isActive
                              ? "border-neutral-950 dark:border-neutral-100"
                              : "border-neutral-300 hover:border-neutral-500 dark:border-neutral-700 dark:hover:border-neutral-500"
                          }`}
                        >
                          <span className="text-neutral-800 dark:text-neutral-100">
                            {quote.carrier} {quote.service} · até {quote.estimatedDays} dias úteis
                          </span>
                          <span className="font-semibold text-neutral-950 dark:text-neutral-50">
                            {currencyFormatter.format(quote.price)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {resolvedAddress && (resolvedAddress.street || resolvedAddress.city) && (
                  <div className="mt-4 border-t border-neutral-100 pt-3 dark:border-neutral-900">
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Salvar este endereço:</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <input
                        type="text"
                        value={addressLabel}
                        onChange={(event) => setAddressLabel(event.target.value)}
                        placeholder="Nome (ex: Casa)"
                        className="min-w-0 flex-1 border border-neutral-300 dark:border-neutral-700 bg-transparent px-2.5 py-2 text-xs outline-none placeholder:text-neutral-400 focus:border-neutral-500"
                      />
                      <input
                        type="text"
                        value={addressNumber}
                        onChange={(event) => setAddressNumber(event.target.value)}
                        placeholder="Número"
                        className="w-20 border border-neutral-300 dark:border-neutral-700 bg-transparent px-2.5 py-2 text-xs outline-none placeholder:text-neutral-400 focus:border-neutral-500"
                      />
                      <input
                        type="text"
                        value={addressComplement}
                        onChange={(event) => setAddressComplement(event.target.value)}
                        placeholder="Complemento"
                        className="min-w-0 flex-1 border border-neutral-300 dark:border-neutral-700 bg-transparent px-2.5 py-2 text-xs outline-none placeholder:text-neutral-400 focus:border-neutral-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveAddress}
                      disabled={!addressLabel.trim() || !addressNumber.trim()}
                      className="mt-2 text-[11px] font-semibold uppercase tracking-widest text-neutral-900 underline underline-offset-4 hover:opacity-70 disabled:opacity-40 dark:text-neutral-100"
                    >
                      {saveFeedback ? "Endereço salvo ✓" : "Salvar endereço"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4">
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  Combine a retirada ou uma forma alternativa de entrega diretamente com o vendedor.
                </p>
                <textarea
                  value={selection.customNote}
                  onChange={(event) => update({ customNote: event.target.value, method: "combinar_com_vendedor" })}
                  placeholder="Ex: prefiro retirar na loja no sábado à tarde"
                  rows={3}
                  className="mt-2 w-full resize-none border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-500"
                />
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-neutral-800 underline underline-offset-2 hover:text-neutral-950 dark:text-neutral-200 dark:hover:text-neutral-50"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                    <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.2c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-.7-.3-1.4-.7-2-1.3-.5-.5-1-1.1-1.4-1.7-.1-.2 0-.4.1-.5l.4-.5c.1-.2.1-.3.2-.5.1-.2 0-.4 0-.5l-.7-1.7c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.7.7-1 1.5-1 2.4.1 1.1.5 2.1 1.2 3 1 1.5 2.3 2.7 3.9 3.5.5.2.9.4 1.4.5.6.2 1.2.2 1.8.1.6-.1 1.4-.6 1.6-1.2.2-.6.2-1.1.1-1.2-.1-.1-.2-.2-.4-.3Z" />
                  </svg>
                  Falar com o vendedor no WhatsApp
                </a>
              </div>
            )}

            {isConfirmed ? (
              <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3 text-xs dark:border-neutral-900">
                <span className="font-medium text-neutral-900 dark:text-neutral-100">Envio confirmado ✓</span>
                <button
                  type="button"
                  onClick={() => update({})}
                  className="text-neutral-500 underline underline-offset-2 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                >
                  Alterar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleConfirmShipping}
                className="mt-4 w-full bg-neutral-950 py-3 text-xs font-semibold uppercase tracking-widest text-neutral-50 transition-opacity hover:opacity-85 disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-950"
                disabled={method === "melhor_envio" ? !selection.quote : selection.customNote.trim().length === 0}
              >
                Confirmar envio
              </button>
            )}
          </div>

          {isConfirmed ? (
            <Link
              href="/checkout"
              className="w-full bg-neutral-950 py-3.5 text-center text-xs font-semibold uppercase tracking-widest text-neutral-50 transition-opacity hover:opacity-85 dark:bg-neutral-100 dark:text-neutral-950"
            >
              Ir para o checkout
            </Link>
          ) : (
            <p className="text-center text-xs text-neutral-500 dark:text-neutral-400">
              Confirme o envio acima para continuar para o checkout.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
